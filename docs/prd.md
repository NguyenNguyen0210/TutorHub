# Product Requirements Document (PRD) — TutorHub Backend Platform

**Tên dự án:** TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến  
**Phiên bản:** 2.0 (Production-Ready Architecture)  
**Kiến trúc:** Clean Architecture + CQRS + Vertical Slice Architecture (.NET 8 + PostgreSQL)  

---

## 1. Giới Thiệu & Mục Tiêu Sản Phẩm
TutorHub là nền tảng marketplace kết nối giữa Học Viên có nhu cầu học tập và Gia Sư chuyên môn chất lượng cao. Hệ thống đóng vai trò trung gian bảo đảm:
- Học viên tìm kiếm gia sư minh bạch theo môn học, địa lý, hình thức dạy (Online/Offline) và đánh giá thực tế.
- Quy trình đặt lịch và thanh toán bảo chứng (Escrow Mechanism): Tiền học phí được tạm giữ an toàn, chỉ giải ngân vào ví gia sư khi buổi học diễn ra thành công.
- Tích hợp cổng thanh toán thực tế **VNPay Sandbox (2.1.0)** chuẩn HMAC SHA512.
- Hệ thống quản trị Admin toàn diện giám sát người dùng, duyệt hồ sơ gia sư, xử lý tranh chấp khiếu nại, và đối soát dòng tiền.

---

## 2. Các Phân Hệ Tính Năng Cốt Lõi (Core Feature Modules)

### 2.1 🔐 Xác Thực & Quản Lý Phiên (`Auth & Identity`)
- Đăng ký tài khoản Học viên hoặc Gia sư.
- Đăng nhập bảo mật Email + Password (Bcrypt Hash).
- Cấp phát JWT Access Token (15 phút) và Refresh Token (7 ngày) cơ chế Token Rotation chống replay attack.
- Thu hồi Refresh Token khi đăng xuất hoặc khi tài khoản bị Admin vô hiệu hóa.

### 2.2 👤 Quản Lý Hồ Sơ Cá Nhân (`User Profile`)
- Xem thông tin tài khoản cá nhân.
- Cập nhật Họ tên, Avatar URL, và Số điện thoại di động Việt Nam (Tự động chuẩn hóa canonical `09xxxxxxxx` / `+849xxxxxxxx` 10 chữ số).

### 2.3 👨‍🏫 Quản Lý Gia Sư & Lịch Rảnh (`Tutors & Availability`)
- Tìm kiếm gia sư công khai với bộ lọc đa tiêu chí: Môn học, khoảng giá, địa điểm, bán kính, hình thức dạy (Online/Offline/Both), điểm đánh giá, sắp xếp theo giá/kinh nghiệm/đánh giá.
- Gia sư quản lý hồ sơ chuyên môn (Bio, học vấn, kinh nghiệm, địa chỉ tọa độ).
- Gia sư quản lý danh mục môn dạy kèm giá riêng từng môn (`overridePrice`).
- Gia sư cấu hình khung giờ rảnh hàng tuần theo từng thứ (`DayOfWeek`, `StartTime`, `EndTime`).

### 2.4 📚 Quản Lý Danh Mục & Môn Học (`Categories & Subjects Master Data`)
- Cấu trúc phân cấp danh mục cha/con lồng môn học con.
- API công khai phục vụ tra cứu và bộ lọc tìm kiếm.
- Toàn quyền quản trị CRUD cho Admin kèm cơ chế **Safe Deletion Guard (`409 Conflict`)** ngăn xóa danh mục/môn học đang có dữ liệu ràng buộc.

### 2.5 📅 Đặt Lịch Học & Đánh Giá (`Bookings & Reviews`)
- Học viên chọn slot rảnh và tạo đặt lịch: Hệ thống giữ chỗ tạm 15 phút (`Holding`).
- Background Service tự động hủy và nhả slot nếu quá 15 phút không thanh toán.
- Thanh toán giả lập (Mock Payment) hoặc thanh toán qua cổng VNPay chuyển trạng thái sang `Pending`.
- Gia sư xác nhận lịch dạy (`Confirmed`) hoặc từ chối (`Cancelled` + hoàn tiền 100%).
- Hủy lịch học có chính sách hoàn tiền tự động theo mốc thời gian trước buổi học.
- Xác nhận hoàn thành buổi học (`Completed`) ➔ Giải ngân tiền từ ví giữ sang ví khả dụng của gia sư.
- Học viên đánh giá chất lượng buổi học (Rating 1-5 sao và nhận xét). Tự động cập nhật điểm trung bình `RatingAvg` và tổng số review của gia sư.

### 2.6 💳 Tích Hợp Cổng Thanh Toán VNPay (`VNPay Payment Gateway 2.1.0`)
- Sinh mã `MerchantReference` độc nhất cho từng attempt thanh toán và tạo URL chuyển hướng sang cổng VNPay Sandbox.
- Return URL tiếp nhận redirect trình duyệt, xác thực chữ ký SHA512 (Read-Only UI).
- IPN Webhook Server-to-Server ngầm: Chạy trong **Atomic DB Transaction**, **Idempotency Guard**, kiểm tra toàn diện mã merchant, đơn vị tiền VND, số tiền chính xác, chuyển trạng thái `Booking` sang `Pending`, `Transaction` sang `Held`, và cộng đúng `PayoutAmount` vào ví gia sư.

### 2.7 💼 Ví Tiền & Rút Tiền Gia Sư (`Wallets & Withdrawals`)
- Tách bạch rõ ràng giữa `PendingBalance` (tiền đang giữ từ các booking chưa dạy) và `AvailableBalance` (tiền khả dụng đã dạy xong).
- Gia sư gửi yêu cầu rút tiền về tài khoản ngân hàng (khóa số dư khả dụng chống chi tiêu vượt mức).
- Admin xét duyệt giải ngân (`Approve`) hoặc từ chối (`Reject` và hoàn lại tiền vào ví khả dụng).

### 2.8 ⚖️ Khiếu Nại & Tranh Chấp (`Reports & Resolution`)
- Người dùng gửi báo cáo khiếu nại buổi học kèm lý do và chứng cứ.
- Admin điều tra, tra cứu thông tin hai bên và xử lý tranh chấp: Hoàn tiền, cảnh cáo, khóa tài khoản vi phạm hoặc bác bỏ khiếu nại.

### 2.9 🛡️ Quản Trị Hệ Thống Toàn Diện (`Admin Management & Analytics`)
- **Dashboard Analytics:** Báo cáo thời gian thực về Người dùng, Gia sư theo trạng thái, Bookings theo giai đoạn, và các chỉ số tài chính (Tổng GMV, Net GMV, Doanh thu sàn, Tiền trả gia sư, Tiền hoàn).
- **Revenue Growth Chart:** Biểu đồ doanh thu/booking theo tháng (Zero-fill đầy đủ các tháng không phát sinh giao dịch).
- **Quản lý Người dùng:** Phân trang, tìm kiếm, xem hồ sơ chi tiết (10 bookings gần nhất), và Khóa/Mở khóa tài khoản an toàn (bảo vệ chống self-lockout, chống khóa admin cuối cùng, và thu hồi toàn bộ phiên đăng nhập).
- **Lịch sử Giao dịch Tài chính:** Tra cứu toàn bộ dòng tiền toàn sàn, đối soát mã cổng thanh toán, lọc theo trạng thái và khoảng thời gian chuẩn Half-Open Interval.

---

## 3. Các Ràng Buộc & Tiêu Chuẩn Kỹ Thuật
- **Bảo mật:** JWT Auth, BCrypt password hashing, HMAC SHA512 signature, Idempotency keys, CORS policy.
- **Biên dịch:** `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`, `<LangVersion>12.0</LangVersion>` đạt chuẩn 0 Warning, 0 Error.
- **Tính nhất quán dữ liệu:** Database Transactions cho mọi luồng chuyển tiền và thanh toán IPN.
