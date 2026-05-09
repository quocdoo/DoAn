# ⚠️ Các Bước Hoàn Thiện Còn Lại

## 1️⃣ Hoàn Thiện Writing Topics API

### Database Table:
```sql
CREATE TABLE writing_topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data:
INSERT INTO writing_topics (title, description) VALUES
('Describe your favorite hobby', 'Write 50-100 words about something you love doing'),
('Write about a memorable trip', 'Share an experience from a travel'),
('Benefits of reading books', 'Discuss why reading is important'),
('Your dream job', 'Describe the job you want in the future');
```

### Update server.js:
```javascript
// Replace placeholder với code thực:
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

app.post('/api/admin/writing', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: "Cần nhập tiêu đề" });

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO writing_topics (title, description) VALUES (?, ?)',
            [title, description || '']
        );
        res.json({ message: "Đã thêm chủ đề viết!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.put('/api/admin/writing/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { title, description } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE writing_topics SET title=?, description=? WHERE id=?',
            [title, description, req.params.id]
        );
        res.json({ message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.delete('/api/admin/writing/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM writing_topics WHERE id=?', [req.params.id]);
        res.json({ message: "Xóa thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});
```

---

## 2️⃣ Hoàn Thiện Translate Examples API

### Database Table:
```sql
CREATE TABLE translate_examples (
    id INT PRIMARY KEY AUTO_INCREMENT,
    english_text TEXT NOT NULL,
    vietnamese_text TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data:
INSERT INTO translate_examples (english_text, vietnamese_text, category) VALUES
('Hello, how are you?', 'Xin chào, bạn khỏe không?', 'Greeting'),
('I love studying English', 'Tôi yêu thích học tiếng Anh', 'General'),
('Where is the nearest hospital?', 'Bệnh viện gần nhất ở đâu?', 'Direction');
```

### Update server.js:
```javascript
// Replace placeholder với code thực:
app.get('/api/admin/translate', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM translate_examples ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/api/admin/translate', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { english_text, vietnamese_text, category } = req.body;
        if (!english_text || !vietnamese_text) {
            return res.status(400).json({ error: "Cần nhập cả tiếng Anh và tiếng Việt" });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO translate_examples (english_text, vietnamese_text, category) VALUES (?, ?, ?)',
            [english_text, vietnamese_text, category || 'General']
        );
        res.json({ message: "Đã thêm ví dụ dịch!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.put('/api/admin/translate/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        const { english_text, vietnamese_text, category } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE translate_examples SET english_text=?, vietnamese_text=?, category=? WHERE id=?',
            [english_text, vietnamese_text, category, req.params.id]
        );
        res.json({ message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.delete('/api/admin/translate/:id', requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM translate_examples WHERE id=?', [req.params.id]);
        res.json({ message: "Xóa thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});
```

---

## 3️⃣ Update moduleConfig trong script.js

Thay thế phần writing và translate:

```javascript
// Cập nhật trong moduleConfig object:

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

translate: {
    title: "Translate Examples",
    apiEndpoint: "/api/admin/translate",
    tableHeaders: ["ID", "Tiếng Anh", "Tiếng Việt", "Hành động"],
    dataKeys: ["id", "english_text", "vietnamese_text"],
    formFields: [
        { id: "english_text", label: "Văn bản tiếng Anh", type: "textarea", required: true },
        { id: "vietnamese_text", label: "Bản dịch tiếng Việt", type: "textarea", required: true }
    ]
}
```

---

## 4️⃣ Chạy SQL Script

Trong MySQL:

```sql
-- Connect to testel database
USE testel;

-- Tạo tables nếu chưa có
CREATE TABLE IF NOT EXISTS writing_topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS translate_examples (
    id INT PRIMARY KEY AUTO_INCREMENT,
    english_text TEXT NOT NULL,
    vietnamese_text TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO writing_topics (title, description) VALUES
('Describe your favorite hobby', 'Write 50-100 words about something you love doing'),
('Write about a memorable trip', 'Share an experience from a travel'),
('Benefits of reading books', 'Discuss why reading is important');

INSERT INTO translate_examples (english_text, vietnamese_text, category) VALUES
('Hello, how are you?', 'Xin chào, bạn khỏe không?', 'Greeting'),
('I love studying English', 'Tôi yêu thích học tiếng Anh', 'General');
```

---

## 5️⃣ Test APIs

Sau khi update, test bằng Postman hoặc curl:

```bash
# Test GET Writing
curl -X GET http://127.0.0.1:5000/api/admin/writing \
  -H "Cookie: connect.sid=YOUR_COOKIE"

# Test POST Writing
curl -X POST http://127.0.0.1:5000/api/admin/writing \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_COOKIE" \
  -d '{
    "title": "My First Composition",
    "description": "Write about your first day at school"
  }'
```

---

## 📋 Checklist Hoàn Thiện

- [ ] Tạo writing_topics table
- [ ] Tạo translate_examples table
- [ ] Update server.js với code thực
- [ ] Update moduleConfig
- [ ] Insert sample data
- [ ] Test APIs
- [ ] Kiểm tra admin panel UI
- [ ] Test CRUD operations trong UI

---

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thiện, admin panel sẽ có đầy đủ 5 modules:

✅ Vocabulary - Quản lý từ vựng
✅ Reading - Quản lý bài đọc + câu hỏi
✅ Grammar - Quản lý ngữ pháp
✅ **Writing - Quản lý chủ đề viết** (cần hoàn thiện)
✅ **Translate - Quản lý ví dụ dịch** (cần hoàn thiện)

Tất cả đều có CRUD đầy đủ: Create, Read, Update, Delete
