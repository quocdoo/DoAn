
// Hàm chuyển Tab dùng chung cho toàn bộ web
function switchTab(tabId) {
    // 1. Tìm tất cả các tab-content và ẩn chúng đi
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none'; // Đảm bảo ẩn triệt để
    });

    // 2. Tìm tab được người dùng click và hiện nó lên
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block'; // Hiển thị tab mới
    } else {
        console.error("Không tìm thấy section nào có id là: " + tabId);
    }

    // 3. Cập nhật màu sắc cho thanh Sidebar (tùy chọn)
    const allLinks = document.querySelectorAll('.nav-links li');
    allLinks.forEach(link => link.classList.remove('active'));
    
    // Tìm thẻ li nào có chứa chữ cái gọi hàm để tô màu
    event.currentTarget.classList.add('active');
}

// --- READING LOGIC ---
// --- READING LOGIC NÂNG CẤP ---
let currentReadingQuestions = []; 
let totalReadingQuestions = 0;

// 1. Gọi API lấy danh sách đề
async function fetchReadingList() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/reading-passages');
        const passages = await res.json();
        
        const dropdown = document.getElementById('reading-topic');
        dropdown.innerHTML = '<option value="" disabled selected>-- Chọn đề Reading --</option>';
        passages.forEach(p => dropdown.innerHTML += `<option value="${p.id}">${p.title}</option>`);
    } catch (error) {
        console.error("Lỗi tải danh sách đề:", error);
    }
}

// 2. Load chi tiết đề và Render UI
async function loadReadingTest() {
    const passageId = document.getElementById('reading-topic').value;
    if (!passageId) return;

    // Reset UI
    document.getElementById('reading-score-display').style.display = 'none';
    const btnSubmit = document.getElementById('btn-submit-reading');
    btnSubmit.style.display = 'block';
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'NỘP BÀI & CHẤM ĐIỂM';
    btnSubmit.style.backgroundColor = ''; 
    btnSubmit.style.boxShadow = '';
    btnSubmit.style.transform = '';
    updateProgressBar(0, 10); // Reset progress

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/reading-test/${passageId}`);
        const data = await res.json();

        document.getElementById('reading-passage-text').innerHTML = `<p>${data.passage.content}</p>`;
        currentReadingQuestions = data.questions;
        totalReadingQuestions = data.questions.length;
        
        const container = document.getElementById('reading-questions-container');
        container.innerHTML = ''; 

        const alphabet = ['A', 'B', 'C', 'D'];

        data.questions.forEach((q, index) => {
            let optionsHTML = '';
            
            // --- FIX: Ensure options are an array ---
            let optionsArray = q.options;
            if (typeof optionsArray === 'string') {
                 // Try parsing first, in case it's a JSON string
                 try {
                     optionsArray = JSON.parse(optionsArray);
                 } catch (e) {
                     // If parsing fails, it might be a raw string, split it if needed (though backend should handle this)
                     optionsArray = [optionsArray]; 
                 }
            }
             // Ensure it's an array even if empty or undefined
             if (!Array.isArray(optionsArray)) {
                 optionsArray = [];
             }
            // ----------------------------------------

            optionsArray.forEach((opt, i) => {
                const radioId = `q${q.id}_${i}`; 
                const letter = alphabet[i] || ''; // Lấy chữ cái A, B, C, D
                
                optionsHTML += `
                    <label class="reading-option" for="${radioId}" id="label_${radioId}" onclick="selectOption('${q.id}', '${radioId}')">
                        <input type="radio" id="${radioId}" name="question_${q.id}" value="${opt}">
                        <div class="radio-circle">${letter}</div>
                        <div class="option-text">${opt}</div>
                    </label>
                `;
            });

            container.innerHTML += `
                <div class="reading-question-block" id="block_${q.id}">
                    <div class="reading-question-text">Câu ${index + 1}: ${q.question_text}</div>
                    ${optionsHTML}
                </div>
            `;
        });
        
        updateProgressBar(0, totalReadingQuestions);

    } catch (error) {
        console.error("Lỗi tải nội dung đề Reading:", error);
    }
}

// 3. Hàm xử lý khi click chọn đáp án (đổi màu & cập nhật Progress Bar)
function selectOption(questionId, radioId) {
    // Xóa class 'selected' của tất cả các đáp án trong câu hỏi này
    const allLabels = document.querySelectorAll(`input[name="question_${questionId}"]`);
    allLabels.forEach(input => {
        document.getElementById(`label_${input.id}`).classList.remove('selected');
    });

    // Thêm class 'selected' cho đáp án vừa click
    document.getElementById(`label_${radioId}`).classList.add('selected');

    // Đếm số câu đã làm để cập nhật Progress Bar
    const answeredCount = document.querySelectorAll('.reading-option.selected').length;
    updateProgressBar(answeredCount, totalReadingQuestions);
}

// Hàm cập nhật UI Progress Bar
function updateProgressBar(answered, total) {
    if (total === 0) return;
    const percentage = (answered / total) * 100;
    document.getElementById('reading-progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${answered}/${total}`;
}

// 4. Chấm điểm
function submitReading() {
    let score = 0;

    currentReadingQuestions.forEach(q => {
        const selectedRadio = document.querySelector(`input[name="question_${q.id}"]:checked`);
        const allLabelsInBlock = document.querySelectorAll(`input[name="question_${q.id}"]`);
        
        // Khóa tất cả, không cho click nữa
        allLabelsInBlock.forEach(input => {
            document.getElementById(`label_${input.id}`).classList.add('disabled');
        });

        if (selectedRadio) {
            const userAnswer = selectedRadio.value;
            const userLabel = document.getElementById(`label_${selectedRadio.id}`);
            
            if (userAnswer === q.correct_answer) {
                score++;
                userLabel.classList.add('correct-answer');
                userLabel.classList.remove('selected');
            } else {
                userLabel.classList.add('wrong-answer');
                userLabel.classList.remove('selected');
                
                // Highlight đáp án đúng
                const correctInput = Array.from(allLabelsInBlock).find(input => input.value === q.correct_answer);
                if (correctInput) document.getElementById(`label_${correctInput.id}`).classList.add('correct-answer');
            }
        } else {
            // Nếu không chọn gì, chỉ highlight đáp án đúng
            const correctInput = Array.from(allLabelsInBlock).find(input => input.value === q.correct_answer);
            if (correctInput) document.getElementById(`label_${correctInput.id}`).classList.add('correct-answer');
        }
    });

    // Cập nhật điểm
    document.getElementById('reading-score').textContent = score;
    document.getElementById('reading-total-score').textContent = `/${totalReadingQuestions}`;
    document.getElementById('reading-score-display').style.display = 'block';

    const btn = document.getElementById('btn-submit-reading');
    btn.textContent = 'ĐÃ NỘP BÀI';
    btn.disabled = true;
    btn.style.backgroundColor = 'var(--text-muted)';
    btn.style.boxShadow = 'none';
    btn.style.transform = 'translateY(4px)'; // Giữ trạng thái lún xuống
}

document.addEventListener('DOMContentLoaded', fetchReadingList);

// --- WRITING LOGIC ---
const writingArea = document.getElementById('writing-area');
const wordCountDisplay = document.getElementById('word-count');

if (writingArea) {
    writingArea.addEventListener('input', function() {
        const text = this.value.trim();
        // Đếm số từ, bỏ qua khoảng trắng thừa
        const words = text === "" ? 0 : text.split(/\s+/).length;
        wordCountDisplay.textContent = `${words} từ`;
        
        // Cảnh báo màu sắc nếu chưa đạt chuẩn số từ
        if (words < 50 || words > 100) {
            wordCountDisplay.style.color = 'var(--error)'; 
        } else {
            wordCountDisplay.style.color = 'var(--primary-color)'; 
        }
    });
}

async function submitWriting() {
    const text = writingArea.value.trim();
    const topic = document.getElementById('writing-topic').value;
    const words = text === "" ? 0 : text.split(/\s+/).length;
    const submitBtn = document.getElementById('btn-submit-writing');
    const resultArea = document.getElementById('writing-result');

    // Kiểm tra ràng buộc số từ
    if (words < 50 || words > 100) {
        alert(`Bài viết của bạn đang có ${words} từ. Vui lòng viết trong khoảng 50 - 100 từ để AI chấm chính xác nhất!`);
        return;
    }

    // Hiển thị trạng thái loading
    submitBtn.textContent = "Đang chấm điểm đợi xíu nhóo... ";
    submitBtn.disabled = true;
    resultArea.style.display = 'none';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/evaluate-writing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, topic: topic })
        });

        const data = await response.json();

        if (data.error) {
            alert("Lỗi: " + data.error);
        } else {
            // Render kết quả lên màn hình
            document.getElementById('writing-score').textContent = data.score;
            document.getElementById('writing-corrected').textContent = data.corrected_text;
            
            const errorsContainer = document.getElementById('writing-errors');
            errorsContainer.innerHTML = ''; // Xóa sạch dữ liệu cũ
            
            // Xử lý render danh sách lỗi
            if (data.errors && data.errors.length > 0) {
                data.errors.forEach(err => {
                    errorsContainer.innerHTML += `
                        <div class="error-item">
                            <p><strike>${err.original}</strike> ➔ <span class="correction">${err.correction}</span></p>
                            <p class="explanation">💡 <strong>Giải thích:</strong> ${err.explanation}</p>
                        </div>
                    `;
                });
            } else {
                errorsContainer.innerHTML = `
                    <div class="error-item" style="border-left-color: var(--success); background-color: var(--light-green);">
                        <p style="color: var(--primary-hover); font-weight: 800; font-size: 16px;">
                            🎉 Xuất sắc! Bài viết của bạn rất tự nhiên và không có lỗi ngữ pháp nào.
                        </p>
                    </div>`;
            }
            
            resultArea.style.display = 'block'; // Hiện bảng điểm lên
        }
    } catch (error) {
        console.error("Lỗi khi gọi API chấm điểm:", error);
        alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend.");
    } finally {
        submitBtn.textContent = "Nộp bài chấm điểm";
        submitBtn.disabled = false;
    }
}

// Grammar Logic
// --- GRAMMAR DATA: 12 TENSES ---
let tensesData = []; 
let currentPracticeAnswer = "";

// Hàm gọi API từ Backend Python
async function fetchGrammarData() {
    try {
        // Gọi tới server Flask đang chạy ở cổng 5000
        const response = await fetch('http://127.0.0.1:5000/api/tenses'); 
        
        tensesData = await response.json();
        
        if(tensesData.error) {
            console.error("Lỗi từ server Python:", tensesData.error);
            return;
        }

        // Khởi tạo giao diện sau khi có dữ liệu
        initGrammar(); 
    } catch (error) {
        console.error("Không thể kết nối đến API Python:", error);
    }
}

// Gọi fetch dữ liệu khi trang vừa load xong
document.addEventListener('DOMContentLoaded', fetchGrammarData);

// ... (Giữ nguyên các hàm initGrammar, showTheory, showPractice, checkPracticeAnswer như trước đó) ...


// Hàm chuyển đổi giữa Lý thuyết và Luyện tập
function switchGrammarSubTab(tab) {
    document.querySelectorAll('.grammar-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.grammar-sub-section').forEach(sec => sec.classList.remove('active'));

    if (tab === 'theory') {
        document.querySelector('.grammar-tab-btn[onclick="switchGrammarSubTab(\'theory\')"]').classList.add('active');
        document.getElementById('grammar-theory').classList.add('active');
    } else {
        document.querySelector('.grammar-tab-btn[onclick="switchGrammarSubTab(\'practice\')"]').classList.add('active');
        document.getElementById('grammar-practice').classList.add('active');
    }
}

// Khởi tạo danh sách 12 thì khi trang tải
function initGrammar() {
    const theoryList = document.getElementById('theory-tense-list');
    const practiceList = document.getElementById('practice-tense-list');

    tensesData.forEach(tense => {
        // Render cho Lý thuyết
        const liTheory = document.createElement('li');
        liTheory.textContent = tense.name;
        liTheory.onclick = () => showTheory(tense, liTheory);
        theoryList.appendChild(liTheory);

        // Render cho Luyện tập
        const liPractice = document.createElement('li');
        liPractice.textContent = tense.name;
        liPractice.onclick = () => showPractice(tense, liPractice);
        practiceList.appendChild(liPractice);
    });
}

// Hiển thị nội dung Lý Thuyết
function showTheory(tense, listItem) {
    // Đổi màu menu đang chọn
    document.querySelectorAll('#theory-tense-list li').forEach(li => li.classList.remove('selected'));
    listItem.classList.add('selected');

    const contentArea = document.getElementById('theory-content');
    contentArea.innerHTML = `
        <h3>${tense.name}</h3>
        <div class="theory-box">
            <p><strong>Cách dùng:</strong> ${tense.usage}</p>
            <div class="formula-box">
                <p><strong>Công thức:</strong></p>
                <p>${tense.formulas}</p>
            </div>
        </div>
        <div class="example-box">
            <p><strong>Ví dụ minh họa:</strong></p>
            <p>${tense.examples}</p>
        </div>
    `;
}

// Hiển thị nội dung Luyện tập
function showPractice(tense, listItem) {
    // Đổi màu menu đang chọn
    document.querySelectorAll('#practice-tense-list li').forEach(li => li.classList.remove('selected'));
    listItem.classList.add('selected');

    // Hiển thị khu vực quiz và ẩn text placeholder
    document.getElementById('practice-quiz-area').style.display = 'block';
    document.querySelector('#practice-content .placeholder-text').style.display = 'none';
    
    // Reset kết quả
    document.getElementById('practice-result').textContent = "";
    
    // Cập nhật câu hỏi
    document.getElementById('practice-tense-title').textContent = `Luyện tập: ${tense.name}`;
    document.getElementById('practice-question').textContent = tense.question;
    
    // Cập nhật dropdown đáp án
    const selectBox = document.getElementById('practice-select');
    selectBox.innerHTML = `<option value="">-- Chọn đáp án --</option>`;
    tense.options.forEach(opt => {
        selectBox.innerHTML += `<option value="${opt}">${opt}</option>`;
    });

    // Lưu lại đáp án đúng
    currentPracticeAnswer = tense.answer;
}

// Kiểm tra đáp án luyện tập
function checkPracticeAnswer() {
    const userAnswer = document.getElementById('practice-select').value;
    const resultElement = document.getElementById('practice-result');

    if (userAnswer === "") {
        resultElement.textContent = "Vui lòng chọn một đáp án.";
        resultElement.className = "result-msg error-text";
        return;
    }

    if (userAnswer === currentPracticeAnswer) {
        resultElement.textContent = "✅ Chính xác! Làm rất tốt.";
        resultElement.className = "result-msg success-text";
    } else {
        resultElement.textContent = `❌ Sai rồi. Bạn hãy làm lại đọc lại và phân tích lại nhé ^^ `;
        resultElement.className = "result-msg error-text";
    }
}

// Khởi chạy script grammar sau khi HTML load
document.addEventListener('DOMContentLoaded', initGrammar);

// Translation Logic (Sử dụng Gemini API thông qua Backend)
// Hàm đổi nhãn hiển thị khi người dùng thay đổi chiều dịch
function updateTranslateLabels() {
    const direction = document.getElementById('translate-direction').value;
    const sourceLabel = document.getElementById('source-label');
    const targetLabel = document.getElementById('target-label');
    
    if (direction === 'en-vi') {
        sourceLabel.textContent = 'English';
        targetLabel.textContent = 'Vietnamese';
    } else {
        sourceLabel.textContent = 'Vietnamese';
        targetLabel.textContent = 'English';
    }
    
    // Tự động xóa văn bản cũ khi đổi chiều dịch cho sạch sẽ
    document.getElementById('source-text').value = '';
    document.getElementById('target-text').value = '';
}

// Logic gọi API dịch thuật có hỗ trợ 2 chiều
async function translateText() {
    const sourceText = document.getElementById('source-text').value.trim();
    const targetText = document.getElementById('target-text');
    const direction = document.getElementById('translate-direction').value; // Lấy hướng dịch
    
    if (sourceText === "") {
        targetText.value = "Vui lòng nhập văn bản cần dịch...";
        return;
    }

    targetText.value = "Đang dịch...";

    try {
        const response = await fetch('http://127.0.0.1:5000/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Gửi cả nội dung text và chiều dịch (direction) lên server
            body: JSON.stringify({ text: sourceText, direction: direction }) 
        });

        const data = await response.json();

        if (data.error) {
            targetText.value = "Lỗi: " + data.error;
        } else {
            targetText.value = data.translation;
        }
    } catch (error) {
        console.error("Lỗi khi gọi API Translate:", error);
        targetText.value = "Không thể kết nối đến máy chủ dịch thuật.";
    }
}

// --- VOCABULARY LOGIC (Spaced Repetition & Quiz) ---
let currentLevel = 'A1';
let vocabList = [];
let currentVocabIndex = 0;
let userSrsData = {}; // Giả lập lưu trữ tiến độ từ vựng { wordId: level }

function selectVocabLevel(level) {
    currentLevel = level;
    document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// 1. Gọi API tải danh sách từ vựng theo chủ đề
async function startVocabulary(topic) {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/vocabulary/${currentLevel}/${topic}`);
        vocabList = await res.json();

        if (vocabList.length === 0) {
            alert("Chủ đề này chưa có từ vựng!"); return;
        }

        currentVocabIndex = 0;
        document.getElementById('vocab-title').textContent = `Chủ đề: ${topic}`;
        document.getElementById('vocab-selection-view').style.display = 'none';
        document.getElementById('vocab-progress-wrapper').style.display = 'flex';
        document.getElementById('vocab-back-btn').style.display = 'block';

        loadVocabWord(); // Bắt đầu hiện từ đầu tiên
    } catch (error) {
        console.error("Lỗi tải từ vựng:", error);
    }
}

// 2. Hiển thị Flashcard
function loadVocabWord() {
    if (currentVocabIndex >= vocabList.length) {
        // Đã học xong
        document.getElementById('vocab-flashcard-view').style.display = 'none';
        document.getElementById('vocab-srs-view').style.display = 'none';
        document.getElementById('vocab-finish-view').style.display = 'block';
        return;
    }

    const currentWord = vocabList[currentVocabIndex];
    
    // Cập nhật giao diện Flashcard
    document.getElementById('vocab-word').textContent = currentWord.word;
    document.getElementById('vocab-meaning').textContent = currentWord.meaning;
    document.getElementById('vocab-example').textContent = `"${currentWord.example}"`;

    // Cập nhật Progress Bar
    const total = vocabList.length;
    const percentage = (currentVocabIndex / total) * 100;
    document.getElementById('vocab-progress-fill').style.width = `${percentage}%`;
    document.getElementById('vocab-progress-text').textContent = `${currentVocabIndex}/${total}`;

    // Chuyển màn hình
    document.getElementById('vocab-quiz-view').style.display = 'none';
    document.getElementById('vocab-srs-view').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'block';
}

// Lệnh gọi API phát âm (Web Speech API - Không cần mạng)
function playVocabAudio() {
    const word = vocabList[currentVocabIndex].word;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; // Giọng Mỹ
    speechSynthesis.speak(utterance);
}

// 3. Nếu bấm "Tôi đã biết" -> Pass luôn
function handleVocabResult(isKnown) {
    const currentWord = vocabList[currentVocabIndex];
    
    // Thuật toán SRS đơn giản
    if (!userSrsData[currentWord.id]) userSrsData[currentWord.id] = 0;
    
    if (isKnown) {
        userSrsData[currentWord.id] += 1; // Tăng level
        showSrsFeedback(true, userSrsData[currentWord.id]);
    } else {
        userSrsData[currentWord.id] = 0; // Trả về 0 nếu sai
        showSrsFeedback(false, 0);
    }
}

// 4. Nếu bấm "Ôn lại" -> Mở Quiz trắc nghiệm
function showVocabQuiz() {
    const currentWord = vocabList[currentVocabIndex];
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    
    document.getElementById('vocab-quiz-word').textContent = currentWord.word;
    const optionsContainer = document.getElementById('vocab-quiz-options');
    optionsContainer.innerHTML = '';

    // Trộn ngẫu nhiên 4 đáp án (cho giống thật)
    const shuffledOptions = [...currentWord.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(opt => {
        optionsContainer.innerHTML += `
            <div class="quiz-option" onclick="checkVocabAnswer('${opt}', this)">${opt}</div>
        `;
    });

    document.getElementById('vocab-quiz-view').style.display = 'block';
}

// 5. Chấm điểm Quiz
function checkVocabAnswer(selectedOpt, btnElement) {
    const currentWord = vocabList[currentVocabIndex];
    
    // Khóa các nút khác
    document.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');

    if (selectedOpt === currentWord.meaning) {
        btnElement.style.backgroundColor = 'var(--light-green)';
        btnElement.style.borderColor = 'var(--primary-color)';
        btnElement.style.color = 'var(--primary-hover)';
        setTimeout(() => handleVocabResult(true), 1000); // Trả về true sau 1s
    } else {
        btnElement.style.backgroundColor = '#ffdfe0';
        btnElement.style.borderColor = '#ff4b4b';
        btnElement.style.color = '#ea2b2b';
        // Nổi bật đáp án đúng
        document.querySelectorAll('.quiz-option').forEach(el => {
            if (el.textContent === currentWord.meaning) {
                el.style.backgroundColor = 'var(--light-green)';
                el.style.borderColor = 'var(--primary-color)';
            }
        });
        setTimeout(() => handleVocabResult(false), 2000); // Phạt, trả về false
    }
}

// 6. Hiển thị màn hình Phản hồi thuật toán (SRS)
function showSrsFeedback(isSuccess, level) {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'none';

    const srsIcon = document.getElementById('srs-icon');
    const srsTitle = document.getElementById('srs-title');
    const srsMsg = document.getElementById('srs-message');

    if (isSuccess) {
        srsIcon.textContent = '🔥';
        srsTitle.textContent = 'Chính xác!';
        srsTitle.style.color = 'var(--primary-color)';
        
        // Mô phỏng ngày ôn tập
        let days = 1;
        if (level === 2) days = 3;
        else if (level >= 3) days = 7;
        
        srsMsg.innerHTML = `Từ vựng đã tăng lên <strong>Level ${level}</strong>.<br>Hệ thống sẽ nhắc bạn ôn lại sau <span style="color:var(--primary-color); font-weight:800;">${days} ngày</span>.`;
    } else {
        srsIcon.textContent = '🧠';
        srsTitle.textContent = 'Cần luyện tập thêm';
        srsTitle.style.color = '#ff4b4b';
        srsMsg.innerHTML = `Đừng lo, hãy học lại từ này vào ngày mai nhé!`;
    }

    document.getElementById('vocab-srs-view').style.display = 'block';
}

// 7. Chuyển từ tiếp theo
function nextVocabWord() {
    currentVocabIndex++;
    loadVocabWord();
}

// 8. Hàm Reset Quay lại màn hình chọn
function resetVocabUI() {
    document.getElementById('vocab-selection-view').style.display = 'block';
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'none';
    document.getElementById('vocab-srs-view').style.display = 'none';
    document.getElementById('vocab-finish-view').style.display = 'none';
    
    document.getElementById('vocab-progress-wrapper').style.display = 'none';
    document.getElementById('vocab-back-btn').style.display = 'none';
    document.getElementById('vocab-title').textContent = 'Học Từ Vựng';
}

// --- AI CHAT TUTOR LOGIC ---
let chatHistory = []; // Mảng lưu trữ trí nhớ cho AI

async function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    if (!message) return;

    // 1. In tin nhắn của bạn lên màn hình
    appendMessage(message, 'user');
    inputField.value = ''; // Xóa trắng ô nhập
    
    // Khóa nút gửi để tránh bấm 2 lần
    const btnSend = document.getElementById('btn-send-chat');
    btnSend.disabled = true;

    // 2. Hiện trạng thái "AI đang gõ..."
    const typingId = 'typing-' + Date.now();
    appendMessage('Đang gõ... ✍️', 'ai', typingId);

    try {
        // 3. Gửi tin nhắn và lịch sử lên server
        const res = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, history: chatHistory })
        });

        const data = await res.json();
        
        // Xóa trạng thái "Đang gõ..."
        document.getElementById(typingId).remove();

        if (data.error) {
            appendMessage('Lỗi: ' + data.error, 'ai');
        } else {
            // 4. In câu trả lời của AI
            appendMessage(data.reply, 'ai');
            
            // 5. Lưu vào bộ nhớ để lần sau hỏi tiếp AI vẫn nhớ
            chatHistory.push({ role: "user", parts: [{ text: message }] });
            chatHistory.push({ role: "model", parts: [{ text: data.reply }] });
        }
    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        document.getElementById(typingId).remove();
        appendMessage('Xin lỗi, tôi đang mất kết nối với máy chủ.', 'ai');
    } finally {
        btnSend.disabled = false;
        inputField.focus(); // Đưa con trỏ chuột quay lại ô nhập
    }
}

// Hàm in HTML bong bóng chat ra màn hình
function appendMessage(text, sender, id = null) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;
    if (id) msgDiv.id = id;

    // Biến ký tự xuống dòng (\n) thành thẻ <br> để HTML hiểu
    const formattedText = text.replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = `<div class="msg-bubble">${sender === 'ai' ? '<strong>AI:</strong><br>' : ''}${formattedText}</div>`;
    chatBox.appendChild(msgDiv);

    // Tự động cuộn màn hình xuống dưới cùng để thấy tin nhắn mới nhất
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Bắt sự kiện ấn phím Enter để gửi nhanh
function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Hàm xóa trí nhớ AI khi bấm nút "Xóa lịch sử"
function clearChat() {
    if(confirm("Bạn có chắc muốn xóa cuộc hội thoại này? AI sẽ quên hết những gì vừa nói.")) {
        chatHistory = []; // Xóa bộ nhớ mảng
        const chatBox = document.getElementById('chat-box');
        // Xóa hết, chỉ giữ lại câu chào đầu tiên
        chatBox.innerHTML = `
            <div class="message ai-msg">
                <div class="msg-bubble">
                    <strong>AI Tutor:</strong><br>
                    Đã dọn dẹp bộ nhớ! Chúng ta bắt đầu chủ đề mới nhé. 😊
                </div>
            </div>`;
    }
}


// --- LOGIC AUTHENTICATION CHO TRANG CHỦ ---

async function checkAuthStatus() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/status', { credentials: 'include' });
        const data = await response.json();
        
        if (data.isLoggedIn) {
            document.getElementById('user-info-container').style.display = 'flex';
            document.getElementById('login-prompt-container').style.display = 'none';
            document.getElementById('header-user-name').textContent = `👤 ${data.user.email}`;
            
            // NẾU LÀ ADMIN THÌ HIỆN NÚT ADMIN PANEL
            if (data.user.role === 'admin') {
                document.getElementById('nav-admin-btn').style.display = 'block';
                loadAdminData(); // Tự động tải danh sách từ vựng cho admin
            }
        } else {
             document.getElementById('user-info-container').style.display = 'none';
             document.getElementById('login-prompt-container').style.display = 'block';
        }
    } catch (error) { console.error("Lỗi:", error); }
}

// 2. Xử lý Đăng Xuất
async function handleLogout() {
    // Thêm hộp thoại xác nhận cho chuyên nghiệp
    if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
        try {
            await fetch('http://127.0.0.1:5000/api/auth/logout', { 
                method: 'POST',
                credentials: 'include' 
            });
            
            // Đăng xuất xong thì chuyển thẳng về trang Đăng nhập
            window.location.href = 'login.html'; 
        } catch (error) {
            console.error(error);
        }
    }
}

// 3. Chuyển đến trang Đăng nhập
function goToLogin() {
    window.location.href = 'login.html';
}

// Gọi hàm checkAuthStatus khi trang web vừa mở lên
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// ==========================================
//        ADMIN PANEL LOGIC
// ==========================================

// --- 1. CONFIGURATION (Lược đồ định nghĩa cấu trúc động) ---
const moduleConfig = {
    vocabulary: {
        title: "Vocabulary",
        apiEndpoint: "/api/admin/vocabulary",
        tableHeaders: ["ID", "Từ vựng", "Nghĩa", "Level", "Topic", "Hành động"],
        dataKeys: ["id", "word", "meaning", "level", "topic"],
        formFields: [
            { id: "word", label: "Từ tiếng Anh", type: "text", required: true },
            { id: "meaning", label: "Nghĩa tiếng Việt", type: "text", required: true },
            { id: "example", label: "Ví dụ (optional)", type: "textarea", required: false },
            { id: "options", label: "4 đáp án (cách nhau bằng dấu phẩy)", type: "text", required: true },
            { id: "level", label: "Trình độ (A1, A2, B1, B2, C1, C2)", type: "select", required: true, options: ["A1", "A2", "B1", "B2", "C1", "C2"] },
            { id: "topic", label: "Chủ đề", type: "text", required: true }
        ]
    },
    reading: {
        title: "Reading Tests",             
        getEndpoint: "/api/reading-passages", // 🌟 Dùng API public để lấy danh sách
        apiEndpoint: "/api/admin/reading",    // Thêm/Sửa/Xóa qua API Admin
        tableHeaders: ["ID", "Tiêu đề", "Hành động"],
        dataKeys: ["id", "title"],
        formFields: [
            { id: "title", label: "Tiêu đề bài đọc", type: "text", required: true },
            { id: "content", label: "Nội dung bài đọc", type: "textarea", required: true }
        ],
        hasSubItems: true,
        subItemTitle: "Câu hỏi (Reading Questions)",
        subItemFields: [
            { id: "question_text", label: "Nội dung câu hỏi", type: "textarea", required: true },
            { id: "options", label: "Đáp án (cách nhau bằng dấu ,)", type: "textarea", required: true },
            { id: "correct_answer", label: "Đáp án đúng", type: "text", required: true }
        ]
    },
    grammar: {
        title: "Grammar Rules",
        getEndpoint: "/api/tenses",           // 🌟 Dùng API public để lấy danh sách
        apiEndpoint: "/api/admin/grammar",
        tableHeaders: ["ID", "Tên Thì", "Mô tả", "Hành động"],
        dataKeys: ["id", "name", "usage"],    // 🌟 Sửa usage_desc thành usage
        formFields: [
            { id: "name", label: "Tên Thì/Cấu trúc (vd: Present Simple)", type: "text", required: true },
            { id: "usage", label: "Mô tả cách sử dụng", type: "textarea", required: true }, // 🌟 Sửa id thành usage
            { id: "formulas", label: "Công thức (vd: S + V)", type: "textarea", required: true },
            { id: "examples", label: "Ví dụ minh họa", type: "textarea", required: true }
        ],
        hasSubItems: true,
        subItemTitle: "Bài Luyện Tập",
        subItemFields: [
            { id: "question", label: "Câu hỏi luyện tập", type: "textarea", required: true },
            { id: "options", label: "Đáp án (cách nhau bằng dấu |)", type: "textarea", required: true },
            { id: "answer", label: "Đáp án đúng", type: "text", required: true }
        ]
    },
    writing: {
        title: "Writing Topics",
        apiEndpoint: "/api/admin/writing",
        tableHeaders: ["ID", "Chủ đề", "Hành động"],
        dataKeys: ["id", "title"],
        formFields: [
            { id: "title", label: "Chủ đề viết", type: "text", required: true },
            { id: "description", label: "Hướng dẫn chi tiết", type: "textarea", required: false }
        ]
    },
};

// --- 2. STATE QUẢN LÝ APP ---
let currentModule = "vocabulary";
let adminData = {}; // Lưu dữ liệu từ API
let currentEditId = null; // ID của item đang edit
let editingSubItems = []; // Lưu sub-items khi đang edit
let editingSubItemIndex = -1;

// --- 4. CORE FUNCTIONS ---

// Khởi tạo giao diện
document.addEventListener("DOMContentLoaded", () => {
    switchModule(currentModule);
    loadAdminData(currentModule);
    
    // Gắn event cho menu sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const moduleName = e.currentTarget.dataset.module;
            switchModule(moduleName);
            loadAdminData(moduleName);
        });
    });

    // Gắn event submit form
    document.getElementById('dynamic-form').addEventListener('submit', handleFormSubmit);
});

// Load dữ liệu từ API
async function loadAdminData(moduleName) {
    try {
        const config = moduleConfig[moduleName];
        // 🌟 Lấy getEndpoint nếu có, không thì mặc định dùng apiEndpoint
        const endpoint = config.getEndpoint || config.apiEndpoint;
        
        const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error(`Lỗi tải dữ liệu: ${response.status}`);
            adminData[moduleName] = [];
            renderTable();
            return;
        }
        
        const data = await response.json();
        
        // 🌟 BỘ LỌC THÔNG MINH: Tự động trích xuất mảng nếu Python bọc trong Object
        if (!Array.isArray(data)) {
            // Tìm key nào trong object chứa mảng (vd: data.passages, data.data)
            const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
            adminData[moduleName] = arrayKey ? data[arrayKey] : [];
        } else {
            adminData[moduleName] = data; // Trả về mảng trực tiếp
        }
        
        renderTable();
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        adminData[moduleName] = [];
        renderTable();
    }
}

// Chuyển đổi giữa các Module
function switchModule(moduleName) {
    if (!moduleConfig[moduleName]) {
        document.getElementById('module-title').innerText = "Module đang được phát triển...";
        document.getElementById('table-head').innerHTML = "";
        document.getElementById('table-body').innerHTML = `<tr><td colspan="10" style="text-align:center;">Coming soon</td></tr>`;
        return;
    }

    currentModule = moduleName;
    const config = moduleConfig[currentModule];
    
    // Đổi Title
    document.getElementById('module-title').innerText = `Quản Lý ${config.title}`;
    
    // Render Header Table
    const theadHTML = `<tr>${config.tableHeaders.map(th => `<th>${th}</th>`).join('')}</tr>`;
    document.getElementById('table-head').innerHTML = theadHTML;

    // Render Body Table
    renderTable();
}

// Vẽ dữ liệu ra bảng
function renderTable() {
    const config = moduleConfig[currentModule];
    const data = adminData[currentModule] || [];
    const tbody = document.getElementById('table-body');
    
    tbody.innerHTML = data.map(item => {
        let rowHtml = `<tr>`;
        // Lấy đúng dữ liệu theo DataKeys đã cấu hình
        config.dataKeys.forEach(key => {
            let displayValue = item[key] || '';
            // Cắt ngắn nếu quá dài
            if (typeof displayValue === 'string' && displayValue.length > 50) {
                displayValue = displayValue.substring(0, 50) + '...';
            }
            rowHtml += `<td>${displayValue}</td>`;
        });
        // Thêm cột Hành động
        rowHtml += `
            <td style="display: flex; gap: 8px;">
                <button class="btn-edit" onclick="editItem(${item.id})">✏️ Sửa</button>
                <button class="btn-delete" onclick="deleteItem(${item.id})">🗑️ Xóa</button>
            </td>
        </tr>`;
        return rowHtml;
    }).join('');

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${config.tableHeaders.length}" style="text-align:center; padding: 32px;">Chưa có dữ liệu</td></tr>`;
    }
}

// --- 5. MODAL & FORM BUILDER ---

function openModal(editId = null) {
    const config = moduleConfig[currentModule];
    const formGrid = document.getElementById('form-fields');
    
    // Cập nhật tiêu đề Modal
    document.getElementById('modal-title').innerText = editId ? `Sửa ${config.title}` : `Thêm Mới ${config.title}`;
    document.getElementById('item-id').value = editId || "";
    
    currentEditId = editId;
    editingSubItems = [];

    // Dựng form tự động dựa vào cấu hình
    formGrid.innerHTML = config.formFields.map(field => {
        if(field.type === 'textarea') {
            return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <textarea id="field-${field.id}" class="auth-input" style="height: 100px; resize: vertical;" ${field.required ? 'required' : ''}></textarea>
            </div>`;
        } else if(field.type === 'select') {
            return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <select id="field-${field.id}" class="auth-input" ${field.required ? 'required' : ''}>
                    <option value="">-- Chọn ${field.label} --</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </div>`;
        }
        return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <input type="${field.type}" id="field-${field.id}" class="auth-input" ${field.required ? 'required' : ''}>
            </div>`;
    }).join('');

    // Nếu là Edit, đổ dữ liệu cũ vào form
    if (editId) {
        const item = (adminData[currentModule] || []).find(i => i.id === editId);
        if (item) {
            config.formFields.forEach(field => {
                const input = document.getElementById(`field-${field.id}`);
                if (input) {
                    input.value = item[field.id] || '';
                }
            });
            
            // Nếu module này có sub-items (Reading, Grammar), load chúng vào
            if (config.hasSubItems) {
                // 🌟 FIX: Fetch chi tiết bài đọc kèm câu hỏi từ API public
                loadReadingDetails(editId);
            }
        }
    } else {
        editingSubItems = [];
    }
    
    // Setup form cho sub-items nếu cần
    if (config.hasSubItems) {
        setupSubItemForm();
        document.getElementById('admin-sub-items-section').style.display = 'block';
    } else {
        document.getElementById('admin-sub-items-section').style.display = 'none';
    }

    document.getElementById('admin-modal').classList.add('active');
}

// 🌟 HÀM MỚI: Load chi tiết Reading kèm câu hỏi
async function loadReadingDetails(passageId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/reading-test/${passageId}`);
        const data = await response.json();
        
        // 🌟 BẢN VÁ: Lấy nội dung bài đọc đắp vào ô Textarea
        if (data.passage && data.passage.content) {
            const contentInput = document.getElementById('field-content');
            if (contentInput) {
                contentInput.value = data.passage.content;
            }
        }

        if (data.questions) {
            // Chuyển đổi questions thành format của admin form
            editingSubItems = data.questions.map(q => ({
                id: q.id,
                question_text: q.question_text,
                // Chuyển mảng thành dạng chữ cách nhau bằng dấu phẩy
                options: Array.isArray(q.options) ? q.options.join(', ') : (q.options || '').replace(/\|/g, ', '),
                correct_answer: q.correct_answer
            }));
            
            renderSubItemsList();
        }
    } catch (error) {
        console.error('Lỗi tải chi tiết Reading:', error);
    }
}

// Setup form cho sub-items
function setupSubItemForm() {
    const config = moduleConfig[currentModule];
    const formContainer = document.getElementById('admin-sub-item-form');
    
    if (!config.hasSubItems || !formContainer) return;
    
    formContainer.innerHTML = config.subItemFields.map(field => {
        if(field.type === 'textarea') {
            return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <textarea id="sub-field-${field.id}" class="auth-input" style="height: 80px; resize: vertical;" ${field.required ? 'required' : ''}></textarea>
            </div>`;
        } else if(field.type === 'select') {
            return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <select id="sub-field-${field.id}" class="auth-input" ${field.required ? 'required' : ''}>
                    <option value="">-- Chọn --</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </div>`;
        }
        return `
            <div class="form-group">
                <label>${field.label}${field.required ? '<span style="color: red;">*</span>' : ''}</label>
                <input type="${field.type}" id="sub-field-${field.id}" class="auth-input" ${field.required ? 'required' : ''}>
            </div>`;
    }).join('');
}

function closeModal() {
    document.getElementById('admin-modal').classList.remove('active');
    document.getElementById('dynamic-form').reset();
    editingSubItems = [];
    
    editingSubItemIndex = -1; 
    const btnAdd = document.querySelector('button[onclick="addSubItem()"]');
    if (btnAdd) {
        btnAdd.innerHTML = '➕ Thêm Câu Hỏi';
        btnAdd.style.backgroundColor = '';
    }
}

// Render danh sách sub-items (cho Reading, Grammar)
function renderSubItemsList() {
    const config = moduleConfig[currentModule];
    if (!config.hasSubItems) return;
    
    const container = document.getElementById('admin-sub-items-list');
    if (!container) return;
    
    container.innerHTML = editingSubItems.map((item, index) => `
        <div class="sub-item-card" style="background: #f5f5f5; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <p style="font-weight: 600; margin-bottom: 4px;">
                        ${config.subItemTitle} #${index + 1}
                    </p>
                    <p style="font-size: 14px; color: var(--text-muted);">
                        ${item.question_text || item.question || 'N/A'}
                    </p>
                </div>
                <div>
                    <button type="button" class="btn-edit" onclick="editSubItem(${index})" style="padding: 4px 12px; font-size: 12px; margin-right: 8px;">✏️ Sửa</button>
                    <button type="button" class="btn-delete" onclick="deleteSubItem(${index})" style="padding: 4px 12px; font-size: 12px;">🗑️ Xóa</button>
                </div>
            </div>
        </div>
    `).join('');
    
    if (editingSubItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Chưa có ' + config.subItemTitle.toLowerCase() + '</p>';
    }
}

//  Đổ dữ liệu câu hỏi lên form để Sửa
function editSubItem(index) {
    editingSubItemIndex = index;
    const item = editingSubItems[index];
    const config = moduleConfig[currentModule];

    // Đổ dữ liệu lên các ô input
    config.subItemFields.forEach(field => {
        const input = document.getElementById(`sub-field-${field.id}`);
        if (input) {
            // Nếu là ô nhập Đáp án, chuyển Mảng thành dạng chữ cách nhau bởi dấu phẩy
            if (field.id === 'options' && Array.isArray(item[field.id])) {
                input.value = item[field.id].join(', ');
            } else if (field.id === 'options' && typeof item[field.id] === 'string') {
                input.value = item[field.id].replace(/\|/g, ', '); // Phòng hờ dữ liệu cũ dùng |
            } else {
                input.value = item[field.id] || '';
            }
        }
    });

    // Đổi tên và màu nút Thêm thành nút Cập nhật (Màu cam)
    const btnAdd = document.querySelector('button[onclick="addSubItem()"]');
    if (btnAdd) {
        btnAdd.innerHTML = '💾 Cập Nhật Câu Hỏi';
        btnAdd.style.backgroundColor = '#ff9600'; 
    }
}

// Thêm HOẶC Sửa sub-item
function addSubItem() {
    const config = moduleConfig[currentModule];
    if (!config.hasSubItems) return;
    
    let newSubItem = { id: null }; 
    // Nếu đang sửa 1 câu hỏi lấy từ Database lên, phải giữ lại ID của nó
    if (editingSubItemIndex > -1 && editingSubItems[editingSubItemIndex].id) {
        newSubItem.id = editingSubItems[editingSubItemIndex].id;
    }

    let isValid = true;
    
    config.subItemFields.forEach(field => {
        const input = document.getElementById(`sub-field-${field.id}`);
        if (!input) return;
        
        let value = input.value.trim();
        if (field.required && !value) {
            alert(`Vui lòng nhập "${field.label}"`);
            isValid = false;
            return;
        }

        if (field.id === 'options' && value) {
            value = value.split(',').map(opt => opt.trim());
        }

        newSubItem[field.id] = value;
    });
    
    if (!isValid) return;
    
    // 🌟 PHÂN LUỒNG LOGIC: Đang Sửa hay Thêm Mới?
    if (editingSubItemIndex > -1) {
        // Ghi đè lên câu hỏi cũ
        editingSubItems[editingSubItemIndex] = newSubItem;
        editingSubItemIndex = -1; // Reset trạng thái
        
        // Trả lại nút màu Xanh "Thêm Câu Hỏi"
        const btnAdd = document.querySelector('button[onclick="addSubItem()"]');
        if (btnAdd) {
            btnAdd.innerHTML = '➕ Thêm Câu Hỏi';
            btnAdd.style.backgroundColor = '';
        }
    } else {
        // Đẩy câu hỏi mới vào mảng
        editingSubItems.push(newSubItem);
    }
    
    // Xóa trắng form cho gọn
    config.subItemFields.forEach(field => {
        const input = document.getElementById(`sub-field-${field.id}`);
        if (input) input.value = '';
    });
    
    renderSubItemsList();
}

function deleteSubItem(index) {
    editingSubItems.splice(index, 1);
    renderSubItemsList();
}

// --- 6. CRUD ACTIONS ---

function handleFormSubmit(e) {
    e.preventDefault();
    const config = moduleConfig[currentModule];
    const editId = document.getElementById('item-id').value;
    
    // Gom dữ liệu từ các ô input
    const formData = {};
    config.formFields.forEach(field => {
    let value = document.getElementById(`field-${field.id}`).value;
    if (field.id === 'options' && value) {
        value = value.split(',').map(opt => opt.trim());
    }
    
    formData[field.id] = value;
});
    
    // Xử lý đặc biệt cho options (chuyển string thành array)
    if (config.hasSubItems && editingSubItems.length > 0) {
        formData.questions = editingSubItems;
    }

    if (editId) {
        // Cập nhật (Update)
        updateItemAPI(parseInt(editId), formData);
    } else {
        // Thêm mới (Create)
        createItemAPI(formData);
    }
}

async function createItemAPI(data) {
    try {
        const config = moduleConfig[currentModule];
        const response = await fetch(`http://127.0.0.1:5000${config.apiEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(`Lỗi: ${error.error || 'Không thể thêm mới'}`);
            return;
        }
        
        alert('✅ Thêm mới thành công!');
        closeModal();
        loadAdminData(currentModule);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('❌ Không thể kết nối đến máy chủ');
    }
}

async function updateItemAPI(id, data) {
    try {
        const config = moduleConfig[currentModule];
        const response = await fetch(`http://127.0.0.1:5000${config.apiEndpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(`Lỗi: ${error.error || 'Không thể cập nhật'}`);
            return;
        }
        
        alert('✅ Cập nhật thành công!');
        closeModal();
        loadAdminData(currentModule);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('❌ Không thể kết nối đến máy chủ');
    }
}

function editItem(id) {
    openModal(id);
}

async function deleteItem(id) {
    if (confirm(`Bạn có chắc chắn muốn xóa bản ghi #${id} này không? Hành động này không thể hoàn tác.`)) {
        try {
            const config = moduleConfig[currentModule];
            const response = await fetch(`http://127.0.0.1:5000${config.apiEndpoint}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                const error = await response.json();
                alert(`Lỗi: ${error.error || 'Không thể xóa'}`);
                return;
            }
            
            alert('✅ Đã xóa thành công!');
            loadAdminData(currentModule);
        } catch (error) {
            console.error('Lỗi:', error);
            alert('❌ Không thể kết nối đến máy chủ');
        }
    }
}