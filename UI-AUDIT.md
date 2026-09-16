# UI Audit Report — TutorHub Frontend

**Phạm vi:** `src/frontend/` — 23 pages, 4 layouts, 11 components, 12 service modules
**Đối chiếu:** `DESIGN.md` (§2 tokens, §3 signature components, §4.1 responsive, §5 motion/loading, §6 checklist) + `CLAUDE.md` invariants
**Phương pháp:** build thật + đọc code + grep xác minh chéo. Các kết luận P0/P1 dưới đây đã được **tự xác minh trực tiếp**, không chỉ dựa vào báo cáo phụ.

---

## 1. Kết luận nhanh

| Hạng mục | Kết quả |
| :--- | :--- |
| **Build production** | ✅ Pass — `vite build`, 3157 modules, 9.14s, 0 lỗi, code-split hợp lý |
| **Nối API thật** | ❌ 19/23 pages không import service nào — là static mock |
| **Design system (DESIGN.md)** | ⚠️ 8/9 signature component là **dead code**; §3.1 và §4.1 chưa implement |
| **Accessibility** | ❌ Gần như bằng 0 (0 `aria-label`, 0 `htmlFor`, 0 `role`/`tabIndex` trong toàn bộ `pages/`) |
| **Loading/empty/error state** | ❌ 0 `Skeleton`, 0 `Spin`, 0 empty state, 0 error state |
| **Định dạng tiền** | ✅ `formatCurrency` đúng chuẩn `2.000.000 ₫` |

**Nhận định tổng:** đây là một **prototype tĩnh chất lượng cao**, không phải một app đã nối backend. Nhìn thì đẹp và bám spec khá sát về mặt hình thức, nhưng phần lớn màn hình render dữ liệu hardcode, và một số màn hình **khẳng định sai sự thật về dòng tiền** — đây là rủi ro nghiêm trọng nhất, cao hơn hẳn mọi vấn đề thẩm mỹ.

---

## 2. Những gì đang tốt (đã xác minh)

- ✅ **`formatCurrency` chuẩn** — `Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'})`, có guard null/NaN. Lưu ý nhỏ: trả về `U+00A0` (NBSP) trước `₫`, không khớp tuyệt đối chuỗi literal `"2.000.000 ₫"` trong test.
- ✅ **Build sạch, chunking hợp lý** — `vendor-antd` tách riêng (490 kB → 160 kB gzip), không có circular/compile error.
- ✅ **Font thật, không fake** — Plus Jakarta Sans / Inter / JetBrains Mono load qua `index.html:18`; token `font-monospace-num` tồn tại thật và **có được dùng** cho tiền/mã/countdown.
- ✅ **Container 1280px đúng** (`max-w-7xl`) ở navbar và cả 3 shell.
- ✅ **§3.3 đủ 4 thẻ ví** với nhãn đúng (`TutorWallet.jsx:44,56,68,80`) và **công thức DEC-WD-001 hiển thị minh bạch cho user**: 900.000 − 200.000 = 700.000.
- ✅ **§3.7 hiển thị đủ bất biến** `StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal` (`AdminDisputeDetail.jsx:141-143`), clawback bị chặn trần đúng bằng tiền gia sư thực nhận.
- ✅ **§3.2 có 2 cột song song** Học Viên / Gia Sư, và block conflict trỏ đúng route `/student/disputes/new`.
- ✅ **Không hardcode hex** trong các page — màu đi qua token/Tailwind palette.
- ✅ **`PaymentReturn` không mutate state** — tuân thủ luật VNPay Return URL read-only (lỗi của nó thuần hiển thị).
- ✅ **Không có full-page spinner** và **không lộ raw JSON/stack trace** cho user.
- ✅ **Không vỡ layout ở 360px** ở hầu hết màn hình (grid dùng `grid-cols-1` + `sm:`/`lg:`).

---

## 3. P0 — Sai sự thật về dòng tiền (phải sửa trước mọi thứ khác)

> Đây là nhóm nghiêm trọng nhất: người dùng được báo là đã trả tiền / tiền đã được giải ngân **khi điều đó không xảy ra**.

### P0-1. Checkout gọi một method không tồn tại → luôn rơi vào nhánh giả lập thành công
`src/pages/checkout/BookingCheckout.jsx:54` gọi `paymentService.createPaymentUrl(...)`, nhưng `src/services/payment.service.js:7` chỉ export `createVnPayUrl(bookingId)`.
→ `TypeError: createPaymentUrl is not a function` → rơi vào `catch` → điều hướng sang trang "thành công".
**Sửa:** gọi `createVnPayUrl(currentBookingId)`, hiển thị lỗi thật inline + nút thử lại.

### P0-2. Tự chế giao dịch VNPay thành công khi thất bại
`BookingCheckout.jsx:63,66` — cả nhánh "không có paymentUrl" lẫn `catch` đều:
```js
navigate(`/payment/return?vnp_Amount=${orderData.totalAmount * 100}&vnp_ResponseCode=00&vnp_TxnRef=${currentBookingId}&vnp_TransactionNo=14892019`)
```
`vnp_ResponseCode=00` và `vnp_TransactionNo` được **sinh ở client**. Vi phạm trực tiếp CLAUDE.md (mutation tài chính chỉ được nằm trong IPN).
**Sửa:** tuyệt đối không tự sinh `vnp_ResponseCode`/`vnp_TransactionNo`; propagate lỗi thật.

### P0-3. Trang kết quả thanh toán mặc định là "thành công"
`src/pages/checkout/PaymentReturn.jsx:9,13,38-47`:
```js
const vnp_ResponseCode = searchParams.get('vnp_ResponseCode') || '00';  // mặc định THÀNH CÔNG
const amount = rawAmount ? parseInt(rawAmount) / 100 : 2000000;          // mặc định 2.000.000 ₫
```
Icon `check_circle` xanh + tiêu đề `Thanh Toán Ký Quỹ Thành Công!` nằm **ngoài mọi nhánh điều kiện**; `isSuccess` chỉ dùng để chạy countdown 5s.
→ Mở `/payment/return` **không có param nào** vẫn ra biên lai "đã trả 2.000.000 ₫".
**Sửa:** branch icon/tiêu đề/biên lai theo trạng thái xác nhận từ backend; không có param ⇒ trạng thái "không tìm thấy giao dịch", tuyệt đối không ra biên lai.

### P0-4. `AttendanceCard` tự bịa điểm danh của gia sư → 1 cú click giải ngân escrow
`src/components/feedback/AttendanceCard.jsx:29-43`:
```js
setStudentChoice(outcome === 'Attended');
// Mô phỏng gia sư cũng đã điểm danh để tạo kịch bản đối soát
if (tutorChoice === null) { setTutorChoice(true); }
```
Với `hasConsensus = studentChoice === true && tutorChoice === true` (`:25-27`), học viên click "Tôi Đã Tham Gia" là **tự thoả mãn consensus**, card lập tức hiển thị "đã giải ngân vào ví khả dụng của gia sư" (`:151-159`).
→ Phá vỡ bất biến **đối soát điểm danh 2 chiều**. Cùng user đó bấm nút còn lại thì card lật sang conflict đỏ — tức user tự bật/tắt việc giải ngân tiền.
**Sửa:** `tutorChoice` chỉ được seed từ `session.tutorAttended`; không bao giờ mutate cột của đối phương từ action của học viên.

### P0-5. 19/23 màn hình là mock tĩnh; toàn bộ khu Admin là no-op báo thành công
Chỉ **4 file page** import service: `BookingCheckout`, `DisputeNew`, `Marketplace`, `TutorProfile`.
→ `admin.service.js` **không được import ở đâu cả** (dead 100%), `tutor.service.js`, `wallet.service.js`, `session.service.js`, `enrollment.service.js`, `chat.service.js`, `notification.service.js`, `auth.service.js` đều không có consumer trong `pages/`.

`src/pages/admin/AdminDisputeDetail.jsx:25-36`:
```js
setTimeout(() => { message.success('Đã phê duyệt hoàn tiền ... Tiền đã giải phóng khỏi Escrow.') }, 800);
```
Không có service call nào → admin bấm "Phê Duyệt Hoàn Tiền" được báo là **tiền đã ra khỏi Escrow** trong khi không có gì xảy ra. Tương tự `AdminTutorApplications.jsx:32-34`.
**Sửa:** nối handler vào `adminService`; chỉ toast trong `.then()` đã resolve. Không được khẳng định mutation escrow khi chưa có response xác nhận.

### P0-6. `DisputeNew` báo lỗi thành công
`src/pages/student/DisputeNew.jsx:39-41`:
```js
} catch (err) {
  message.info('Đơn khiếu nại đã được chuyển đến Bàn Trọng Tài.');
  navigate('/student/dashboard');
}
```
`err` bị nuốt; dòng 37 còn khẳng định "Tiền học buổi này đã được phong tỏa trong Escrow".
**Sửa:** surface lỗi thật, giữ nguyên form, chỉ khẳng định phong tỏa sau 2xx xác nhận.

### P0-7. Badge trạng thái user bị đảo — mọi user hiển thị như đang bị khoá
`src/pages/admin/AdminUsers.jsx:104` so sánh `u.status === 'Active'`, nhưng `admin.service.js:112,121,130` trả `'ACTIVE'`, `'SUSPENDED_7D'` (UPPERCASE).
→ Điều kiện **luôn false** ⇒ **mọi** dòng user render style rose "suspended", kể cả mock data hiện tại.
**Sửa:** map enum → label + màu qua một bảng chung (`ACTIVE→Hoạt động`, `SUSPENDED_7D→Tạm khóa 7 ngày`), không branch trên display string.

### P0-8. Nút điểm danh không được gắn handler
`src/pages/student/SessionDetail.jsx:15` định nghĩa `handleConfirmAttendance` nhưng **không có `onClick` nào trong file**.
→ `StudentDashboard.jsx:134-140` điều hướng user tới đây bằng "Xác Nhận Điểm Danh Ngay", nhưng màn hình không có cách nào xác nhận. `studentChoice`/`tutorChoice` là state không bao giờ được đọc; `hasConflict` không bao giờ được cập nhật.

---

## 4. P1 — Vi phạm DESIGN.md

### P1-1. 8/9 "signature component" là dead code
Grep xác minh: chỉ `EscrowVaultSimulator` được import (bởi `Marketplace.jsx:4`). **Không nơi nào import** `ServiceCard`, `TutorCard`, `ReviewsList`, `AvailabilityMatrix`, `CountdownTimer`, `AttendanceCard`, `ProRataRefundModal`, `VnPayCardInfo`.
→ §3.1, §3.2, §3.4, §3.6 của spec **không tồn tại trên màn hình**. `TutorProfile.jsx:246-368` và `EnrollmentDetail.jsx` tự viết lại markup inline.
**Sửa:** hoặc nối các component này vào `TutorProfile`/`EnrollmentDetail`/`BookingCheckout`, hoặc xoá và đưa spec vào inline. Hiện tại là code chết gây ngộ nhận "đã có tính năng".

### P1-2. Hợp đồng §3.1 (countdown 15 phút) không được implement
- `BookingCheckout.jsx:12` — `useState(822) // ~13m 42s` **hardcode**, không seed từ `holdExpiresAt` của booking, không re-sync (tab bị throttle ⇒ lệch tuỳ ý so với server).
- `:18-26` — side effect (`message.warning`, `navigate`) chạy **bên trong state updater** ⇒ impure, fire 2 lần dưới StrictMode.
- `:37` — `Math.round((timeLeft / 900) * 100)` hardcode mốc 15 phút.
- `:21-22` — hết giờ thì **điều hướng đi chỗ khác**; không render `00:00`, không lock CTA (`disabled={loading}` là gate duy nhất), không có nút "Tạo lại đơn hàng", và **không có câu chữ bắt buộc** của spec: *"Đơn đặt chỗ đã hết hạn giữ vé 15 phút. Vui lòng tạo lại đơn hàng mới."*
- `:75` — chỉ có **1 treatment cố định** cho cả 15 phút; thiếu Caution (`bg-amber-100`/`border-amber-300`, 2–5 phút) và Emergency (`bg-rose-50`/`text-rose-700` + pulse, <2 phút). `CountdownTimer.jsx:35` (dead code) còn dùng sai palette: Calm đang là `bg-emerald-50` thay vì `bg-amber-50`.

**Sửa:** derive `deadline` từ `holdExpiresAt`, tính remaining từ `Date.now()`, re-sync qua `visibilitychange`, `disabled={loading || expired}`, render đúng câu chữ + nút tạo lại.

### P1-3. §4.1 — shell responsive không được implement
Không tồn tại **sidebar 260px** và **icon rail tablet** ở bất kỳ layout nào. Cả 3 shell là top-bar + `max-w-7xl`.
Các band thực tế: `<640` dock + hamburger (đúng) / `640–767` vẫn dock (spec: rail) / `768–1023` nav full-label (`UnifiedNavbar.jsx:172` `hidden md:flex`) / `≥1024` top nav, **không sidebar**.

**Admin không có navigation nào dưới 1024px** — `AdminLayout.jsx:48` `<nav className="hidden lg:flex">`, không hamburger, dropdown Avatar chỉ có logout, và `MobileFloatingDock.jsx:133` không có nhánh Admin (`return null`). Trên điện thoại/tablet admin **không thể** tới `/admin/tutor-applications`, `/admin/users`, `/admin/audit-logs`.
`PublicLayout.jsx:12` không có container ⇒ `/app/messages`, `/app/notifications` full-bleed trên màn 2K/4K — đúng thứ §4.1:313 cấm.

**Sửa:** thêm `hidden lg:flex w-[260px]` sidebar + `hidden md:flex lg:hidden` rail, dock → `sm:hidden`, đưa container vào layout.

### P1-4. Dock che nội dung
`StudentLayout.jsx:12`, `TutorLayout.jsx:12`, `PublicLayout.jsx` — dock `fixed bottom-4` cao ~72px nhưng `<main>`/footer không có bottom padding (`p-4 sm:p-6 lg:p-8`). Dòng cuối mỗi trang và footer (`© 2026 TutorHub Platform…`) **nằm vĩnh viễn sau dock**.
**Sửa:** `pb-24` hoặc `pb-[calc(6rem+env(safe-area-inset-bottom))]`.

### P1-5. Không có skeleton / empty / error state ở đâu cả
Grep toàn repo: **0 `Skeleton`, 0 `Spin`, 0 `prefers-reduced-motion`**. §5.4 yêu cầu skeleton thay vì spinner toàn trang.
- `TutorProfile.jsx:128` `if (!tutor) return null;` ⇒ **trang trắng** trong lúc fetch.
- `Marketplace.jsx:93-99` — cả lỗi API **lẫn** kết quả rỗng hợp lệ đều bị thay bằng mock; `catch` cũng fallback mock ⇒ không bao giờ hiển thị "Không tìm thấy gia sư", và sự cố backend không phân biệt được với thành công.
- `AdminUsers.jsx:58` quảng cáo `Tổng Người Dùng 1.248` nhưng render 4 dòng hardcode, không pager.
- `admin.service.js:159,182,216,239` — `catch { return MOCK_USERS; }` ⇒ API chết vẫn render dữ liệu giả như thật.

**Sửa:** skeleton theo shape (`TutorCard`, `WalletMetricCard`, `TransactionRow`), empty state có hành động, error state + retry, bỏ fallback mock im lặng ở các luồng tài chính.

### P1-6. Luật timezone không được thực thi
`utils/formatters.js:22-25` — `dayjs(date).format(format)` **không** dùng plugin `utc`/`timezone` (grep: plugin không được import ở đâu), dù docstring ghi "Vietnam timezone (UTC+7)". Hàm này còn **không có call site nào** — mọi màn hình hardcode chuỗi ngày (`StudentDashboard.jsx:17`, `SessionDetail.jsx:33`, `AdminAuditLogs.jsx:9`).
`admin.service.js:228` — `new Date(l.createdAt).toLocaleString('vi-VN')` dùng timezone **trình duyệt**, không phải UTC+7.
**Sửa:** `dayjs.extend(utc); dayjs.extend(timezone); dayjs.utc(date).tz('Asia/Ho_Chi_Minh').format(...)`; truyền ISO thật vào UI.

### P1-7. `prefers-reduced-motion` bị bỏ qua hoàn toàn
`CountdownTimer.jsx:44`, `EscrowVaultSimulator.jsx:48,105`, `TutorProfile.jsx:365`, `AdminLayout.jsx:72`, cùng `hover:-translate-y-1`/`hover:scale-105`. Không có `@media (prefers-reduced-motion: reduce)` ở đâu.
§5.2 (shake animation khi conflict) **chưa được implement**: không có keyframe `shake`, `tailwind.config.js:120-125` chỉ có `pulse-slow` và `float`.
**Sửa:** block reduced-motion toàn cục trong `index.css`; thêm `shake` 0.3s có gate reduced-motion.

### P1-8. §3.3 và §3.7 còn thiếu điều kiện
- Ngưỡng rút tối thiểu **50.000 ₫ không được gate ở đâu** (grep `50000`: 0 hit). `TutorWallet.jsx:30-36` CTA rút tiền là `<Link>` vô điều kiện; `TutorWithdraw.jsx` chỉ `disabled={loading}`, ngưỡng là toast sau khi submit. `withdrawableLimit = 700000` bị hardcode **hai nơi độc lập** (`TutorWithdraw.jsx:7`, `TutorWallet.jsx:10`) ⇒ sẽ drift khỏi DEC-WD-001.
- `TutorWallet.jsx:83` — `WithdrawableBalance` render `text-2xl` (24px), spec §3.3 yêu cầu **28px, số lớn nhất trang**; token `headline-1: 28px` đã định nghĩa mà không dùng.
- `TutorWallet.jsx:66-75` — thẻ Held không có "viền đỏ nhấp nháy", và object wallet không có cờ dispute để condition.
- **DEC-S8-028 vắng mặt hoàn toàn**: `RequiresAdminFinancialIntervention` xuất hiện **0 lần** trong toàn bộ frontend. Calculator cho phép clawback tới 180.000 ₫ mà không kiểm tra `WithdrawableBalance` của gia sư.
- `AdminDisputeDetail.jsx:21-23` — bất biến hiển thị **đúng nhưng tautology**: `platformFeeRefund = refundAmount - tutorClawback` là phần dư, nên không bao giờ mất cân đối; badge "Bất Biến Bảo Toàn ✅" là text tĩnh, không tính toán. `originalSessionFee`/`platformFeeRate` (`:16-17`) hardcode thay vì đọc snapshot Enrollment (DEC-S8-020).

---

## 5. P2 — Accessibility

Grep xác minh trên **toàn bộ cây `.jsx`**: `htmlFor` = **0**, `role="..."` = **0**, `tabIndex` = **0**, `onKeyDown` = **0**, `aria-checked` = **0**, `aria-live` = **0**. Và `aria-label` = **đúng 1** — `UnifiedNavbar.jsx:283`, lại còn là tiếng Anh (`"Toggle navigation"`) trong một UI tiếng Việt.

- **Clickable `div` không keyboard-accessible** (Critical): `AdminTutorApplications.jsx:54` `<div onClick={() => setSelectedApp(a.id)}>`, `Messages.jsx:47` `<div onClick={() => setActiveChat('tut-001')}>`, `BookingCheckout.jsx:171` chọn phương thức thanh toán, `DisputeNew.jsx:77` chọn lý do khiếu nại. User chỉ dùng bàn phím **không thể** chọn lý do tranh chấp hay chọn applicant. → dùng `<button type="button">` hoặc `role="radio"` + `aria-checked` trong `role="radiogroup"`.
- **Dropdown tài khoản không tới được bằng bàn phím**: `UnifiedNavbar.jsx:236`, `AdminLayout.jsx:90` là `<div className="... cursor-pointer">` không `role`/`tabIndex`.
- **Label không gắn input**: 0 `htmlFor` toàn dự án. `AdminDisputeDetail.jsx:104` label "Số tiền hoàn trả học viên (₫)" + `input type="range"` `:112` không `id`/`aria-label` ⇒ screen reader đọc slider **vô danh**, trên chính control quyết định số tiền chi ra. Tương tự `TutorWithdraw.jsx:59-60`, `TutorApplication.jsx:61,70,79,89,98`, `Login.jsx:69,87`, `Register.jsx:106-154`.
- **Icon-only button thiếu accessible name**: `Login.jsx:104-112` nút hiện/ẩn mật khẩu chỉ có ligature `visibility`; `Messages.jsx:164` nút gửi không có cả `aria-label` lẫn `title`; `TutorServices.jsx:115` name đọc ra là `visibility_off`; `VnPayCardInfo.jsx:45` chỉ có `title`.
- **Contrast fail WCAG AA**: `financial-available` = `#10B981` trên nền trắng ≈ **2.56:1**, trên `emerald-50` ≈ **2.43:1** — fail cả ngưỡng 3:1 cho large text. Đang dùng ở `TutorWallet.jsx:83` (số Withdrawable), `TutorDashboard.jsx:37`, `TutorServices.jsx:75`, `TutorWithdraw.jsx:80` (text 10px). → thêm token `financial-available-strong` (~`#047857`) cho **chữ**, giữ `#10B981` cho fill/border.
- **Không có confirm cho hành động không thể hoàn tác**: grep `Modal.confirm|Popconfirm|confirm(` trong `pages/` = **0**. `AdminDisputeDetail.jsx:156-174` bắn "Phê Duyệt Hoàn Tiền {số tiền}" và "Bác Bỏ Khiếu Nại" trực tiếp. Tệ hơn, `:12` **pre-fill sẵn lý do phán quyết** (`'Qua kiểm tra log Google Meet, gia sư không tham gia phòng học...'`) ⇒ admin có thể ghi phán quyết mà không viết một chữ nào. → `Modal.confirm` nêu rõ số tiền + ai bị trừ + tính bất khả hoàn; để `adminNote` rỗng và bắt buộc nhập.
- **Tap target < 44px**: `AdminUsers.jsx:111` "Chi Tiết" (~16px), `EnrollmentDetail.jsx:124-148` (~30px), `TutorAvailability.jsx:89` (~26px), `AdminTutorApplications.jsx:107`.
- **Không có focus-visible toàn cục**; `index.css` không định nghĩa `:focus-visible` nào, các button/link chỉ có hover.

---

## 6. P3 — Token & polish

- **Class chết `outline-hidden`** — dùng ở **16 chỗ** (`Login.jsx:80,102`, `Register.jsx:113-161`, `TutorWithdraw.jsx:67,92`, `AdminDisputeDetail.jsx:152`, `Messages.jsx:162`, `Marketplace.jsx:151,279`…). Đã xác minh: Tailwind cài đặt là **3.4.19**, `outline-hidden` **không tồn tại** trong package (0 match trong `corePlugins.js`) — đây là utility của v4. ⇒ class không emit CSS, ý định tắt outline mặc định **thất bại im lặng** ⇒ double focus indicator. Sửa: `outline-none` (v3) hoặc nâng lên v4.
- **Class chết `.glass-surface`** — dùng ở `ServiceCard.jsx:36`, `TutorCard.jsx:30`, `ReviewsList.jsx:9`, nhưng `index.css` **không định nghĩa** (chỉ có `.glass-panel-premium` / `.glass-panel-dark`) ⇒ hiệu ứng glassmorphism của spec không hề render. Tương tự `animate-fadeIn` (`EscrowVaultSimulator.jsx:208`, `UnifiedNavbar.jsx:294`) không có trong config.
- **Thiếu scale `borderRadius`** — `tailwind.config.js` không có key `borderRadius`, nên scale spec (sm 6 / md 10 / lg 16 / xl 24) không reachable; `rounded-md`=6, `rounded-lg`=8 nên **md 10px không tồn tại**. Hệ quả: cùng cấp hierarchy dùng radius khác nhau — KPI card `rounded-3xl` (`TutorWallet.jsx:42,54,66,78`) vs `rounded-2xl` (`AdminUsers.jsx:56,60,64`); nút `rounded-xl` vs `rounded-2xl`.
- **Type dưới sàn 12px** — `text-[10px]`/`text-[11px]` xuất hiện **40+ lần** dù token nhỏ nhất là `caption: 12px`. Lẫn ad-hoc `text-2xl`/`text-xl` cho tiền thay vì scale `headline-*`.
- **`darkMode: "class"` là config chết** — không nơi nào set class (`main.jsx` không đụng `documentElement`, `index.html:21` là body sáng), và **0 utility `dark:`** trong toàn bộ `.jsx` ⇒ `.glass-panel-dark` không thể kích hoạt.
- **Copy/jargon lộ ra cho user**: `Smart Escrow Protocol`, `Trọng tài DEC-S8`, `Cổng VNPay Sandbox 2.1.0`, `(Ngân hàng NCB test)`, `Escrow Locked`, và `Stitch ID: {screenId.slice(0,8)}` (`PlaceholderScreen.jsx:15`) — đây là ID bàn giao design, không phải nội dung cho người dùng.
- **Placeholder bịa hiển thị như trạng thái thật** (vi phạm §6 "Không có giá trị placeholder nào bị phát minh"): `UnifiedNavbar.jsx:212` mọi student đều thấy `0 Vi Phạm (Uy Tín 100%)`; `AdminLayout.jsx:71-73` hiện `Ledger Synchronized` + `animate-pulse` không có nguồn dữ liệu.
- **`outline-hidden`/diacritics**: `routes/index.jsx:130-132` render `404 — Trang Khong Ton Tai`, `Ve Trang Kham Pha`; `RouteGuards.jsx:27-33` `Khong Du Tham Quyen Truy Cap` — mất dấu, trong khi phần còn lại của app có dấu đầy đủ.
- **Link chết `<a href="#">`**: `Login.jsx:88` "Quên mật khẩu?", 2 link footer `PublicLayout.jsx:35-36`, `Register.jsx:175` "Điều khoản dịch vụ".
- **Favicon sai/404**: `index.html:5` trỏ `/vite.svg`, nhưng **không tồn tại thư mục `public/`** và `dist/` chỉ có `index.html` + `assets` ⇒ favicon 404, tab hiện icon mặc định dù title/meta đã brand TutorHub.
- **`toFixed()` không guard** — `Marketplace.jsx:348`, `TutorProfile.jsx:172`, `TutorCard.jsx:74` gọi `tutor.rating.toFixed(...)`; tutor mới chưa có đánh giá (`rating: null`) ⇒ **crash render**.
- **`EscrowVaultSimulator.jsx:77`** render `0 đ` (chữ `đ`) thay vì `₫`, và hardcode tiền ở `:147,231,250` trong khi biến đúng (`sessionAmount`, `platformFeeRate` ở `:9-10`) được khai báo rồi **không dùng**.
- **Sai lệch làm tròn tiền**: `ServiceCard.jsx:33` / `ProRataRefundModal.jsx:27` tính `Math.round(price / totalSessions)`; với gói 3.500.000 / 15 buổi ⇒ 233.333, nhân lại × 15 = **3.499.995 ₫** (lệch 5 ₫ so với snapshot). → chia từ snapshot per-session đã lưu, không re-round.
- **`ProRataRefundModal.jsx:97`** khẳng định "Tiền được cộng tức thì vào số dư ví" — **mâu thuẫn INV-REFUND-004** (`StudentRefund` phải `Pending` → `Succeeded` chỉ sau khi cổng xác nhận).
- **`SessionDetail.jsx`/`EnrollmentDetail.jsx`** — enum casing sai: `'COMPLETED'`, `'PENDING_VERIFICATION'`, `'SCHEDULED'`, `'UNSCHEDULED'` thay vì PascalCase (`Completed`/`Scheduled`/`Unscheduled`) ⇒ switch rơi vào default "Chưa Xếp Lịch". ($3.5 timeline thiếu progress bar, thiếu "Đã giải ngân: 180.000 ₫" từng buổi, thiếu nhánh dispute, và nút ghi `Vào Học` thay vì `Vào Lớp Google Meet`.)
- **Đếm số liệu tự mâu thuẫn**: `AdminUsers.jsx:58` "1.248" vs 4 dòng; `AdminAuditLogs.jsx:64` "4 bản ghi" hardcode; `AdminTutorApplications.jsx:51` "(2)" hardcode. Không có sort/pagination ⇒ quy tắc `OrderByDescending(CreatedAt).ThenBy(Id)` của CLAUDE.md không có biểu hiện UI nào.
- **`AdminAuditLogs.jsx:4,57-63`** — ô search chết: `searchTerm` bind vào input nhưng `auditLogs.map` `:81` không đọc ⇒ gõ không lọc gì, header vẫn báo "Hiển thị 4 bản ghi".
- **`AdminDashboard.jsx:28-29`** — nhãn/route lệch: card "Lệnh Rút Tiền Gia Sư Chờ Duyệt" + nút "Duyệt Lệnh" trỏ về `/admin/audit-logs` (read-only), và **không có route duyệt rút tiền nào tồn tại** ⇒ admin không bao giờ duyệt được lệnh.
- **`Notifications.jsx:75-81`** — "Đánh dấu tất cả đã đọc" chỉ bắn toast, chấm chưa đọc không hề mất ⇒ UI báo thành công sai. `:88-90` tab "Tranh Chấp & Kỷ Luật" lọc `category === 'Dispute'` nên `notif-4` (`'Discipline'`) không tới được từ tab nào ngoài "Tất Cả".

---

## 7. Thứ tự sửa đề xuất

1. **Chặn mọi tuyên bố tài chính sai** — P0-1→P0-3 (checkout/return), P0-4 (điểm danh), P0-5 (admin no-op), P0-6 (dispute), P0-7 (badge user). Đây là rủi ro tin cậy/lừa dối người dùng, không phải vấn đề thẩm mỹ.
2. **Quyết định số phận của 8 signature component** — nối vào màn hình hay xoá. Đang là code chết khiến spec §3 trông như đã xong.
3. **Implement §3.1 countdown đúng hợp đồng** (deadline thật + lock CTA + 3 urgency state + nút tạo lại).
4. **Shell responsive §4.1** — ưu tiên ngay bản Admin (hiện không có nav nào <1024px).
5. **Hạ tầng trạng thái** — skeleton + empty + error + retry, và typed error giữ `code`/`errors` (hiện `api.js:56-63` nuốt hết thành `new Error(message)` nên không phân biệt được "hold expired" với "mất mạng").
6. **A11y pass** — `role`/`tabIndex`/`onKeyDown` cho clickable div, `htmlFor`/`id`, `aria-label` cho icon-only, `Modal.confirm` cho hành động bất khả hoàn, fix contrast `#10B981`.
7. **Token hoá** — thêm `borderRadius`, `glass-surface`, xoá/thay `outline-hidden`, xử lý `darkMode` chết, thay `text-[10px]`.
8. **Dọn copy & dữ liệu bịa** — jargon, diacritics, placeholder status, link `#`, favicon.

---

*Báo cáo sinh từ audit tự động + xác minh thủ công. Các mục P0 và P1 đã được kiểm chứng trực tiếp bằng build và đọc code, không chỉ suy luận.*
