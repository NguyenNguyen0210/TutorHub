# PRD: Quản Trị Hệ Thống & Báo Cáo Thống Kê (Admin Management & Analytics)

* **Tính năng:** Báo cáo Dashboard thời gian thực, biểu đồ doanh thu theo tháng, quản trị tài khoản người dùng toàn sàn, quản lý danh mục môn học và tra cứu lịch sử dòng tiền.
* **Người dùng:** Quản Trị Viên (Admin).
* **Stack:** .NET 8 Web API, EF Core 8 (Server-side Aggregation & Direct Projections), PostgreSQL.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Quản trị viên cần góc nhìn toàn cảnh về các chỉ số tăng trưởng (GMV, người dùng, gia sư, tỷ lệ hoàn thành), công cụ kiểm soát an toàn tài khoản người dùng, và đối soát dòng tiền giao dịch.
* **Success Metrics:**
  - Thời gian tính toán và trả về Dashboard Stats < 200ms bằng cách sử dụng các truy vấn aggregate SQL gộp.
  - Biểu đồ doanh thu tự động bù đắp dữ liệu 0 (Zero-filling) cho các tháng không phát sinh giao dịch.
  - 100% tài khoản bị khóa phải bị thu hồi ngay phiên đăng nhập (Revoke Refresh Tokens).

---

## 2. User Stories & Acceptance Criteria

### US-01: Báo cáo Dashboard & Biểu đồ doanh thu (Stats & Revenue Chart)
* **User Story:** Là Admin, tôi muốn xem các con số thống kê tổng quan và biểu đồ tăng trưởng doanh thu theo tháng.
* **Acceptance Criteria:**
  - Trả về snapshot 5 nhóm chỉ số: Users, Tutors theo trạng thái, Bookings theo giai đoạn, Financials (Tổng GMV, Net GMV, Doanh thu sàn, Payout gia sư, Tiền hoàn), và Action Queue (hồ sơ/rút tiền/khiếu nại chờ xử lý).
  - Biểu đồ `revenue-chart` nhóm theo mốc thời gian GMT+7 Việt Nam, tự động zero-fill các tháng trống.

### US-02: Quản trị người dùng toàn sàn (User Management)
* **User Story:** Là Admin, tôi muốn xem danh sách tài khoản, hồ sơ chi tiết và khóa/mở khóa tài khoản khi có vi phạm.
* **Acceptance Criteria:**
  - `PATCH /api/v1/admin/users/{id}/status` với `{ "isActive": false, "reason": "..." }`.
  - **Self-lockout Guard:** Ngăn Admin tự khóa chính mình (`409 Conflict`).
  - **Last Active Admin Guard:** Ngăn khóa Admin đang hoạt động cuối cùng (`409 Conflict`).
  - Tự động thu hồi toàn bộ Refresh Tokens của user khi bị vô hiệu hóa.

### US-03: Quản trị dòng tiền giao dịch (Transactions Audit)
* **User Story:** Là Admin, tôi muốn tra cứu toàn bộ dòng tiền với đầy đủ thông tin Học viên, Gia sư, Môn học, và mã cổng thanh toán.
* **Acceptance Criteria:**
  - Lọc theo `Status` (`Held`, `Released`, `Refunded`), khoảng thời gian Half-Open Interval (`CreatedAt >= FromDate && CreatedAt < ToDate + 1 day`), và `Search` không phân biệt hoa thường.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Dashboard Stats, Revenue Chart, CRUD Master Data Categories/Subjects (Safe Deletion), User Management (kèm guards & token revocation), Transactions Audit.
* **Chưa có trong v1 (Dời sang v2):**
  - Xuất báo cáo kế toán ra file Excel/CSV/PDF trực tiếp từ API.
  - Cấu hình tỷ lệ hoa hồng động theo từng môn học/cấp bậc gia sư.

---

## 4. Edge Cases & Concurrency
* **Chống mất giao dịch cuối ngày:** Lọc thời gian theo chuẩn Half-Open Interval $\text{CreatedAt} < \text{ToDate.Date.AddDays(1)}$ để không bỏ sót các giao dịch phát sinh vào cuối ngày `ToDate`.
