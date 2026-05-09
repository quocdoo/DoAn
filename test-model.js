require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        // Hỏi thẳng server Google xem có những model nào
        const response = await fetch(url);
        const data = await response.json();

        console.log("=== DANH SÁCH MODEL BẠN CÓ THỂ DÙNG ===");
        data.models.forEach(model => {
            // Chỉ lấy những model hỗ trợ chức năng tạo văn bản (generateContent)
            if (model.supportedGenerationMethods.includes("generateContent")) {
                // In ra tên model (đã cắt bỏ chữ 'models/' ở đầu)
                console.log("👉", model.name.replace('models/', ''));
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách model:", error);
    }
}

checkModels();