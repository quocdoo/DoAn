# 🎓 Quick Start Guide - Admin Panel

## 🚀 Bắt Đầu Nhanh

### Bước 1: Đảm bảo Server Chạy
```bash
cd h:\DATN
node js/server.js
# Output: Server Node.js đang chạy tại http://127.0.0.1:5000
```

### Bước 2: Mở Live Server
```
VS Code → Live Server
# Mở http://127.0.0.1:5500
```

### Bước 3: Đăng Nhập Admin
- Nhấp **Đăng nhập**
- Email: `admin@example.com` (hoặc admin nào đã setup)
- Password: `password123` (hoặc mật khẩu tương ứng)

### Bước 4: Vào Admin Panel
- Sau khi đăng nhập, sẽ thấy **⚙️ Admin Panel** ở sidebar
- Nhấp vào để vào giao diện quản lý

---

## 📚 Ví Dụ: Thêm Vocabulary

### 1️⃣ Chuyển sang Vocabulary Module
```
Sidebar trái → 📚 Vocabulary (nếu chưa active)
```

### 2️⃣ Nhấp "+ Thêm Mới"
```
Header phải → [+ Thêm Mới] button
```

### 3️⃣ Điền Form
```
Từ tiếng Anh:      "Apple" *
Nghĩa tiếng Việt:  "Quả táo" *
Ví dụ:             "I eat an apple every day"
Trình độ:          "A1" (dropdown) *
Chủ đề:            "Food" *
```

### 4️⃣ Lưu
```
Bottom → [💾 Lưu Dữ Liệu] button
→ Thấy "✅ Thêm mới thành công!"
→ Bảng tự update, từ mới xuất hiện
```

---

## 📖 Ví Dụ: Thêm Reading Passage

### 1️⃣ Chuyển sang Reading Module
```
Sidebar → 📖 Reading
```

### 2️⃣ Nhấp "+ Thêm Mới"

### 3️⃣ Điền Thông Tin Chính
```
Tiêu đề bài đọc:      "The Lost City" *
Trình độ:             "B1" (dropdown) *
Nội dung bài đọc:     "Once upon a time, there was a city...
                       In the middle of a dense forest...
                       Many adventurers tried to find it..."  *
```

### 4️⃣ Thêm Câu Hỏi

Phần "➕ Quản Lý Câu Hỏi" sẽ xuất hiện:

```
Nội dung câu hỏi:     "What is the setting of this story?" *
Đáp án:               "A forest|A city|An island|A castle" *
Đáp án đúng:          "A city" *

→ Nhấp [➕ Thêm Câu Hỏi]
```

Thêm câu hỏi thứ 2:
```
Nội dung câu hỏi:     "How many adventurers tried to find the city?" *
Đáp án:               "Many|Few|None|Some" *
Đáp án đúng:          "Many" *

→ Nhấp [➕ Thêm Câu Hỏi]
```

### 5️⃣ Xem Danh Sách Câu Hỏi
```
Dưới form thêm câu hỏi, sẽ thấy:

⬜ Câu Hỏi #1
   "What is the setting of this story?"
   [Xóa]

⬜ Câu Hỏi #2
   "How many adventurers tried to find the city?"
   [Xóa]
```

### 6️⃣ Lưu Toàn Bộ
```
Bottom → [💾 Lưu Dữ Liệu]
→ Lưu cả bài đọc lẫn câu hỏi
```

---

## ✏️ Ví Dụ: Sửa Reading Passage

### 1️⃣ Nhấp "✏️ Sửa" ở hàng cần sửa
```
Table → [✏️ Sửa]
→ Modal mở lên với dữ liệu cũ
```

### 2️⃣ Chỉnh Sửa Thông Tin
```
Có thể sửa:
- Tiêu đề
- Trình độ
- Nội dung bài đọc
```

### 3️⃣ Quản Lý Câu Hỏi
```
Danh sách câu hỏi cũ sẽ hiển thị

Để xóa câu hỏi cũ:
→ Nhấp [Xóa] ở câu hỏi đó

Để thêm câu hỏi mới:
→ Điền form "Quản Lý Câu Hỏi"
→ Nhấp [➕ Thêm Câu Hỏi]
```

### 4️⃣ Lưu
```
[💾 Lưu Dữ Liệu]
```

---

## 🗑️ Ví Dụ: Xóa Item

### Cách 1: Xóa từ Table
```
Table → [🗑️ Xóa]
→ Confirm dialog: "Bạn có chắc chắn muốn xóa...?"
→ Nhấp "OK"
→ ✅ "Đã xóa thành công!"
→ Table tự update
```

---

## 🎯 Các Thao Tác Chính

| Tác Vụ | Click Nào | Kết Quả |
|--------|----------|---------|
| Xem danh sách | Module name ở sidebar | Table cập nhật |
| Thêm mới | + Thêm Mới | Modal form mở |
| Sửa | ✏️ Sửa (ở table) | Modal pre-fill |
| Xóa | 🗑️ Xóa (ở table) | Confirm → Xóa |
| Thêm câu hỏi | ➕ Thêm Câu Hỏi (modal) | Add vào list |
| Xóa câu hỏi | Xóa (ở sub-item) | Remove từ list |
| Lưu | 💾 Lưu Dữ Liệu | POST/PUT API |

---

## ⚠️ Lưu Ý Quan Trọng

### Format Đáp Án
```
❌ SAIIII:
"A,B,C,D"
"A B C D"
"Apple|Orange|Banana Mango"

✅ ĐÚNG:
"A|B|C|D"
"Apple|Orange|Banana|Mango"
```

### Trình Độ
```
Chỉ chấp nhận: A1, A2, B1, B2, C1, C2
❌ "Elementary"
✅ "A1"
```

### Các Trường Required (*)
```
Vocabulary:
  - Từ tiếng Anh *
  - Nghĩa tiếng Việt *
  - Trình độ *
  - Chủ đề *

Reading:
  - Tiêu đề *
  - Trình độ *
  - Nội dung *
  - Câu hỏi: question_text *, options *, correct_answer *

Grammar:
  - Tên Thì *
  - Mô tả *
  - Công thức *
  - Ví dụ *
```

---

## 🔍 Debugging

### Vấn đề: Không thấy Admin Panel
```
✓ Kiểm tra: Role === "admin" trong database
✓ Kiểm tra: Đã đăng nhập chưa
✓ Reload page (Ctrl+R)
```

### Vấn đề: Không lưu được dữ liệu
```
✓ Kiểm tra: Tất cả trường bắt buộc (*) đã điền chưa
✓ Kiểm tra: Server chạy chưa (http://127.0.0.1:5000)
✓ Mở DevTools → Console, xem lỗi chi tiết
✓ Mở DevTools → Network, xem response
```

### Vấn đề: Bảng không update sau lưu
```
✓ Reload page (Ctrl+R)
✓ Check browser console cho errors
✓ Kiểm tra response từ server
```

---

## 💡 Tips & Tricks

### 1. Bôi đen đoạn văn để copy nhanh
```
Reading content → Bôi đen → Ctrl+C
```

### 2. Dùng Enter trong textarea
```
Nhấp Ctrl+Enter (hoặc Cmd+Enter macOS)
để không bị submit form
```

### 3. Gõ nhanh với Tab
```
Trường 1 → Tab → Trường 2 → Tab → ...
```

### 4. Xem dữ liệu đã lưu
```
F12 → Network tab
→ Tìm request POST/PUT
→ Xem Response JSON
```

---

## 🎬 Workflow Thực Tế

### Day 1: Setup Dữ Liệu Ban Đầu
```
1. Thêm 20 từ vựng cho 4 chủ đề
2. Thêm 5 bài đọc, mỗi bài 5-10 câu hỏi
3. Kiểm tra các thông tin xuất hiện đúng trong app
```

### Day 2: Maintain Dữ Liệu
```
1. Thêm từ vựng mới theo yêu cầu
2. Sửa lỗi chính tả/ngữ pháp
3. Xóa content cũ/không cần dùng
```

### Day 3+: Monitor & Update
```
1. Xem feedback từ users
2. Cập nhật bài tập khó hơn
3. Thêm bài đọc theo xu hướng
```

---

## 🎓 Summary

Admin Panel giúp bạn:
✅ Quản lý toàn bộ nội dung bài giảng
✅ Thêm/sửa/xóa content nhanh chóng
✅ Không cần viết code, chỉ điền form
✅ Dữ liệu lưu trực tiếp vào database

**Happy managing! 🚀**
