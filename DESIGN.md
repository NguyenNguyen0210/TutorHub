# TutorHub — Design System & Visual Architecture Specification (`DESIGN.md`)

**Product:** TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên Trực Tuyến  
**Core Model:** Service / Package-based Learning with 2-Way Escrow Guarantee  
**Status:** Canonical Visual & Design System Specification  
**Tech Alignment:** HTML5, Modern CSS / TailwindCSS Token Ready, React/Vite/Next.js Compatible  

---

## 1. Design Vision & The Native Shape of TutorHub

### 1.1. Core Identity & Metaphor
TutorHub **không phải là một trang thương mại điện tử thông thường**, cũng **không phải bảng rao vặt đặt lịch lẻ tẻ theo giờ**.
Bản sắc cốt lõi của TutorHub là **"Cỗ Máy Điều Phối Hợp Đồng Học Tập Trọn Gói Bảo Tồn Dòng Tiền Hai Chiều" (Dual-Guaranteed Learning Contract Pipeline)**:
- **Học viên** được bảo vệ dòng tiền qua cơ chế **Ví Bảo Chứng (Escrow)**: Tiền học được tạm giữ an toàn, chỉ giải ngân theo từng buổi học thực tế sau khi đối soát điểm danh thành công.
- **Gia sư** được đảm bảo nguồn thu nhập minh bạch: Mỗi hợp đồng học tập (**Enrollment**) chia đều học phí thành $N$ buổi học con với số tiền thu nhập (**EarningAmount**) được chốt bất biến.
- **Sàn giao dịch** vận hành như một định chế trung gian công bằng: Áp dụng công thức cân đối phí sàn bất biến ($\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$) và lưu vết kiểm toán vĩnh viễn trên sổ cái **Central Audit Log**.

### 1.2. Dominant Feature: The Lifecycle Pipeline (Trục Thiết Kế Chủ Đạo)
Mọi trang màn hình, thành phần giao diện và điều hướng của TutorHub đều được tổ chức theo **trục vòng đời 7 bước**, lấy tiến trình hợp đồng làm trung tâm thay vì các section rời rạc:

```text
[ 1. Discovery ] ➔ [ 2. 15m Checkout Hold ] ➔ [ 3. Enrollment & Allocator ]
       ➔ [ 4. Scheduling & Slots ] ➔ [ 5. 24h Dual Attendance ]
              ➔ [ 6. Escrow Payout Release ] ➔ [ 7. Dispute / Ledger Settlement ]
```

---

## 2. Design Tokens & Visual Foundations

### 2.1. Color Palette (Bảng Màu Định Danh Chuẩn Xác)

Bảng màu được thiết kế để phản ánh tính chất tài chính minh bạch, giáo dục học thuật và độ tin cậy tuyệt đối:

#### Primary Brand: Royal Navy & Slate (Học thuật, Uy tín & Nền tảng)
- `brand-navy-950`: `#0B0F17` (Deep Midnight — Nền chế độ tối chuyên sâu)
- `brand-navy-900`: `#0F172A` (Slate 900 — Sidebar, Topbar, Dark Surface)
- `brand-navy-800`: `#1E293B` (Slate 800 — Thẻ Card Dark Mode, Border tối)
- `brand-indigo-600`: `#4F46E5` (Indigo chính — Nút bấm chính, Active Tab, Primary Accent)
- `brand-indigo-500`: `#6366F1` (Indigo sáng — Hover effect, Gradient Glow)
- `brand-indigo-50`: `#EEF2FF` (Nền badge nhẹ, Focus ring)

#### Financial Status Colors (Dòng Tiền & Bất Biến Nghiệp Vụ)

| Token Name | Hex Code | Ý nghĩa nghiệp vụ trong Codebase | Ứng dụng giao diện |
| :--- | :--- | :--- | :--- |
| **`financial-available`** | `#10B981` (Emerald 500) | `AvailableBalance`, `SessionPayoutCredit`, `Paid` | Thẻ số dư khả dụng, nút "Rút tiền", badge "Đã xác nhận", icon Attended |
| **`financial-available-bg`** | `#ECFDF5` (Emerald 50) | Nền thẻ thu nhập thành công | Background card giải ngân thành công |
| **`financial-holding`** | `#F59E0B` (Amber 500) | `HoldingExpiresAt` (15m), `PendingBalance`, `Proposed` | Đồng hồ đếm ngược giữ chỗ 15 phút, tiền cọc Escrow, slot chờ xếp |
| **`financial-holding-bg`** | `#FFFBEB` (Amber 50) | Nền cảnh báo giữ chỗ / chờ xác nhận | Background banner đếm ngược 15 phút |
| **`financial-dispute`** | `#EF4444` (Rose 500) | `HeldBalance`, `AttendanceConflict`, `DisputeActive`, `Banned` | Thẻ tiền phong tỏa tranh chấp, huy hiệu xung đột điểm danh, cảnh báo 2 Strikes |
| **`financial-dispute-bg`** | `#FEF2F2` (Rose 50) | Nền cảnh báo khiếu nại | Background thẻ tranh chấp |
| **`financial-escrow-blue`** | `#3B82F6` (Blue 500) | `EnrollmentActive`, `Scheduled`, `UnderReview` | Tiến độ học tập, lịch học sắp tới, admin đang xử lý |

#### Neutral Surfaces & Borders
- `surface-canvas-light`: `#F8FAFC` (Slate 50 — Nền ứng dụng sáng)
- `surface-card-light`: `#FFFFFF` (Trắng tinh khiết)
- `surface-card-glass`: `rgba(255, 255, 255, 0.82)` (Hiệu ứng Glassmorphism)
- `border-light`: `#E2E8F0` (Slate 200 — Đường phân cách tinh xảo)
- `text-primary`: `#0F172A` (Slate 900 — Tiêu đề, số tiền chính)
- `text-secondary`: `#475569` (Slate 600 — Nhãn phụ, mô tả buổi học)
- `text-muted`: `#94A3B8` (Slate 400 — Placeholder, mã hash, timestamps)

---

### 2.2. Typography System (Hệ Thống Kiểu Chữ Chuẩn Mực)

Hệ thống sử dụng **hai họ font bổ trợ nhau**:
1. **`Plus Jakarta Sans` / `Inter`:** Font sans-serif hình học hiện đại, dễ đọc trên bảng biểu dày đặc và tin nhắn.
2. **`JetBrains Mono`:** Font monospace dùng bắt buộc cho: Mã giao dịch (`PaymentGatewayRef`), Mã định danh (`AuditLog.Id`), Đồng hồ đếm ngược (`14:59`), Mã Correlation (`X-Correlation-ID`) và các con số tài chính.

| Cấp bậc (Hierarchy) | Kích thước (Size / Line Height) | Độ đậm (Weight) | Ứng dụng cụ thể |
| :--- | :--- | :--- | :--- |
| **Display Hero** | `36px (2.25rem) / 1.2` | Bold (700) | Hero title trang chủ, Số dư ví tổng trên Dashboard |
| **Heading 1 (H1)** | `28px (1.75rem) / 1.3` | Bold (700) | Tiêu đề chính trang màn hình (Hợp đồng học tập, Trung tâm ví) |
| **Heading 2 (H2)** | `22px (1.375rem) / 1.35` | SemiBold (600) | Tiêu đề khối (Danh sách buổi học con, Bảng sao kê ví) |
| **Heading 3 (H3)** | `18px (1.125rem) / 1.4` | SemiBold (600) | Tiêu đề thẻ Gói học (`ServiceCard`), Tên gia sư |
| **Body Large** | `16px (1.0rem) / 1.5` | Regular (400) / Medium (500) | Mô tả gói học, nội dung phán quyết tranh chấp của Admin |
| **Body Regular** | `14px (0.875rem) / 1.5` | Regular (400) | Văn bản tin nhắn chat, bảng dữ liệu, form input, review comment |
| **Caption / Small** | `12px (0.75rem) / 1.4` | Medium (500) | Tag môn học, trạng thái thanh toán, thời gian tương đối ("2 giờ trước") |
| **Monospace Numbers** | `14px (0.875rem) / 1.4` | SemiBold (600) | Định dạng tiền VND: `2.000.000 ₫`, Countdown: `14:58`, Gateway: `THB260907...` |

---

### 2.3. Elevation, Spacing & Glassmorphism Tokens

#### Spacing Scale (Hệ Số 4px)
- `space-1`: `4px` | `space-2`: `8px` | `space-3`: `12px` | `space-4`: `16px`
- `space-5`: `20px` | `space-6`: `24px` | `space-8`: `32px` | `space-12`: `48px`

#### Border Radii (Bo Góc Mượt Mà)
- `radius-sm`: `6px` (Badge trạng thái, tag môn học)
- `radius-md`: `10px` (Form controls, Buttons, Input fields)
- `radius-lg`: `16px` (Cards, Chat bubbles, Modal window)
- `radius-xl`: `24px` (Container chính, Dashboard panels)
- `radius-full`: `9999px` (Pill badges, User avatars)

#### Glassmorphism Formula (Công Thức Thủy Tinh Cao Cấp)
```css
/* Glass Card Surface */
.glass-surface {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
}

/* Glass Dark Surface */
.glass-surface-dark {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(30, 41, 59, 0.85);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 3. Signature UI Components (Các Thành Phần Giao Diện Đặc Trưng Cốt Lõi)

Dưới đây là đặc tả chi tiết các thành phần giao diện mang bản sắc riêng biệt của TutorHub, được neo trực tiếp vào logic nghiệp vụ và dữ liệu mẫu từ `seedData.sql`:

### 3.1. Thành Phần 1: Holding Countdown Timer (Bộ Đếm Ngược Giữ Chỗ 15 Phút)

Đồng hồ đếm ngược được kích hoạt ngay khi Student bấm đặt chỗ gói học. Thành phần này quyết định tính khẩn cấp của giao dịch và bảo vệ chỗ ngồi học tập:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⏳ ĐANG GIỮ CHỖ THANH TOÁN (15 PHÚT)                       [ 13:42 ] Còn lại│
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱  (82% thời gian giữ chỗ còn lại)   │
│ Vui lòng hoàn tất thanh toán VNPay trước khi hết hạn để xác nhận hợp đồng.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3 Trạng Thái Hiển Thị (Urgency States):
1. **Trạng thái Calm (Thời gian còn > 5 phút):**
   - Nền: `bg-amber-50`, Viền: `border-amber-200`, Chữ: `text-amber-900`.
   - Timer hiển thị font monospace ổn định.
2. **Trạng thái Caution (Thời gian từ 2 - 5 phút):**
   - Nền: `bg-amber-100`, Viền: `border-amber-300`, Thanh tiến trình chuyển sang màu cam đậm.
3. **Trạng thái Emergency (Thời gian < 2 phút):**
   - Nền: `bg-rose-50`, Viền: `border-rose-300`, Chữ: `text-rose-700`.
   - Con số nhấp nháy nhẹ (`pulse animation`).
4. **Trạng thái Expired (Thời gian = 00:00):**
   - Khóa nút "Thanh toán VNPay" (`disabled`).
   - Hiển thị thông báo: *"Đơn đặt chỗ đã hết hạn giữ vé 15 phút. Vui lòng tạo lại đơn hàng mới."* Kèm nút "Tạo lại đơn hàng".

---

### 3.2. Thành Phần 2: Dual Attendance Verification Card (Thẻ Điểm Danh Đối Soát 2 Chiều 24h)

Mỗi buổi học sau khi kết thúc (`EndAt <= Now`) sẽ mở cửa sổ điểm danh 24h. Giao diện thể hiện tính đối kháng và đồng thuận 2 chiều:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ BUỔI 3: TOÁN THPT (10/10/2026 18:00 - 19:00)          Hạn điểm danh: 16h 20m│
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 👤 HỌC VIÊN: Phạm Minh Tuấn          │ 👨‍🏫 GIA SƯ: Nguyễn Văn An             │
│ Trạng thái: [ ĐÃ XÁC NHẬN ]          │ Trạng thái: [ ĐÃ XÁC NHẬN ]          │
│ Lựa chọn: ✅ ĐÃ THAM GIA (Attended)  │ Lựa chọn: ❌ VẮNG MẶT (Absent)       │
│ Gửi lúc: 19:10 (10/10/2026)          │ Gửi lúc: 19:15 (10/10/2026)          │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ ⚠️ BẤT ĐỒNG ĐIỂM DANH (ATTENDANCE CONFLICT DETECTED)                        │
│ Phát hiện bất đồng giữa 2 bên. Tiền buổi học (200.000 ₫) tiếp tục bị khóa.  │
│ [ MỞ ĐƠN KHIẾU NẠI TRANH CHẤP ]                [ LIÊN HỆ HỖ TRỢ SÀN ]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Các Biến Thể Giao Diện (States):
- **Cả hai bên cùng chọn `Attended`:** Huy hiệu xanh ngọc `Đồng Thuận Hoàn Thành`. Nút chúc mừng kèm thông báo: *"Đã giải ngân 180.000 ₫ vào ví gia sư (sau khi trừ 10% phí sàn)."*
- **Một bên chưa bấm điểm danh:** Cột của bên đó hiển thị 2 nút bấm tương tác lớn:
  - Nút Xanh: `[ ✅ Tôi Đã Tham Gia Học ]` (`outcome: Attended`)
  - Nút Trắng/Viền Đỏ: `[ ❌ Vắng Mặt / Không Học ]` (`outcome: Absent`)
- **Bất đồng điểm danh (`HasAttendanceConflict == true`):** Khối cảnh báo đỏ với nút dẫn trực tiếp sang luồng khiếu nại tranh chấp (`/student/disputes/new`).

---

### 3.3. Thành Phần 3: 4-Card Escrow Wallet Metrics (Bộ 4 Thẻ Tài Chính Ví Gia Sư)

Giao diện tài chính độc quyền của TutorHub thể hiện bản chất bảo chứng:

```text
┌───────────────────────────┐ ┌───────────────────────────┐
│ ⏳ TIỀN CHỜ GIẢI NGÂN     │ │ 💰 SỐ DƯ KHẢ DỤNG         │
│    (Pending Balance)      │ │    (Available Balance)    │
│       3.600.000 ₫         │ │          900.000 ₫        │
│ Tạm giữ an toàn trong     │ │ Tiền từ các buổi học đã   │
│ Escrow các hợp đồng đang  │ │ hoàn thành, đã trừ phí sàn│
│ theo học                  │ │ [ Xem chi tiết sao kê ]   │
└───────────────────────────┘ └───────────────────────────┘
┌───────────────────────────┐ ┌───────────────────────────┐
│ 🔒 TIỀN PHONG TỎA TRANH   │ │ 💳 HẠN MỨC ĐƯỢC PHÉP RÚT  │
│    CHẤP (Held Balance)    │ │   (Withdrawable Balance)  │
│         200.000 ₫         │ │          700.000 ₫        │
│ Bị khóa do buổi học #3    │ │ = Available - Held        │
│ đang có khiếu nại mở      │ │ [ NÚT: YÊU CẦU RÚT TIỀN ] │
└───────────────────────────┘ └───────────────────────────┘
```

#### Quy Tắc Nghiệp Vụ Hiển Thị (Invariants):
- Con số `WithdrawableBalance` được làm nổi bật với kích thước lớn nhất (`28px`, Bold, màu Emerald).
- Nút "Yêu cầu rút tiền" tự động bị vô hiệu hóa (`disabled`) nếu `WithdrawableBalance < 50.000 ₫` (ngưỡng rút tối thiểu quy định trong `PlatformSettings`).
- Thẻ `HeldBalance` có viền đỏ nhấp nháy khi có vụ tranh chấp mới mở để cảnh báo gia sư.

---

### 3.4. Thành Phần 4: Service Package Card (Thẻ Gói Học Tiêu Chuẩn)

Thẻ hiển thị gói học với đầy đủ tham số thương mại snapshot:

```text
┌─────────────────────────────────────────────────────────────┐
│ TOÁN HỌC THPT                           [ DẠY CẢ 2 HÌNH THỨC]│
│ Luyện thi THPT Toán 10 buổi                                 │
│ Gói luyện thi THPT môn Toán: 10 buổi x 60 phút, kèm tài liệu │
│ và bài tập về nhà trắc nghiệm chuẩn cấu trúc Bộ GD&ĐT.     │
├─────────────────────────────────────────────────────────────┤
│ 📅 10 Buổi học        ⏱️ 60 Phút/buổi        🎥 Học thử Trial│
├─────────────────────────────────────────────────────────────┤
│ 2.000.000 ₫  Trọn gói                 (200.000 ₫ / buổi học)│
│ [ ĐẶT MUA GÓI NÀY (GIỮ CHỖ 15P) ]     [ 💬 THƯƠNG LƯỢNG ]   │
└─────────────────────────────────────────────────────────────┘
```

- Nút chính: **"Đặt Mua Gói Này (Giữ chỗ 15p)"** (Màu Indigo-600, full width hoặc nổi bật).
- Nút phụ: **"Thương lượng riêng"** (Viền mảnh, mở chat để gia sư tạo `CustomAgreement`).
- Nếu gói học có `TrialLessonUrl`: Hiển thị icon Play kèm nhãn "Xem bài giảng mẫu".

---

### 3.5. Thành Phần 5: Session Breakdown Timeline (Danh Sách Buổi Học Con của Hợp Đồng)

Thành phần trọng tâm trong trang chi tiết hợp đồng học tập (`/student/enrollments/:id`):

```text
TIẾN ĐỘ KHÓA HỌC: [ ▰▰▱▱▱▱▱▱▱▱ ] 2 / 10 Buổi Hoàn Thành (20%)
───────────────────────────────────────────────────────────────
● BUỔI 1: 200.000 ₫  [ HOÀN THÀNH ✅ ]  (Đã giải ngân: 180.000 ₫)
  Thời gian: 01/10/2026 18:00 - 19:00
  Ghi chú: "Ôn tập Hàm số đơn điệu. Học viên làm tốt 15 bài trắc nghiệm."
  [ Xem Nhật Ký Học Tập ]

● BUỔI 2: 200.000 ₫  [ ĐÃ CÓ LỊCH 📅 ]
  Thời gian: Ngày mai 18:00 - 19:00 (Thứ 4)
  [ Vào Lớp Google Meet ]       [ Đề Xuất Đổi Lịch ]

● BUỔI 3: 200.000 ₫  [ TRANH CHẤP ⚠️ ]
  Bất đồng điểm danh: Gia sư báo vắng mặt, Học viên báo có mặt.
  [ Theo Dõi Khiếu Nại ]

○ BUỔI 4..10: 200.000 ₫ / buổi  [ CHƯA XẾP LỊCH ⏳ ]
  [ Xếp Lịch Ngay Từ Khung Giờ Rảnh Của Gia Sư ]
```

---

### 3.6. Thành Phần 6: Custom Agreement Card trong Chat Stream

Được nhúng trực tiếp vào luồng tin nhắn SignalR khi gia sư gửi thỏa thuận tùy chỉnh:

```text
┌─────────────────────────────────────────────────────────────┐
│ 📜 ĐỀ XUẤT HỢP ĐỒNG HỌC TẬP TÙY CHỈNH                       │
│ Tiêu đề: Toán THPT custom 5 buổi tối                        │
│ Mô tả: Học viên Tuấn muốn rút còn 5 buổi tối, giữ nguyên    │
│ giáo trình trọng tâm 9+.                                    │
│                                                             │
│ Số buổi: 5 buổi x 60 phút                Hình thức: Online  │
│ Học phí trọn gói: 1.000.000 ₫            Hạn ưu đãi: 48 giờ │
├─────────────────────────────────────────────────────────────┤
│ [ CHẤP NHẬN & THANH TOÁN NGAY ]          [ TỪ CHỐI ĐỀ XUẤT ]│
└─────────────────────────────────────────────────────────────┘
```

- Bấm **"Chấp nhận & Thanh toán ngay"**: Tự động gọi API `accept` $\rightarrow$ sinh booking $\rightarrow$ chuyển thẳng đến màn hình giữ chỗ 15 phút.

---

### 3.7. Thành Phần 7: Admin Dispute Fee Balancing Calculator (Bộ Tính Toán Phân Xử Phí Sàn)

Dành riêng cho màn hình Trọng tài Admin (`/admin/disputes/:id`), khóa cứng công thức bất biến:

```text
THÔNG TIN BUỔI HỌC TRANH CHẤP:
• Học phí buổi học: 200.000 ₫ | Phí sàn (10%): 20.000 ₫ | Gia sư thực nhận: 180.000 ₫
─────────────────────────────────────────────────────────────
BỘ TÍNH TOÁN CÂN ĐỐI PHÍ SÀN (DEC-S8-025 FORMULA):
Số tiền hoàn cho học viên (Student Refund):
[ 200.000           ] ₫  (Thanh trượt: 0 ₫ ────────● 200.000 ₫)

KẾT QUẢ PHÂN BỔ TỰ ĐỘNG:
┌────────────────────────────────┬────────────────────────────┐
│ Thu hồi từ ví Gia Sư:          │ Hoàn trả phí sàn:          │
│ 180.000 ₫                      │ 20.000 ₫                   │
│ (Tối đa = số tiền thực nhận)   │ (Tỷ lệ hoàn phí tương ứng) │
└────────────────────────────────┴────────────────────────────┘
Kiểm tra cân đối: 180.000 ₫ + 20.000 ₫ ≡ 200.000 ₫ (HỢP LỆ VỀ MẶT TÀI CHÍNH ✅)

[ PHÊ DUYỆT PHÁN QUYẾT NÀY ]                [ BÁC BỎ KHIẾU NẠI ]
```

---

## 4. Layout Architecture & Screen Grid Blueprints

### 4.1. Hệ Thống Lưới (Responsive Breakpoints)
- **Mobile (`< 640px`):** 1 Cột, Bottom Navigation Bar cho Student/Tutor, Sticky Action Bar cho nút Checkout / Điểm danh.
- **Tablet (`640px - 1024px`):** 2 Cột linh hoạt, Sidebar thu gọn thành Icon bar.
- **Desktop (`> 1024px`):** Bố cục 12 cột chuẩn, Sidebar cố định rộng `260px`, Main Content chiếm `calc(100% - 260px)`.
- **Max Width Container:** `1280px` (tránh giao diện bị dàn trải quá rộng trên màn hình 2K/4K).

### 4.2. Bố Cục Trang Dashboard Mẫu (Wireframe Architecture)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo TutorHub]   [Tìm gia sư...]        🔔 (3)  [Avatar] Nguyễn Văn An (Tutor)│
├──────────────┬──────────────────────────────────────────────────────────────┤
│ 📊 Tổng quan │  LỚP HỌC HÔM NAY (1 Buổi cần điểm danh)                      │
│ 📚 Gói học   │  ┌─────────────────────────────────────────────────────────┐ │
│ 📅 Lịch rảnh │  │ Buổi 3: Toán THPT (18:00 - 19:00) — Học viên: Tuấn      │ │
│ 👥 Học viên  │  │ [ ĐIỂM DANH NGAY (Còn 18h) ]     [ Ghi nhật ký buổi học ]│ │
│ 💳 Ví tiền   │  └─────────────────────────────────────────────────────────┘ │
│ 💬 Tin nhắn  │                                                              │
│              │  TRUNG TÂM TÀI CHÍNH & VÍ BẢO CHỨNG                          │
│              │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐ │
│              │  │ Chờ giải ngân│ │ Khả dụng     │ │ Bị phong tỏa │ │ Rút  │ │
│              │  │ 3.600.000 ₫  │ │ 900.000 ₫    │ │ 200.000 ₫    │ │ 700k │ │
│              │  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘ │
│              │                                                              │
│              │  BIẾN ĐỘNG SAO KÊ GẦN NHẤT                                   │
│              │  • +180.000 ₫ — Giải ngân buổi học Toán #1 (14 ngày trước)   │
│              │  • -500.000 ₫ — Rút tiền về VCB - 0011001234567 (Thành công) │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 5. Micro-Interactions, Feedback & Animation Standards

1. **Payment Pulse Animation:**
   - Khi đơn hàng ở trạng thái `Holding`, đồng hồ đếm ngược có viền sáng nhẹ lan tỏa (`box-shadow pulse`).
2. **Attendance Conflict Shake:**
   - Nếu phát hiện `HasAttendanceConflict == true`, thẻ điểm danh có hiệu ứng rung nhẹ (shake animation 0.3s) thu hút sự chú ý tức thì của người dùng.
3. **SignalR Live Message Pop:**
   - Khi có tin nhắn hoặc thông báo mới từ WebSocket, tin nhắn trượt nhẹ từ dưới lên kèm âm thanh nhẹ (subtle notification chime có thể bật/tắt).
4. **Loading States (Skeleton Screens):**
   - Tuyệt đối không dùng spinner toàn trang gây giật cục giao diện.
   - Sử dụng **Skeleton Loaders** mô phỏng chính xác khung `TutorCard`, `WalletMetricCard`, và dòng `TransactionRow` trong khi chờ API phản hồi.
5. **Deterministic Pagination Transition:**
   - Khi chuyển trang trên `PagedResult<T>`, danh sách chuyển đổi mượt mà (`opacity fade 0.15s`), cuộn nhẹ về đầu bảng dữ liệu.

---

## 6. Design System Implementation Checklist for Frontend Engineers

Trước khi viết bất kỳ component nào, kỹ sư Frontend cần đối soát danh mục checklist này:
- [ ] Đã kế thừa chính xác tên enum viết hoa chữ cái đầu (`Attended`, `Absent`, `Holding`, `Paid`, `Cancelled`, `Completed`).
- [ ] Không có giá trị placeholder nào bị phát minh ngoài danh sách 10 Danh mục, 15 Môn học, và dữ liệu người dùng thật trong `seedData.sql`.
- [ ] Bắt buộc hiển thị đúng 4 chỉ số tài chính của ví gia sư (`PendingBalance`, `AvailableBalance`, `HeldBalance`, `WithdrawableBalance`).
- [ ] Toàn bộ hiển thị tiền tệ dùng chuẩn VND có phân cách dấu chấm: `2.000.000 ₫`.
- [ ] Toàn bộ ngày giờ hiển thị trên client đã convert từ UTC sang múi giờ `Asia/Ho_Chi_Minh` (UTC+7).
- [ ] Đồng hồ đếm ngược giữ chỗ 15 phút khóa cứng nút thanh toán khi chạm mốc 00:00.
- [ ] Thẻ đối soát điểm danh có đủ 2 cột song song Student vs Tutor.
- [ ] Modal phân xử tranh chấp của Admin tuân thủ công thức $\text{StudentRefund} \equiv \text{TutorNetRecovery} + \text{PlatformFeeReversal}$.

---
*Tài liệu `DESIGN.md` này là tiêu chuẩn thiết kế đồ họa và hệ thống thành phần giao diện chính thức của dự án TutorHub.*
