import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import TutorLayout from '../layouts/TutorLayout';
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';

// Placeholder Component
import PlaceholderScreen from '../components/common/PlaceholderScreen';

// Guards
import { RequireAuth, RequireRole, GuestGuard } from './RouteGuards';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/tutors" replace />} />
        
        {/* Screen 3: Discovery */}
        <Route path="/tutors" element={
          <PlaceholderScreen
            screenId="90248f5499e448dead8bc5fe8b684ffd"
            title="Khám Phá & Tìm Kiếm Gia Sư Bảo Chứng"
            route="/tutors"
            roleTag="Public"
            description="Tìm kiếm gia sư với bộ lọc đa chiều (10 Danh mục, 15 Môn học, Online/Offline, Rating, Giá), Hero banner Escrow Guarantee và thẻ gia sư xác thực (ThS. An, Cô Bích, Thầy Nam)."
            quickActions={[
              { label: 'Xem Hồ Sơ ThS. Nguyễn Văn An', to: '/tutors/tutor-an-001', primary: true },
              { label: 'Đến Checkout Giữ Chỗ 15p', to: '/student/bookings/b1b1b1b1-0001/checkout' }
            ]}
          />
        } />

        {/* Screen 4: Tutor Profile */}
        <Route path="/tutors/:id" element={
          <PlaceholderScreen
            screenId="3b87c223b2374d7ca325b96070c110f0"
            title="Hồ Sơ Gia Sư Nguyễn Văn An & Gói Dịch Vụ"
            route="/tutors/:id"
            roleTag="Public"
            description="Hồ sơ chi tiết ThS. An, bằng cử nhân ĐHSP, video bài học thử 30p, ma trận lịch rảnh hàng tuần theo giờ VN, danh mục gói học (10 buổi x 60p, 15 buổi x 90p) và đánh giá đối soát từ học viên Tuấn."
            quickActions={[
              { label: 'Đặt Gói 10 Buổi (Giữ Chỗ 15 Phút)', to: '/student/bookings/b1b1b1b1-0001/checkout', primary: true },
              { label: 'Nhắn Tin Trao Đổi Trong Khung Chat', to: '/app/messages' }
            ]}
          />
        } />

        {/* Screen 5: Booking Checkout */}
        <Route path="/student/bookings/:id/checkout" element={
          <PlaceholderScreen
            screenId="b2d7092ca69c4f2aab57cbde7a7ca252"
            title="Thanh Toán Giữ Chỗ 15 Phút (Holding Checkout)"
            route="/student/bookings/:id/checkout"
            roleTag="Student"
            description="Đồng hồ đếm ngược 15 phút (Holding Lock 13:42), snapshot hợp đồng 2.000.000 ₫ (miễn phí sàn cho học viên), cam kết Escrow từng buổi, tích hợp VNPay Sandbox 2.1.0 và thẻ test NCB."
            quickActions={[
              { label: 'Giả Lập Thanh Toán Thành Công', to: '/payment/return?vnp_ResponseCode=00&vnp_TxnRef=THB-992&vnp_Amount=200000000', primary: true },
              { label: 'Quay Lại Hồ Sơ Gia Sư', to: '/tutors/tutor-an-001' }
            ]}
          />
        } />

        {/* Screen 6: Payment Return */}
        <Route path="/payment/return" element={
          <PlaceholderScreen
            screenId="386beaf4ef1a44c48ec3c4cb20d36a63"
            title="Kết Quả Thanh Toán VNPay & Kích Hoạt Hợp Đồng"
            route="/payment/return"
            roleTag="Student"
            description="Màn hình tiếp nhận kết quả vnp_ResponseCode=00 (Thành công), thông báo Smart Escrow kích hoạt hợp đồng e1e1e1e1-0001 và tự động cấp phát 10 buổi học con."
            quickActions={[
              { label: 'Vào Trung Tâm Hợp Đồng Học Tập', to: '/student/enrollments/e1e1e1e1-0001', primary: true },
              { label: 'Về Bàn Học Viên', to: '/student/dashboard' }
            ]}
          />
        } />

        {/* Shared Chat & Notifications */}
        <Route path="/app/messages" element={
          <PlaceholderScreen
            screenId="895120e8aff04b239845b5c46365161c"
            title="Hộp Thư Chat Realtime & Đề Xuất Hợp Đồng Riêng"
            route="/app/messages"
            roleTag="Shared"
            description="Hộp thư SignalR ChatHub, sidebar hội thoại, nút Gọi Video Meet tích hợp telemetry, Thẻ Đề Xuất Hợp Đồng Tùy Chỉnh 📜 (5 buổi x 60p, 1.000.000 ₫, 1-Click Checkout)."
            quickActions={[
              { label: 'Xem Trung Tâm Hợp Đồng', to: '/student/enrollments/e1e1e1e1-0001' },
              { label: 'Xem Thông Báo Đa Kênh', to: '/app/notifications' }
            ]}
          />
        } />

        <Route path="/app/notifications" element={
          <PlaceholderScreen
            screenId="09816d219c5d4544b2ac71b0d7ab5fe9"
            title="Trung Tâm Thông Báo Đa Kênh & Cảnh Báo Hệ Thống"
            route="/app/notifications"
            roleTag="Shared"
            description="Feed thông báo đa kênh phân loại tabs (Tất cả, Tài chính Escrow, Lịch học, Tranh chấp), các hành động trực tiếp (Xác nhận điểm danh, Xem phán quyết hoàn tiền)."
            quickActions={[
              { label: 'Điểm Danh Buổi Học #3', to: '/student/sessions/s3s3s3s3-0003', primary: true }
            ]}
          />
        } />
      </Route>

      {/* 2. Auth Routes */}
      <Route element={<AuthLayout />}>
        {/* Screen 1: Login */}
        <Route path="/auth/login" element={
          <PlaceholderScreen
            screenId="133f0420b488482789a3a6b271165d02"
            title="Đăng Nhập & Chọn Tài Khoản Test Nhanh"
            route="/auth/login"
            roleTag="Guest"
            description="Đăng nhập glassmorphism với thanh chọn nhanh 1-Click: Admin, Gia sư ThS. An, Học viên Tuấn, Học viên bị khóa Bùng (2 Strikes)."
            quickActions={[
              { label: 'Đăng Nhập Gia Sư ThS. An', to: '/tutor/dashboard', primary: true },
              { label: 'Đăng Ký Trở Thành Gia Sư', to: '/tutor/application' }
            ]}
          />
        } />
        
        {/* Screen 2: Tutor Application */}
        <Route path="/tutor/application" element={
          <PlaceholderScreen
            screenId="9933a6cf12ce4b219e49f52b10078e24"
            title="Quy Trình Đăng Ký & Kiểm Duyệt Gia Sư 4 Bước"
            route="/tutor/application"
            roleTag="Guest"
            description="Wizard 4 bước: 1. Cá nhân & KYC -> 2. Học vấn & Bằng ĐH Sư Phạm scan -> 3. Môn dạy & Video trial -> 4. Ngân hàng thụ hưởng nhận giải ngân Escrow."
            quickActions={[
              { label: 'Vào Bàn Duyệt Gia Sư Của Admin', to: '/admin/tutor-applications', primary: true }
            ]}
          />
        } />
      </Route>

      {/* 3. Student Routes */}
      <Route path="/student" element={<StudentLayout />}>
        {/* Screen 7: Student Dashboard */}
        <Route path="dashboard" element={
          <PlaceholderScreen
            screenId="599ad0aec6da453f9c052a46dbd219e6"
            title="Bàn Học Của Tôi & Tổng Quan Tiến Độ"
            route="/student/dashboard"
            roleTag="Student"
            description="Dashboard học viên: 1.600.000 ₫ bảo chứng trong Escrow an toàn, cảnh báo buổi học #2 cần đối soát 24h, lịch học tuần với Google Meet."
            quickActions={[
              { label: 'Xem Hợp Đồng Toán 10 Buổi', to: '/student/enrollments/e1e1e1e1-0001', primary: true },
              { label: 'Đối Soát Điểm Danh Buổi #3', to: '/student/sessions/s3s3s3s3-0003' }
            ]}
          />
        } />

        {/* Screen 8: Enrollment Contract Hub */}
        <Route path="enrollments/:id" element={
          <PlaceholderScreen
            screenId="f21f02561f4949459c3604a259b6d51c"
            title="Quản Trị Hợp Đồng Học Tập & Phân Rã N Buổi Học"
            route="/student/enrollments/:id"
            roleTag="Student"
            description="Hợp đồng e1e1e1e1-0001, snapshot phí sàn 10%, tiến độ 2/10 buổi, nút hủy pro-rata công thức 2tr - 400k = 1.6tr, timeline từng buổi học con."
            quickActions={[
              { label: 'Đối Soát Điểm Danh Buổi #3', to: '/student/sessions/s3s3s3s3-0003', primary: true },
              { label: 'Mở Đơn Khiếu Nại Tranh Chấp', to: '/student/disputes/new' }
            ]}
          />
        } />

        {/* Screen 9: 24h Dual Attendance */}
        <Route path="sessions/:id" element={
          <PlaceholderScreen
            screenId="77c2aa8772e44740a53bbed1b3dbadb1"
            title="Cửa Sổ Đối Soát Điểm Danh 2 Chiều 24 Giờ & Xung Đột"
            route="/student/sessions/:id"
            roleTag="Student"
            description="Cửa sổ 24h: Thẻ điểm danh 2 cột (Học viên: Đã học vs Gia sư: Báo vắng), banner đỏ AttendanceConflict, tiền tiếp tục phong tỏa an toàn trong Escrow."
            quickActions={[
              { label: 'Nộp Đơn Khiếu Nại Lên Trọng Tài', to: '/student/disputes/new', primary: true },
              { label: 'Nhắn Tin Trao Đổi Lại Với Gia Sư', to: '/app/messages' }
            ]}
          />
        } />

        {/* Screen 10: Dispute Filing */}
        <Route path="disputes/new" element={
          <PlaceholderScreen
            screenId="784b68eac38c4da5ae64f2aad3456bc6"
            title="Biểu Mẫu Nộp Đơn Khiếu Nại Buổi Học"
            route="/student/disputes/new"
            roleTag="Student"
            description="Nộp khiếu nại buổi #3: Lý do TutorNoShow, mô tả >= 20 ký tự, đính kèm ảnh bằng chứng phòng Google Meet, thông báo tự động phong tỏa 200k tiền học."
            quickActions={[
              { label: 'Chuyển Sang Bàn Trọng Tài Admin', to: '/admin/disputes/ba07ba07-0001', primary: true }
            ]}
          />
        } />
      </Route>

      {/* 4. Tutor Routes */}
      <Route path="/tutor" element={<TutorLayout />}>
        {/* Screen 11: Tutor Dashboard */}
        <Route path="dashboard" element={
          <PlaceholderScreen
            screenId="594b674667a74912a1297e6dec664bf6"
            title="Bảng Điều Hành Gia Sư & Lớp Dạy Hôm Nay"
            route="/tutor/dashboard"
            roleTag="Tutor"
            description="Lớp học 18:00 với Tuấn (vào phòng Meet có telemetry), thu nhập Pending 3.6tr vs Available 900k, chỉ số Strike 0/2, việc cần làm."
            quickActions={[
              { label: 'Xem Thời Khóa Biểu Rảnh Tuần', to: '/tutor/availability', primary: true },
              { label: 'Quản Trị Ví Tiền & Rút Thu Nhập', to: '/tutor/wallet' }
            ]}
          />
        } />

        {/* Screen 12: Availability Matrix */}
        <Route path="availability" element={
          <PlaceholderScreen
            screenId="e55cd8a1b357418386edbf81e88e697d"
            title="Quản Lý Thời Khóa Biểu & Ma Trận Lịch Rảnh Tuần"
            route="/tutor/availability"
            roleTag="Tutor"
            description="Thời khóa biểu 7 ngày theo giờ VN, bật/tắt nhận học viên, thêm/sửa slot rảnh, hiển thị slot đã có lịch vs slot trống."
            quickActions={[
              { label: 'Quản Lý Các Gói Dịch Vụ', to: '/tutor/services', primary: true }
            ]}
          />
        } />

        {/* Screen 13: Service Packages */}
        <Route path="services" element={
          <PlaceholderScreen
            screenId="b1547b44fe9443e1a43a35435a22720e"
            title="Quản Lý Danh Mục Gói Dịch Vụ Giảng Dạy"
            route="/tutor/services"
            roleTag="Tutor"
            description="Danh mục gói học niêm yết: Gói 10 buổi 2tr, Gói 15 buổi Chuyên đề 3.5tr, số học viên theo học và doanh thu từng gói."
            quickActions={[
              { label: 'Xem Trung Tâm Ví Escrow', to: '/tutor/wallet', primary: true }
            ]}
          />
        } />

        {/* Screen 14: Tutor Wallet */}
        <Route path="wallet" element={
          <PlaceholderScreen
            screenId="d6e6c60145264479a999835b8a664631"
            title="Trung Tâm Tài Chính & Quản Trị Ví Bảo Chứng Gia Sư"
            route="/tutor/wallet"
            roleTag="Tutor"
            description="Lưới 4 thẻ số dư: Pending 3.6tr, Available 900k, Held 200k (phong tỏa buổi #3), Withdrawable 700k. Tài khoản VCB KYC, sổ cái sao kê ví bất biến."
            quickActions={[
              { label: 'Tạo Lệnh Rút Tiền Về Ngân Hàng', to: '/tutor/wallet/withdraw', primary: true }
            ]}
          />
        } />

        {/* Screen 15: Withdrawal Request */}
        <Route path="wallet/withdraw" element={
          <PlaceholderScreen
            screenId="86d9e1af2abd468ea959d8a0107214c2"
            title="Yêu Cầu Rút Tiền Về Tài Khoản Ngân Hàng"
            route="/tutor/wallet/withdraw"
            roleTag="Tutor"
            description="Form rút tiền kiểm tra hạn mức (tối đa 700.000 ₫, tối thiểu 50.000 ₫), tài khoản VCB KYC, bảng lịch sử lệnh rút tiền kèm trạng thái."
            quickActions={[
              { label: 'Quay Lại Ví Escrow', to: '/tutor/wallet' }
            ]}
          />
        } />
      </Route>

      {/* 5. Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Screen 18: Admin Dashboard */}
        <Route path="dashboard" element={
          <PlaceholderScreen
            screenId="71ef366c71be4608b810aff7ccb7c87c"
            title="Bảng Điều Hành Quản Trị Sàn & Giám Sát Dòng Tiền GMV"
            route="/admin/dashboard"
            roleTag="Admin"
            description="KPI Master: Tổng GMV 1.42 tỷ ₫, Phí sàn 10% 142 triệu ₫, Escrow 385 triệu ₫, Tỷ lệ giải quyết 98.4%. Biểu đồ tài chính và hàng đợi công việc khẩn cấp."
            quickActions={[
              { label: 'Bàn Trọng Tài Tranh Chấp DEC-S8-025', to: '/admin/disputes/ba07ba07-0001', primary: true },
              { label: 'Bàn Duyệt Hồ Sơ Gia Sư', to: '/admin/tutor-applications' }
            ]}
          />
        } />

        {/* Screen 19: Tutor Applications Verification */}
        <Route path="tutor-applications" element={
          <PlaceholderScreen
            screenId="db213ce9cae4411bbdf122837f615e46"
            title="Bàn Kiểm Duyệt Hồ Sơ Gia Sư & Xác Minh Bằng Cấp"
            route="/admin/tutor-applications"
            roleTag="Admin"
            description="Duyệt hồ sơ ThS. An, xem scan bằng cấp ĐHSP, video trial, phê duyệt cấp huy hiệu Verified Master Badge."
            quickActions={[
              { label: 'Quản Lý Người Dùng & Kỷ Luật', to: '/admin/users', primary: true }
            ]}
          />
        } />

        {/* Screen 20: Dispute Arbitration Desk */}
        <Route path="disputes/:id" element={
          <PlaceholderScreen
            screenId="5dce1603b9b1445f918c2a137b8cc397"
            title="Bàn Trọng Tài & Phân Xử Khiếu Nại Buổi Học DEC-S8-025"
            route="/admin/disputes/:id"
            roleTag="Admin"
            description="Vụ án TutorNoShow #ba07ba07-0001, bằng chứng Meet, máy tính cân đối phí sàn DEC-S8-025 (Refund 200k ≡ Recovery 180k + Reversal 20k), cảnh báo Strike."
            quickActions={[
              { label: 'Kiểm Tra Sổ Cái Audit Log Bất Biến', to: '/admin/audit-logs', primary: true },
              { label: 'Xem Bảng Kỷ Luật Absent Strikes', to: '/admin/users' }
            ]}
          />
        } />

        {/* Screen 21: User Management & Strikes */}
        <Route path="users" element={
          <PlaceholderScreen
            screenId="327b21fd52db462688714851ff3b496c"
            title="Quản Lý Người Dùng & Kỷ Luật Vi Phạm Sàn"
            route="/admin/users"
            roleTag="Admin"
            description="Absent Strike Tracker: Học viên Trần Văn Bùng (2/3 Strikes, tạm khóa 7 ngày), Gia sư Nguyễn Văn An (0 Strikes, uy tín 100%), thao tác mở khóa/kỷ luật."
            quickActions={[
              { label: 'Xem Sổ Cái Kiểm Toán Toàn Sàn', to: '/admin/audit-logs', primary: true }
            ]}
          />
        } />

        {/* Screen 22: Central Audit Logs */}
        <Route path="audit-logs" element={
          <PlaceholderScreen
            screenId="28ee0080f98e4d6491c8a28bc51eba83"
            title="Sổ Cái Kiểm Toán Bất Biến Trung Tâm (Central Audit Log)"
            route="/admin/audit-logs"
            roleTag="Admin"
            description="Sổ cái Append-Only lưu vết vĩnh viễn với CorrelationId (X-Correlation-ID), kiểm toán biến động giải ngân, hợp đồng, hoàn tiền kèm bộ xem JSON Diff."
            quickActions={[
              { label: 'Về Bảng Điều Hành Admin', to: '/admin/dashboard', primary: true }
            ]}
          />
        } />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={
        <div className="p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">404 — Tuyến Đường Không Tồn Tại</h2>
          <p className="text-xs text-slate-500 mb-4">Trang bạn yêu cầu chưa được định tuyến hoặc không hợp lệ.</p>
          <a href="/tutors" className="text-indigo-600 font-bold text-xs">Về Trang Khám Phá</a>
        </div>
      } />
    </Routes>
  );
}
