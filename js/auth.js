function showRegister(){

    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("registerForm").classList.add("active");

}

function showLogin(){

    document.getElementById("registerForm").classList.remove("active");
    document.getElementById("loginForm").classList.add("active");

}
// --- XỬ LÝ GIAO DIỆN CHUYỂN FORM ---
function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function showLogin() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// --- XỬ LÝ ĐĂNG KÝ ---
async function handleRegister(event) {
    event.preventDefault(); // Ngăn trình duyệt tải lại trang khi bấm submit

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, confirmPassword })
        });
        
        const data = await response.json();

        if (data.error) {
            alert("Lỗi: " + data.error);
        } else {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            showLogin(); // Tự động chuyển sang form đăng nhập
            document.getElementById('registerForm').reset(); // Xóa trắng form cũ
        }
    } catch (error) {
        console.error(error);
        alert("Không thể kết nối đến máy chủ.");
    }
}

// --- XỬ LÝ ĐĂNG NHẬP ---
async function handleLogin(event) {
    event.preventDefault(); // Ngăn trình duyệt tải lại trang

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    console.log(" Dữ liệu chuẩn bị gửi đi là - Email:", email, "| Pass:", password);

    // Đổi nút thành trạng thái loading
    const btn = document.querySelector('#loginForm .btn');
    const originalText = btn.textContent;
    btn.textContent = 'Đang xử lý...';
    btn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // BẮT BUỘC để server cấp Cookie Session
            // Mặc định cho Remember Me là true cho tiện lợi
            body: JSON.stringify({ email, password, rememberMe: true }) 
        });
        
        const data = await response.json();

        if (data.error) {
            alert("Lỗi: " + data.error);
            btn.textContent = originalText;
            btn.disabled = false;
        } else {
            // Đăng nhập thành công -> Chuyển hướng về trang chủ index.html
            window.location.href = 'index.html'; 
        }
    } catch (error) {
        console.error(error);
        alert("Không thể kết nối đến máy chủ.");
        btn.textContent = originalText;
        btn.disabled = false;
    }
}