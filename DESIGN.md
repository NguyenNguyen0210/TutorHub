# TutorHub — Design System Specification (`DESIGN.md` v2)

**Product:** TutorHub — Nền tảng kết nối Gia sư & Học viên trực tuyến
**Core model:** Service / Package-based Learning với bảo chứng Escrow 2 chiều
**Status:** Canonical visual specification — Brand Style Guide v2
**Stack:** React 18 + Vite 5 + Tailwind CSS 3.4 + Lucide Icons + Be Vietnam Pro (JavaScript thuần, không TypeScript)

> v2 thay thế hệ thống "Royal Navy / Indigo / Glassmorphism" của v1 bằng bản sắc
> **Minimal SaaS sáng**: Primary Blue, Secondary Orange, neutral slate, sidebar tối nhỏ,
> canvas sáng. Đây là tiêu chuẩn duy nhất còn hiệu lực.

---

## 1. Brand Identity & Metaphor

TutorHub là **Cỗ Máy Điều Phối Hợp Đồng Học Tập Trọn Gói Bảo Tồn Dòng Tiền Hai Chiều**.
Giao diện phải truyền đạt 4 giá trị:

| Giá trị | Biểu đạt thị giác |
|---|---|
| **Clarity** (Rõ ràng) | Nền sáng, khoảng trắng rộng, phân cấp chữ dứt khoát |
| **Trust** (Tin cậy) | Primary Blue ổn định, số liệu tài chính monospace, trạng thái Escrow minh bạch |
| **Simplicity** (Đơn giản) | Ít màu, một accent, không trang trí thừa |
| **Human-Centered** | Ảnh thật, avatar thật, copy tiếng Việt tự nhiên |

**Visual motif:** Growth (tăng trưởng), Connection (kết nối), Trust (bảo chứng), Momentum (tiến độ).

---

## 2. Color Palette

> **Nguồn sự thật duy nhất:** `src/frontend/src/styles/tokens.css`.
> `tailwind.config.js` chỉ ánh xạ tên ngữ nghĩa → `rgb(var(--token) / <alpha-value>)`.
> **Không viết hex trực tiếp trong JSX.**

### 2.1 Brand

| Token | Hex | Vai trò |
|---|---|---|
| `--brand-primary-600` | `#2563EB` | **Primary** — CTA chính, link, active nav, focus ring |
| `--brand-primary-700` | `#1D4ED8` | Primary hover / pressed |
| `--brand-primary-500` | `#3B82F6` | Primary sáng, biểu đồ, progress |
| `--brand-primary-50` | `#EFF6FF` | Nền subtle, badge nhạt |
| `--brand-primary-100` | `#DBEAFE` | Viền subtle, chip |
| `--brand-secondary-500` | `#F59E0B` | **Secondary** — điểm nhấn, badge "nổi bật", CTA phụ |
| `--brand-secondary-600` | `#D97706` | Secondary hover |
| `--brand-secondary-50` | `#FFFBEB` | Nền secondary nhạt |
| `--brand-navy-900` | `#0F172A` | Sidebar tối, footer, dark chrome |
| `--brand-navy-950` | `#0B0F17` | Sidebar sâu nhất |

### 2.2 Neutral (slate scale)

| Token | Hex | Vai trò |
|---|---|---|
| `--neutral-50` | `#F8FAFC` | **Canvas** — nền ứng dụng sáng |
| `--neutral-100` | `#F1F5F9` | Nền hover, table header |
| `--neutral-200` | `#E2E8F0` | **Border** mặc định |
| `--neutral-400` | `#94A3B8` | **Text muted** — placeholder, timestamp, mã hash |
| `--neutral-500` | `#64748B` | Text phụ trợ |
| `--neutral-600` | `#475569` | **Text secondary** — nhãn, mô tả |
| `--neutral-900` | `#0F172A` | **Text primary** — tiêu đề, số tiền |

### 2.3 Semantic — tài chính & trạng thái (BẤT BIẾN NGHIỆP VỤ)

| Token | Hex | Ý nghĩa backend | Ứng dụng UI |
|---|---|---|---|
| `--semantic-success` | `#10B981` | `AvailableBalance`, `SessionPayoutCredit`, `Paid`, `Attended` | Số dư khả dụng, badge "Đã xác nhận" |
| `--semantic-success-subtle` | `#ECFDF5` | — | Nền thẻ thu nhập |
| `--semantic-holding` | `#D97706` | `HoldingExpiresAt` (15m), `PendingBalance`, `Proposed` | Countdown giữ chỗ, tiền trong Escrow |
| `--semantic-holding-subtle` | `#FFFBEB` | — | Nền banner đếm ngược |
| `--semantic-danger` | `#EF4444` | `HeldBalance`, `AttendanceConflict`, `DisputeActive`, `Banned` | Phong tỏa tranh chấp, xung đột điểm danh |
| `--semantic-danger-subtle` | `#FEF2F2` | — | Nền thẻ tranh chấp |
| `--semantic-info` | `#3B82F6` | `EnrollmentActive`, `Scheduled`, `UnderReview` | Tiến độ học, lịch sắp tới |

> ⚠️ **`holding` (#D97706) cố ý khác `secondary` (#F59E0B).** Secondary là màu
> trang trí/CTA; holding là ngữ nghĩa tiền đang bị giữ. Trộn hai màu này làm
> người dùng đọc sai trạng thái tài chính.

### 2.4 Quy ước tiền tệ
- VND, phân cách dấu chấm: `2.500.000 ₫`.
- **Số tiền dùng component `<Money>`** (`components/ui/Money.jsx`): Be Vietnam Pro semibold +
  `tabular-nums` (số thẳng cột mà vẫn hiện đại) + đơn vị ₫ thu nhỏ 0.8em.
- `formatCurrency` chỉ dùng cho chuỗi trong toast/logic, không dùng để render số tiền lớn.
- **`font-mono` (JetBrains Mono) chỉ dùng cho**: mã GD, `correlationId`, countdown,
  traceId, timestamp kỹ thuật — **không dùng cho tiền tệ, đếm số, phần trăm**.
- Ngày giờ: lưu UTC, hiển thị `Asia/Ho_Chi_Minh` qua `formatDateTime`.

---

## 3. Typography

**Font chính: Be Vietnam Pro.** JetBrains Mono chỉ cho dữ liệu tài chính/định danh.

> **Ghi chú (2026-09-26):** mục này trước đây ghi *Inter*. Thực tế `tokens.css` +
> `tailwind.config.js` đã chạy **Be Vietnam Pro** (Inter vẫn được nạp sẵn trong
> bundle cho các mục chưa chuyển). Vì code và bundle là nguồn sự thật, chuẩn hoá
> docs theo code: **Be Vietnam Pro là font chính.** Inter giữ lại làm fallback.
> Chi tiết font động: `src/frontend/src/styles/tokens.css`, `tailwind.config.js`.

| Cấp bậc | Size / Line-height | Weight | Ứng dụng |
|---|---|---|---|
| Display Hero | `36px / 1.2` | 700 | Tiêu đề hero, số dư ví tổng |
| Heading 1 | `28px / 1.3` | 700 | Tiêu đề trang |
| Heading 2 | `22px / 1.35` | 600 | Tiêu đề khối |
| Heading 3 | `18px / 1.4` | 600 | Tiêu đề thẻ, tên gia sư |
| Body Large | `16px / 1.5` | 400–500 | Mô tả gói học |
| Body Regular | `14px / 1.5` | 400 | Nội dung, bảng, form |
| Caption | `12px / 1.4` | 500 | Tag, trạng thái, thời gian tương đối |
| Label | `12px / 1.4` | 600, `uppercase`, tracking-wide | Nhãn trường, nhãn cột |
| Monospace Numeric | `14px / 1.4` | 600 | Tiền, countdown, `PaymentGatewayRef`, `CorrelationId` |

---

## 4. Spacing, Radius & Elevation

### 4.1 Spacing (cơ số 4px)
`4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 · 80`
Dùng thang mặc định Tailwind (`gap-1`…`gap-20`). Mật độ **thoáng**: section cách
nhau `space-y-6`…`space-y-8`, card padding `p-5`…`p-6`.

### 4.2 Radius
| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-brand-sm` | `6px` | Badge, tag |
| `rounded-brand-md` | `10px` | Button, input, select |
| `rounded-brand-lg` | `16px` | Card, modal, chat bubble |
| `rounded-brand-xl` | `24px` | Container lớn, panel |
| `rounded-pill` | `9999px` | Pill badge, avatar |

### 4.3 Elevation
`shadow-brand-sm` (viền nổi nhẹ) · `shadow-brand-md` (card) ·
`shadow-brand-lg` (dropdown, popover) · `shadow-brand-xl` (modal, drawer).

**Nguyên tắc:** nền sáng + viền `border` mảnh là mặc định; bóng đổ chỉ dùng khi
phần tử thực sự nổi lên khỏi mặt phẳng (popover, modal, dropdown).

### 4.4 Glass (chỉ dùng cho overlay/navbar dính)
```css
.glass-surface      /* navbar dính, panel nổi trên nội dung */
.glass-panel-premium
.glass-panel-dark   /* overlay trên sidebar tối */
```

---

## 5. Iconography

- **Bộ icon: Lucide** (`lucide-react`) — outline, stroke `2px`, đầu nét bo tròn.
- **Grid chuẩn 24px.** Scale cho phép: `16px` (inline/phụ), `20px` (nút, nav),
  `24px` (mặc định), `32px` (empty state, hero nhỏ).
- Icon-only button **bắt buộc** có `aria-label`.
- Filled/solid chỉ dùng cho hành động quan trọng (trạng thái đã chọn, CTA chính);
  mặc định là outline.
- Wrapper chuẩn: `src/components/ui/Icon.jsx` + `src/lib/iconMap.js`.

---

## 6. Layout Architecture

### 6.1 Breakpoints
| Vùng | Hành vi |
|---|---|
| `< 640px` (mobile) | 1 cột, sidebar → drawer, bottom dock, sticky action bar |
| `640–1023px` (tablet) | 2 cột, sidebar → rail icon hoặc drawer |
| `≥ 1024px` (desktop) | Sidebar cố định `240px` + main `calc(100% - 240px)` |
| Container tối đa | `1280px` (`max-w-7xl`) cho trang public |

### 6.2 Shell
```text
PublicTopbar      Guest & public: logo · search · nav · CTA · login
WorkspaceShell    Student/Tutor/Admin: sidebar tối 240px + topbar + canvas sáng
                  < 1024px: sidebar → rail/drawer
AuthShell         Thẻ căn giữa, nền sáng tối giản
```
- **Sidebar tối** (`--brand-navy-900`), item active dùng `--brand-primary-600`.
- Header dính dùng `.glass-surface`.

### 6.3 Dashboard mẫu
```text
┌────────────┬──────────────────────────────────────────────┐
│ SIDEBAR    │ Topbar: breadcrumb · search · 🔔 · avatar     │
│ (navy 240) ├──────────────────────────────────────────────┤
│            │ Vùng nội dung trên canvas sáng #F8FAFC        │
│  • item    │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  • item    │ │ StatCard│ │ StatCard│ │ StatCard│ │ StatCard│ │
│  • ACTIVE  │ └────────┘ └────────┘ └────────┘ └────────┘  │
└────────────┴──────────────────────────────────────────────┘
```

---

## 7. Signature Components

### 7.1 Holding Countdown (15 phút)
- Deadline lấy từ `holdingExpiresAt` của server, **không** đếm cục bộ từ đầu.
- 3 trạng thái: Calm (`> 5 phút`, holding-subtle) → Caution (`2–5 phút`, đậm hơn)
  → Emergency (`< 2 phút`, danger-subtle, nhịp `pulse`).
- Chạm `00:00`: khoá CTA thanh toán, hiện nút "Tạo lại đơn hàng".

### 7.2 Dual Attendance Verification Card
- Hai cột song song Student | Tutor, mỗi bên hiện lựa chọn **đọc từ server**.
- Đồng thuận `Attended` → badge success "Đồng thuận hoàn thành".
- Bất đồng (`HasAttendanceConflict`) → khối danger + CTA mở khiếu nại, `animate-shake`.

### 7.3 Escrow Wallet — 4 chỉ số
`PendingBalance` · `AvailableBalance` · `HeldBalance` · `WithdrawableBalance`
- `WithdrawableBalance` nổi bật nhất (success, `text-headline-1`, `font-mono`).
- Nút rút **disabled** khi `WithdrawableBalance < 50.000 ₫`.
- `HeldBalance` dùng viền danger khi có tranh chấp mở.

### 7.4 Service Package Card
Tiêu đề · mô tả · meta (số buổi / phút / trial) · giá trọn gói + giá mỗi buổi ·
CTA "Đặt mua gói này (giữ chỗ 15p)" (primary) + "Thương lượng riêng" (ghost).

### 7.5 Session Breakdown Timeline
Progress `x / N buổi`; mỗi dòng: số buổi · giá · trạng thái · thời gian · hành động
(Xem nhật ký / Vào lớp / Dời lịch / Xếp lịch / Theo dõi khiếu nại).

### 7.6 Admin Dispute Fee Calculator (DEC-S8-025)
- Nhập `StudentRefund` → tự phân bổ `TutorNetRecovery` + `PlatformFeeReversal`.
- **Khoá cứng:** `StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal`.
- Thu hồi từ ví gia sư **không vượt** số thực nhận; thiếu tiền ⇒ `HeldAmount = 0` +
  `RequiresAdminFinancialIntervention` (DEC-S8-028).

---

## 8. Motion & Loading

1. **Holding pulse** — countdown `pulse` nhẹ lan tỏa khi đang giữ chỗ.
2. **Conflict shake** — `animate-shake` (0.4s) khi phát hiện `AttendanceConflict`.
3. **Message pop** — tin nhắn SignalR trượt lên (`animate-fadeIn`).
4. **Skeleton, không spinner toàn trang** — `CardSkeleton`, `TableSkeleton`,
   `StatsSkeleton`, `ProfileSkeleton`, `ListSkeleton`, `DetailSkeleton`.
5. **`prefers-reduced-motion`** — tắt mọi animation/transition (đã cài trong `index.css`).

---

## 9. Accessibility

- `eslint-plugin-jsx-a11y` ở mức **error** — 0 error là điều kiện merge.
- Mọi input có `<label htmlFor>` hoặc `aria-label`.
- Icon-only button có `aria-label`.
- Tap target ≥ 44px.
- `:focus-visible` ring dùng `--brand-primary-600`.
- Tương phản chữ tiền ≥ 4.5:1 (dùng `success-strong` / `holding-strong` /
  `danger-strong` cho chữ trên nền nhạt).

---

## 10. Checklist cho Frontend Engineer

- [ ] Không hex trực tiếp trong JSX; dùng token Tailwind.
- [ ] Enum dùng đúng giá trị backend (`Attended`, `Absent`, `Holding`, `Paid`,
      `Unscheduled`, `Scheduled`, `Completed`, `Cancelled`).
- [ ] Không phát minh dữ liệu ngoài `seedData.sql` / API thật.
- [ ] Ví gia sư hiển thị đủ 4 chỉ số.
- [ ] Tiền dùng `<Money>`, không dùng `font-mono` cho tiền.
- [ ] Ngày giờ đã convert sang `Asia/Ho_Chi_Minh`.
- [ ] Countdown khoá CTA tại `00:00`.
- [ ] Thẻ điểm danh đủ 2 cột Student | Tutor.
- [ ] Calculator tranh chấp tuân thủ `StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal`.
- [ ] Icon Lucide, đúng scale, icon-only có `aria-label`.
- [ ] Đã kiểm tra 360 / 768 / 1024 / 1440 / 2560 px.

---

## 11. Migration Aliases (tạm thời)

Trong lúc chuyển đổi, `tailwind.config.js` giữ alias cũ trỏ về token mới để app
không vỡ: `brand-indigo-*`, `indigo-*`, `financial-*`, `surface-*-light`,
`text-text-*`, `border-border-light`, `font-monospace-num`, `rounded-{sm6,md10,lg16,xl24}`,
`shadow-{glass,premium,glow-*}`, `.text-gradient-{indigo,emerald,amber}`,
`.glow-{indigo,emerald,amber,rose}`.

**Không thêm usage mới cho các alias này.** Chúng sẽ bị xoá sau khi migration xong.

---

*`DESIGN.md` v2 là tiêu chuẩn thiết kế chính thức của TutorHub.*
