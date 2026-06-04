const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load biến môi trường từ file .env
console.log("TEST API KEY CỦA TÔI LÀ:", process.env.GEMINI_API_KEY);


const bcrypt = require('bcrypt'); // Thư viện mã hóa
const session = require('express-session'); // Thư viện phiên đăng nhập

const app = express();
const port = 5000;

// Middleware CORS (BẮT BUỘC PHẢI SỬA NHƯ THẾ NÀY ĐỂ CHẠY ĐƯỢC SESSION)
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Phải ghi rõ địa chỉ Live Server của bạn, không dùng '*'
    credentials: true // Cho phép gửi nhận Cookie Session
}));
app.use(express.json());

// Cấu hình Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'khoa_bi_mat_cua_do_an_tot_nghiep',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Để false vì đang chạy localhost (chưa có HTTPS)
        httpOnly: true, // Bảo mật chống XSS
        maxAge: 1000 * 60 * 30 // Mặc định: Timeout sau 30 phút
    }
}));

// --- MIDDLEWARE KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN ---
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next(); // Đã đăng nhập, cho phép đi tiếp
    } else {
        res.status(401).json({ error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn." });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        next(); // Là Admin
    } else {
        res.status(403).json({ error: "Truy cập bị từ chối. Cần quyền Admin." });
    }
};
// Cấu hình Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cấu hình kết nối MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Quoc3011', 
    database: 'testel'
};

// --- ROUTE 1: LẤY DỮ LIỆU NGỮ PHÁP TỪ MYSQL ---
app.get('/api/tenses', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Lấy 12 thì và sắp xếp theo số đằng trước
        const [tenses] = await connection.execute('SELECT * FROM grammar_tenses ORDER BY CAST(REGEXP_SUBSTR(name, "^[0-9]+") AS UNSIGNED)');
        
        // Lấy toàn bộ câu hỏi từ bảng grammar_questions mới tạo
        const [questions] = await connection.execute('SELECT * FROM grammar_questions');

        // Gộp data lại chuẩn định dạng cho Frontend (Chia làm Khẳng định, Phủ định, Nghi vấn)
        const tensesData = tenses.map(tense => {
            // Lọc ra các câu hỏi của THÌ HIỆN TẠI
            const tQs = questions.filter(q => q.tense_id === tense.id);
            
            // Hàm Helper để format câu hỏi
            const formatQ = (q) => {
                let parsedOptions = q.options;
                if (typeof parsedOptions === 'string') {
                    try { parsedOptions = JSON.parse(parsedOptions); } catch(e) { parsedOptions = []; }
                }
                return { q: q.question_text, options: parsedOptions, correct: q.correct_answer, exp: q.explanation || '' };
            };

            return {
                id: tense.id,
                name: tense.name,
                usage: tense.usage_desc,
                formulas: tense.formulas,
                examples: tense.examples,
                // Phân loại mảng câu hỏi
                affirmative: tQs.filter(q => q.category === 'affirmative').map(formatQ),
                negative: tQs.filter(q => q.category === 'negative').map(formatQ),
                question: tQs.filter(q => q.category === 'question').map(formatQ),
                // Trộn cả 3 dạng thành Boss Mixed Mode
                mixed: tQs.map(formatQ).sort(() => Math.random() - 0.5) 
            };
        });

        res.json(tensesData);
    } catch (error) {
        console.error('Lỗi Database:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- ROUTE 2: GỌI GEMINI API ĐỂ DỊCH THUẬT (2 CHIỀU) ---
app.post('/api/translate', async (req, res) => {
    try {
        const textToTranslate = req.body.text;
        const direction = req.body.direction; // Nhận hướng dịch từ Frontend

        if (!textToTranslate) {
            return res.status(400).json({ error: "Vui lòng cung cấp văn bản cần dịch." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Tạo câu lệnh (Prompt) khác nhau tùy theo chiều dịch
        let prompt = "";
        if (direction === "vi-en") {
            prompt = `Bạn là một biên dịch viên chuyên nghiệp. Hãy dịch đoạn văn bản tiếng Việt sau sang tiếng Anh một cách tự nhiên và chuẩn ngữ pháp nhất. Chỉ trả về kết quả đã dịch, tuyệt đối không giải thích gì thêm:\n\n"${textToTranslate}"`;
        } else {
            // Mặc định là dịch từ Anh sang Việt
            prompt = `Bạn là một biên dịch viên chuyên nghiệp. Hãy dịch đoạn văn bản tiếng Anh sau sang tiếng Việt một cách tự nhiên và chuẩn văn phong nhất. Chỉ trả về kết quả đã dịch, tuyệt đối không giải thích gì thêm:\n\n"${textToTranslate}"`;
        }

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();

        // Trả kết quả về cho giao diện
        res.json({ translation: translatedText.trim() });

    } catch (error) {
        console.error('Lỗi dịch thuật Gemini:', error);
        res.status(500).json({ error: "Lỗi khi gọi API dịch thuật." });
    }
});

// --- ROUTE 3: GỌI GEMINI API ĐỂ CHẤM ĐIỂM WRITING ---
app.post('/api/evaluate-writing', async (req, res) => {
    try {
        const { text, topic } = req.body;

        if (!text || !topic) {
            return res.status(400).json({ error: "Thiếu dữ liệu bài viết hoặc chủ đề." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Prompt ép Gemini đóng vai giáo viên và trả về ĐÚNG CẤU TRÚC JSON
        const prompt = `Bạn là một giáo viên tiếng Anh khắt khe nhưng tận tâm. Hãy chấm điểm đoạn văn sau của học sinh.
Chủ đề bài viết: "${topic}"
Bài làm của học sinh: "${text}"

Nhiệm vụ của bạn:
1. Đánh giá xem bài viết có lạc đề hay không. Nếu lạc đề, cho tối đa 20 điểm. Nếu đúng chủ đề, chấm trên thang 100 dựa vào ngữ pháp và từ vựng.
2. Sửa lại toàn bộ bài viết cho đúng ngữ pháp và tự nhiên.
3. Liệt kê các lỗi sai cụ thể. NẾU BÀI VIẾT LẠC ĐỀ, lỗi đầu tiên trong danh sách phải là lỗi "Lạc đề" với giải thích lý do tại sao nội dung không khớp với chủ đề đã chọn.

BẠN BẮT BUỘC PHẢI TRẢ VỀ KẾT QUẢ DƯỚI ĐỊNH DẠNG JSON NHƯ SAU (Tuyệt đối không có markdown \`\`\`json ở đầu hay text nào khác bên ngoài JSON):
{
    "score": <số điểm>,
    "corrected_text": "<bài viết đã sửa hoàn chỉnh>",
    "errors": [
        {
            "original": "<cụm từ sai>",
            "correction": "<cụm từ đúng>",
            "explanation": "<giải thích lý do sai bằng tiếng Việt>"
        }
    ]
}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Xử lý mẹo: Cắt bỏ các ký tự markdown ```json nếu AI lỡ tay thêm vào
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        // Chuyển chuỗi Text AI trả về thành một Object của Javascript
        const evaluation = JSON.parse(responseText);
        
        // Gửi kết quả về cho Frontend
        res.json(evaluation);

    } catch (error) {
        console.error('Lỗi chấm điểm Gemini:', error);
        res.status(500).json({ error: "Lỗi trong quá trình chấm điểm của AI." });
    }
});

// --- ROUTE 4: LẤY DANH SÁCH ĐỀ READING ---
app.get('/api/reading-passages', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, title FROM reading_passages');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- ROUTE 5: LẤY CHI TIẾT 1 ĐỀ READING (GỒM ĐOẠN VĂN & CÂU HỎI) ---
app.get('/api/reading-test/:id', async (req, res) => {
    let connection;
    try {
        const passageId = req.params.id;
        connection = await mysql.createConnection(dbConfig);
        
        // Lấy đoạn văn
        const [passages] = await connection.execute('SELECT * FROM reading_passages WHERE id = ?', [passageId]);
        if (passages.length === 0) return res.status(404).json({ error: "Không tìm thấy đề bài" });
        
        // Lấy các câu hỏi của đề đó
        const [questions] = await connection.execute('SELECT * FROM reading_questions WHERE passage_id = ?', [passageId]);
        
        // Parse cột JSON options
        const formattedQuestions = questions.map(q => {
            let parsedOptions = q.options;
            if (typeof parsedOptions === 'string') {
                try { parsedOptions = JSON.parse(parsedOptions); } catch (e) { parsedOptions = []; }
            }
            return {
                id: q.id,
                question_text: q.question_text,
                options: parsedOptions,
                correct_answer: q.correct_answer
            };
        });

        res.json({
            passage: passages[0],
            questions: formattedQuestions
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- ROUTE 5: API TỪ VỰNG (VOCABULARY) ---
app.get('/api/vocabulary/:level/:topic', async (req, res) => {
    let connection;
    try {
        const { level, topic } = req.params;
        
        // Mở kết nối database
        connection = await mysql.createConnection(dbConfig);
        
        // Truy vấn lấy toàn bộ từ vựng đúng Level và Topic
        const [rows] = await connection.execute(
            'SELECT * FROM vocabulary WHERE level = ? AND topic = ?',
            [level, topic]
        );

        // Map dữ liệu và ép kiểu chuỗi JSON của cột options thành Mảng (Array)
        const formattedVocab = rows.map(row => {
            let parsedOptions = row.options;
            if (typeof parsedOptions === 'string') {
                try { parsedOptions = JSON.parse(parsedOptions); } 
                catch (e) { parsedOptions = []; }
            }
            return {
                id: row.id,
                word: row.word,
                meaning: row.meaning,
                example: row.example,
                options: parsedOptions
            };
        });

        // Trả về cho Frontend mảng chứa 20 từ
        res.json(formattedVocab);

    } catch (error) {
        console.error('Lỗi Database Vocab:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end(); // Nhớ đóng kết nối
    }
});

// --- ROUTE 6: GỌI GEMINI CHO TÍNH NĂNG AI CHAT (CÓ TRÍ NHỚ) ---
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const history = req.body.history || []; 

        if (!userMessage) {
            return res.status(400).json({ error: "Tin nhắn không được để trống." });
        }

        // CÁCH MỚI: Dùng systemInstruction để cài đặt "Tính cách" cho AI cực chuẩn
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Bạn là một giáo viên tiếng Anh bản ngữ vô cùng thân thiện. Hãy trò chuyện với tôi để tôi luyện giao tiếp. Nếu tôi viết sai ngữ pháp, hãy nhẹ nhàng nhắc nhở và sửa lỗi cho tôi. NẾU TÔI HỎI BẰNG TIẾNG VIỆT, hãy trả lời bằng tiếng Việt. Nếu tôi chat tiếng Anh, hãy đáp bằng tiếng Anh."
        });

        // Bắt đầu cuộc trò chuyện với lịch sử được truyền từ Frontend
        const chat = model.startChat({
            history: history,
        });

        // Chỉ cần gửi đúng câu user nói, không cần ghép thêm gì nữa
        const result = await chat.sendMessage(userMessage);
        const aiResponse = result.response.text();

        res.json({ reply: aiResponse.trim() });

    } catch (error) {
        // ĐẶT CAMERA Ở ĐÂY ĐỂ BIẾT CHÍNH XÁC LỖI GÌ
        console.error('🔴 LỖI CHI TIẾT API CHATBOT:', error);
        
        res.status(500).json({ error: "Máy chủ AI đang bận, vui lòng thử lại." });
    }
});

// --- API ĐĂNG KÝ (REGISTER) ---
app.post('/api/auth/register', async (req, res) => {
    let connection;
    try {
        const { email, password, confirmPassword, role } = req.body;

        // Validate phía Server
        if (!email || !password || !confirmPassword) return res.status(400).json({ error: "Vui lòng nhập đủ thông tin." });
        if (password !== confirmPassword) return res.status(400).json({ error: "Mật khẩu xác nhận không khớp." });
        if (password.length < 6) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự trở lên." });

        connection = await mysql.createConnection(dbConfig);
        
        // Kiểm tra email đã tồn tại chưa
        const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) return res.status(400).json({ error: "Email này đã được sử dụng." });

        // Mã hóa mật khẩu (Salt Rounds = 10)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Chỉ nhận role student hoặc admin
        const finalRole = (role === 'admin') ? 'admin' : 'student';

        // Lưu vào Database
        await connection.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, finalRole]);
        
        res.json({ message: "Đăng ký thành công! Vui lòng đăng nhập." });
    } catch (error) {
        res.status(500).json({ error: "Lỗi máy chủ: " + error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- API ĐĂNG NHẬP (LOGIN) ---
app.post('/api/auth/login', async (req, res) => {
    let connection;
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu." });

        connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });

        const user = users[0];

        // So sánh mật khẩu người dùng nhập với mã hash trong DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });

        // Thiết lập Session
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.role = user.role;

        // Xử lý Remember Me (Kéo dài thời gian đăng nhập lên 7 ngày)
        if (rememberMe) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; 
        }

        res.json({ 
            message: "Đăng nhập thành công", 
            user: { email: user.email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi máy chủ: " + error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- API ĐĂNG XUẤT (LOGOUT) ---
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Không thể đăng xuất." });
        res.clearCookie('connect.sid'); // Xóa cookie phiên
        res.json({ message: "Đã đăng xuất thành công." });
    });
});

// --- API KIỂM TRA TRẠNG THÁI SESSION ---
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({ isLoggedIn: true, user: { email: req.session.email, role: req.session.role } });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// ==========================================
//        API DÀNH RIÊNG CHO ADMIN
// ==========================================

// 1. LẤY danh sách toàn bộ từ vựng
app.get('/api/admin/vocabulary', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM vocabulary ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. THÊM từ vựng mới
app.post('/api/admin/vocabulary', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { level, topic, word, meaning, example, options } = req.body;
        // Chuyển mảng options thành chuỗi JSON để lưu vào MySQL
        const optionsJson = JSON.stringify(options); 

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO vocabulary (level, topic, word, meaning, example, options) VALUES (?, ?, ?, ?, ?, ?)',
            [level, topic, word, meaning, example, optionsJson]
        );
        res.json({ message: "Đã thêm từ vựng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 3. SỬA từ vựng
app.put('/api/admin/vocabulary/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        const { level, topic, word, meaning, example, options } = req.body;
        const optionsJson = JSON.stringify(options);

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE vocabulary SET level=?, topic=?, word=?, meaning=?, example=?, options=? WHERE id=?',
            [level, topic, word, meaning, example, optionsJson, id]
        );
        res.json({ message: "Đã cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 4. XÓA từ vựng
app.delete('/api/admin/vocabulary/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM vocabulary WHERE id=?', [id]);
        res.json({ message: "Đã xóa từ vựng!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
//        API READING ADMIN
// ==========================================

// 1. LẤY danh sách Reading Passages
app.get('/api/admin/reading', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, title FROM reading_passages ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. THÊM bài đọc mới
app.post('/api/admin/reading', requireAdmin, async (req, res) => {  
    let connection;
    try {
        const { title, content, questions } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung" });
        }

        connection = await mysql.createConnection(dbConfig);
        
        // Thêm passage
        const [result] = await connection.execute(  
            'INSERT INTO reading_passages (title, content) VALUES (?, ?)',
            [title, content]
        );
        const passageId = result.insertId;
        
        // Thêm câu hỏi nếu có
        if (questions && questions.length > 0) {
            for (let q of questions) {
                // Xử lý options: có thể là string (từ form) hoặc array (từ DB)
                let optionsArray = [];
                if (typeof q.options === 'string') {
                    optionsArray = q.options.split('|').map(o => o.trim());
                } else if (Array.isArray(q.options)) {
                    optionsArray = q.options;
                }
                
                const optionsJson = JSON.stringify(optionsArray);
                await connection.execute(
                    'INSERT INTO reading_questions (passage_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)',
                    [passageId, q.question_text, optionsJson, q.correct_answer]
                );
            }
        }
        
        res.json({ message: "Đã thêm bài đọc thành công!", id: passageId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 3. SỬA bài đọc
app.put('/api/admin/reading/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        // 🌟 ĐÃ FIX 1: Xóa biến 'level' khỏi req.body
        const { title, content, questions } = req.body;

        connection = await mysql.createConnection(dbConfig);
        
        await connection.execute(
            'UPDATE reading_passages SET title=?, content=? WHERE id=?',
            [title, content, id]
        );
        
        // Xóa câu hỏi cũ
        await connection.execute('DELETE FROM reading_questions WHERE passage_id=?', [id]);
        
        // Thêm câu hỏi mới
        if (questions && questions.length > 0) {
            for (let q of questions) {
                // Xử lý options: có thể là string (từ form) hoặc array (từ DB)
                let optionsArray = [];
                if (typeof q.options === 'string') {
                    // Cập nhật split(',') cho đồng bộ với frontend mới
                    optionsArray = q.options.split(',').map(o => o.trim());
                } else if (Array.isArray(q.options)) {
                    optionsArray = q.options;
                }
                
                const optionsJson = JSON.stringify(optionsArray);
                await connection.execute(
                    'INSERT INTO reading_questions (passage_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)',
                    [id, q.question_text, optionsJson, q.correct_answer]
                );
            }
        }
        
        res.json({ message: "Đã cập nhật bài đọc thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 4. XÓA bài đọc
app.delete('/api/admin/reading/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        connection = await mysql.createConnection(dbConfig);
        
        // Xóa câu hỏi liên quan
        await connection.execute('DELETE FROM reading_questions WHERE passage_id=?', [id]);
        // Xóa passage
        await connection.execute('DELETE FROM reading_passages WHERE id=?', [id]);
        
        res.json({ message: "Đã xóa bài đọc!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
// 1. API QUẢN LÝ LÝ THUYẾT GRAMMAR
// ==========================================
app.get('/api/admin/grammar_theory', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM grammar_tenses ORDER BY id ASC');
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    } finally { 
        if (connection) await connection.end(); 
    }
});
app.post('/api/admin/grammar_theory', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { name, usage_desc, formulas, examples } = req.body;
        connection = await mysql.createConnection(dbConfig);
        const newId = 't' + Math.floor(Math.random() * 100000);
        await connection.execute('INSERT INTO grammar_tenses (id, name, usage_desc, formulas, examples) VALUES (?, ?, ?, ?, ?)', [newId, name, usage_desc, formulas, examples]);
        res.json({ message: "Thêm lý thuyết thành công!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

app.put('/api/admin/grammar_theory/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { name, usage_desc, formulas, examples } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE grammar_tenses SET name=?, usage_desc=?, formulas=?, examples=? WHERE id=?', [name, usage_desc, formulas, examples, req.params.id]);
        res.json({ message: "Cập nhật lý thuyết thành công!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

app.delete('/api/admin/grammar_theory/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM grammar_tenses WHERE id=?', [req.params.id]);
        await connection.execute('DELETE FROM grammar_questions WHERE tense_id=?', [req.params.id]); // Xóa sạch bài tập của Thì này
        res.json({ message: "Đã xóa toàn bộ lý thuyết và bài tập liên quan!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

// ==========================================
// 2. API QUẢN LÝ BÀI TẬP GRAMMAR
// ==========================================
app.get('/api/admin/grammar_practice', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Tự động JOIN với bảng tenses để lấy Tên Thì hiển thị cho đẹp
        const [rows] = await connection.execute('SELECT q.*, t.name as tense_name FROM grammar_questions q JOIN grammar_tenses t ON q.tense_id = t.id ORDER BY q.id DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

app.post('/api/admin/grammar_practice', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { tense_id, category, question_text, options, correct_answer, explanation } = req.body;
        connection = await mysql.createConnection(dbConfig);
        const optsJSON = JSON.stringify(options); 
        await connection.execute('INSERT INTO grammar_questions (tense_id, category, question_text, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)', [tense_id, category, question_text, optsJSON, correct_answer, explanation || '']);
        res.json({ message: "Thêm bài tập thành công!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

app.put('/api/admin/grammar_practice/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { tense_id, category, question_text, options, correct_answer, explanation } = req.body;
        connection = await mysql.createConnection(dbConfig);
        const optsJSON = JSON.stringify(options);
        await connection.execute('UPDATE grammar_questions SET tense_id=?, category=?, question_text=?, options=?, correct_answer=?, explanation=? WHERE id=?', [tense_id, category, question_text, optsJSON, correct_answer, explanation || '', req.params.id]);
        res.json({ message: "Cập nhật bài tập thành công!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

app.delete('/api/admin/grammar_practice/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM grammar_questions WHERE id=?', [req.params.id]);
        res.json({ message: "Đã xóa câu hỏi!" });
    } catch (error) { res.status(500).json({ error: error.message }); }
    finally { if (connection) await connection.end(); }
});

// ==========================================
//        API WRITING & TRANSLATE (Placeholder)
// ==========================================

// Writing
// ==========================================
//        API WRITING ADMIN & USER
// ==========================================

// --- API CHO NGƯỜI DÙNG BÊN NGOÀI (Lấy danh sách chủ đề) ---
app.get('/api/writing-topics', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM writing_topics ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// --- API CHO ADMIN (CRUD) ---
// 1. LẤY danh sách
app.get('/api/admin/writing', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM writing_topics ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. THÊM mới
app.post('/api/admin/writing', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: "Thiếu tiêu đề" });
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO writing_topics (title, description) VALUES (?, ?)', [title, description || '']);
        res.json({ message: "Thêm chủ đề thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 3. SỬA
app.put('/api/admin/writing/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { title, description } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE writing_topics SET title=?, description=? WHERE id=?', [title, description || '', req.params.id]);
        res.json({ message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 4. XÓA
app.delete('/api/admin/writing/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM writing_topics WHERE id=?', [req.params.id]);
        res.json({ message: "Đã xóa chủ đề!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// ==========================================
//        API QUẢN LÝ USER (ADMIN PANELS)
// ==========================================

// 1. LẤY danh sách toàn bộ người dùng
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Lấy thông tin trừ mật khẩu để đảm bảo bảo mật
        const [rows] = await connection.execute('SELECT id, email, role FROM users ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. THÊM tài khoản mới từ Admin (Mật khẩu mặc định: 123456)
app.post('/api/admin/users', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { email, role } = req.body;
        if (!email || !role) return res.status(400).json({ error: "Vui lòng nhập đủ thông tin!" });

        connection = await mysql.createConnection(dbConfig);
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: "Email này đã được đăng ký hệ thống!" });

        // Tạo mật khẩu mặc định được mã hóa cho tài khoản mới tạo
        const defaultHashedPassword = await bcrypt.hash('123456', 10);
        await connection.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, defaultHashedPassword, role]
        );
        res.json({ message: "Thêm thành viên thành công! Mật khẩu mặc định là: 123456" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 3. SỬA thông tin/Quyền hạn người dùng
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        const { email, role } = req.body;

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE users SET email = ?, role = ? WHERE id = ?',
            [email, role, id]
        );
        res.json({ message: "Cập nhật thông tin thành viên thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// 4. XÓA tài khoản thành viên
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        
        // Ngăn chặn hành vi Admin vô tình tự xóa chính mình khỏi hệ thống
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ error: "Hệ thống chặn: Bạn không được tự xóa tài khoản của chính mình!" });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: "Đã xóa thành viên ra khỏi hệ thống!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

// Khởi chạy server
app.listen(port, () => {
    console.log(`Server Node.js đang chạy tại http://127.0.0.1:${port}`);
});