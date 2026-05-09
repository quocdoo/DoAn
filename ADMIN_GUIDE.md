# Admin Panel - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Admin Panel cho phép quản lý toàn bộ nội dung của ứng dụng English Learning Hub gồm:
- **Vocabulary** (Từ vựng)
- **Reading** (Bài đọc + Câu hỏi)
- **Grammar** (Ngữ pháp)
- **Writing** (Chủ đề viết)
- **Translate** (Ví dụ dịch)

---

## 🔐 Truy Cập Admin Panel

1. Đăng nhập với tài khoản **Admin**
2. Nhấp vào **⚙️ Admin Panel** trong sidebar (chỉ hiển thị nếu role = admin)
3. Chọn module từ menu bên trái

---

## 📚 Quản Lý Vocabulary (Từ Vựng)

### Thêm từ vựng mới:
1. Nhấp **+ Thêm Mới**
2. Nhập thông tin:
   - **Từ tiếng Anh** (required)
   - **Nghĩa tiếng Việt** (required)
   - **Ví dụ** (optional)
   - **Trình độ**: A1, A2, B1, B2, C1, C2
   - **Chủ đề**: Food, Travel, Technology, v.v.

3. Nhấp **💾 Lưu Dữ Liệu**

### Sửa từ vựng:
1. Nhấp nút **✏️ Sửa** trên hàng cần sửa
2. Chỉnh sửa thông tin
3. Nhấp **💾 Lưu Dữ Liệu**

### Xóa từ vựng:
1. Nhấp nút **🗑️ Xóa** trên hàng cần xóa
2. Xác nhận xóa

---

## 📖 Quản Lý Reading (Bài Đọc)

### Thêm bài đọc mới:
1. Chuyển sang tab **Reading**
2. Nhấp **+ Thêm Mới**
3. Nhập thông tin:
   - **Tiêu đề bài đọc** (required)
   - **Trình độ**: A1-C2
   - **Nội dung bài đọc** (required) - đoạn văn chính

4. **Thêm câu hỏi** - Phần quan trọng:
   - Nhập **Nội dung câu hỏi** (vd: "What is the main idea?")
   - Nhập **Đáp án**: Cách nhau bằng dấu `|` (vd: "A|B|C|D")
   - Nhập **Đáp án đúng**: Chọn một đáp án (vd: "A")
   - Nhấp **➕ Thêm Câu Hỏi**

5. Có thể thêm nhiều câu hỏi (tối thiểu 1, tối đa 10)
6. Nhấp **💾 Lưu Dữ Liệu**

### Sửa bài đọc:
1. Nhấp **✏️ Sửa**
2. Có thể sửa nội dung bài hoặc thay đổi câu hỏi
3. Để xóa câu hỏi cũ, nhấp **Xóa** ở mỗi câu hỏi
4. Thêm câu hỏi mới nếu cần
5. Nhấp **💾 Lưu Dữ Liệu**

---

## 🧩 Quản Lý Grammar (Ngữ Pháp)

### Thêm ngữ pháp mới:
1. Chuyển sang tab **Grammar**
2. Nhấp **+ Thêm Mới**
3. Nhập thông tin:
   - **Tên Thì/Cấu trúc**: vd "Present Simple"
   - **Mô tả cách sử dụng**: vd "Dùng cho thói quen hằng ngày"
   - **Công thức**: vd "S + V (infinitive)"
   - **Ví dụ minh họa**: vd "I eat apple every day"

4. Nhấp **💾 Lưu Dữ Liệu**

### Thêm bài luyện tập:
- Hiện chưa hỗ trợ giao diện thêm bài luyện tập trực tiếp
- Có thể cập nhật trực tiếp trong database nếu cần

---

## ✍️ Quản Lý Writing (Chủ Đề Viết)

1. Chuyển sang tab **Writing**
2. Nhấp **+ Thêm Mới**
3. Nhập:
   - **Chủ đề viết**: vd "Describe your favorite hobby"
   - **Hướng dẫn chi tiết** (optional)
4. Nhấp **💾 Lưu Dữ Liệu**

---

## 🌐 Quản Lý Translate (Ví Dụ Dịch)

1. Chuyển sang tab **Translate**
2. Nhấp **+ Thêm Mới**
3. Nhập:
   - **Văn bản tiếng Anh**
   - **Bản dịch tiếng Việt**
4. Nhấp **💾 Lưu Dữ Liệu**

---

## 🎯 Lưu Ý Quan Trọng

### Định dạng Đáp Án Reading/Grammar:
- Phải cách nhau bằng dấu `|` (pipe)
- Ví dụ: `To read|Reading|Reader|Read`
- Đáp án đúng phải khớp chính xác với một trong các đáp án trên

### Trình độ hợp lệ:
- A1, A2, B1, B2, C1, C2

### Chủ đề Vocabulary hợp lệ:
- Food, Travel, Technology, Education, Sports, Health, v.v.

---

## 🔧 Troubleshooting

### Lỗi "Truy cập bị từ chối"
- Kiểm tra bạn đã đăng nhập với tài khoản Admin chưa
- Kiểm tra role trong database

### Lỗi kết nối API
- Đảm bảo server Node.js đang chạy (`http://127.0.0.1:5000`)
- Kiểm tra CORS settings trong server.js

### Dữ liệu không lưu
- Kiểm tra các trường bắt buộc (marked with *)
- Kiểm tra định dạng đáp án

---

## 📊 Database Tables

```sql
-- Vocabulary
CREATE TABLE vocabulary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(255),
    meaning VARCHAR(255),
    example TEXT,
    level VARCHAR(10),
    topic VARCHAR(100),
    options JSON
);

-- Reading Passages
CREATE TABLE reading_passages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    level VARCHAR(10),
    content LONGTEXT
);

-- Reading Questions
CREATE TABLE reading_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    passage_id INT,
    question_text TEXT,
    options JSON,
    correct_answer VARCHAR(255),
    FOREIGN KEY (passage_id) REFERENCES reading_passages(id)
);

-- Grammar
CREATE TABLE grammar_tenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    usage_desc TEXT,
    formulas TEXT,
    examples TEXT
);
```

---

## 🚀 Cải Tiến Tương Lai

- [ ] Thêm upload hình ảnh
- [ ] Thêm preview trước khi lưu
- [ ] Export/Import dữ liệu
- [ ] Thống kê sử dụng
- [ ] Quản lý quyền hạn chi tiết
