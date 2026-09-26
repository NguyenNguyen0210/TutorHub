# SPEC — Thuần token hoá trang Public & Admin

> Trạng thái: **đã duyệt để thực thi** (2026-09-26). Bổ sung cho
> `docs/student-workspace-spec.md`, `docs/tutor-workspace-spec.md`,
> `docs/shared-workspace-spec.md`, `docs/tutor-profile-spec.md` — 4 SPEC đó đã xong.
> Ở đây chỉ còn **2 vùng chưa chạm**: trang công khai và trang quản trị.

---

## 1. Vấn đề

Sau khi Student / Tutor / Shared + hồ sơ công khai được dựng lại theo chuẩn
**Operational Ledger**, còn **1174 chỗ màu thô** nằm rải ở 34 file:

| Vùng | File | Chỗ màu thô |
|---|---|---|
| Auth | `Register.jsx` 123 · `Login.jsx` 90 · `AuthHeader.jsx` 6 | 219 |
| Marketplace | `ServiceCard` 64 · `FilterSidebar` 36 · `ServiceFilterSidebar` 38 · `TutorCard` 29 · `HeroSection` 27 · `ServiceHeroSection` 26 · `ServicesMarketplace` 12 · `Marketplace` 9 · `CategoryFilterBar` 8 · `BecomeTutor` 3 | 252 |
| Service detail | `ServiceDetail` 54 · `ServiceDetailHero` 51 · `ServiceReviews` 35 · `ServiceSidebarCard` 30 · `ServiceSyllabus` 28 · `ServiceFaqs` 9 | 207 |
| Public chrome + how-it-works | `PublicFooter` 34 · `StepsSection` 30 · `HowItWorksHero` 29 · `PublicTopbar` 24 · `WhyTutorHub` 13 · `FAQSection` 7 · `ReadyToStartCTA` 6 | 143 |
| Checkout | `BookingCheckout` 26 | 26 |
| **Admin** | `AdminTutorApplications` 268 · `AdminUsers` 18 · `AdminDashboard` 13 · `AdminDisputeDetail` 7 · `AdminStudentWallets` 1 | 307 |

Hệ quả nếu để nguyên:

1. **Hai hệ màu cùng chạy.** Workspace dùng `--text-muted` / `border`; trang public
   hardcode `text-slate-500` / `border-slate-200`. Đổi `--canvas` sẽ sửa được
   workspace nhưng public vẫn lệch.
2. **Chỗ này màu đậm hơn chỗ kia.** `text-slate-700` (`#334155`) là chữ phụ ở
   đây nhưng là chữ chính ở file kia. Không có quy tắc nên cảm giác loạn.
3. **Trang public hiện 7 sắc trang trí cùng lúc** — `blue`, `sky`, `teal`, `indigo`,
   `emerald`, `amber`, `rose`. Không sắc nào trông như cố ý; đọc như chưa ai
   chọn màu.
4. **Sửa token tốn công.** Muốn đổi một sắc phải `grep` 34 file.

`WorkspaceShell.jsx` cũng còn 19 chỗ `slate-*` (đã sửa trong lượt này → còn 0) —
nó là layout dùng chung nên nằm trong phạm vi.

---

## 2. Quyết định nền tảng

### 2.1 Nối thang `neutral` vào Tailwind (đã làm)

`tokens.css` khai báo `--neutral-50..950` nhưng `tailwind.config.js` **không nối**.
Hệ quả: mọi `bg-neutral-50` trong code lấy mặc định Tailwind `#FAFAFA`, không
phải `#F8FAFC` của dự án — tức là các file đã làm xong cũng đang lệch nhẹ.

Đã thêm `neutral` vào `theme.extend.colors`. Không thêm token mới: biến đã tồn tại,
chỉ thiếu khai báo. Việc này còn làm cho bảng ánh xạ ở §3 **giữ nguyên màu**.

### 2.2 Nguyên tắc bất di bất dịch

- Public giữ ngôn ngữ **Editorial Portfolio** (bố cục thoáng, tiêu đề lớn, nhiều
  khoảng thở, ảnh). Đổi này chỉ là **đổi hệ màu**, **không** đổi bố cục.
- Admin là workspace nên dùng luôn **Operational Ledger**.
- Không đổi API call-site, không đổi validation, không đổi copy tiếng Việt.
- Không thêm token mới. Bảng §3 phủ đủ mọi màu đang dùng.
- `font-mono` (JetBrains Mono) **không** dùng cho tiền, số, phần trăm. Tiền dùng
  `<Money>`; số kỹ thuật (mã GD, `correlationId`, traceId) mới dùng mono.
- Không gradient. Icon chỉ qua `<Icon>` với `name` có thật trong `iconMap.js`.
- Không `defaultProps`. Không emoji.
- Ưu tiên sửa dòng, không refactor logic. Nếu thấy bug chức năng → **báo lại, đừng
  tự sửa** (trừ khi SPEC này nói rõ).

---

## 3. Bảng ánh xại (đã kiểm chứng từng giá trị hex)

Cột "khớp" nghĩa là giá trị màu **giống hệt**, nên thay thế không làm đổi màu.

### 3.1 Trung tính — `slate-N` → `neutral-N` (KHỚP 100%)

| slate | hex | → | token | hex | khớp |
|---|---|---|---|---|---|
| 50 | `#F8FAFC` | → | `neutral-50` / `canvas` | `#F8FAFC` | ✓ |
| 100 | `#F1F5F9` | → | `neutral-100` | `#F1F5F9` | ✓ |
| 200 | `#E2E8F0` | → | `border` / `neutral-200` | `#E2E8F0` | ✓ |
| 300 | `#CBD5E1` | → | `neutral-300` | `#CBD5E1` | ✓ |
| 400 | `#94A3B8` | → | `fg-muted` / `neutral-400` | `#94A3B8` | ✓ |
| 500 | `#64748B` | → | `neutral-500` | `#64748B` | ✓ |
| 600 | `#475569` | → | `fg-secondary` / `neutral-600` | `#475569` | ✓ |
| 700 | `#334155` | → | `neutral-700` | `#334155` | ✓ |
| 800 | `#1E293B` | → | `neutral-800` | `#1E293B` | ✓ |
| 900 | `#0F172A` | → | `fg` / `neutral-900` | `#0F172A` | ✓ |

**Ưu tiên ngữ nghĩa khi đang là chữ** (đọc tốt hơn, giữ đúng màu):
`text-slate-900|800` → `text-fg` · `text-slate-600` → `text-fg-secondary` ·
`text-slate-400` → `text-fg-muted` · `border-slate-200` → `border-border`.

Còn nền/viền thì giữ dạng thang: `bg-slate-50` → `bg-neutral-50`,
`border-slate-100` → `border-neutral-100`.

### 3.2 Brand — `blue-N` → `brand-primary-N` (KHỚP 100%)

`blue-50/100/200/300/400/500/600/700/800` lần lượt `#EFF6FF · #DBEAFE · #BFDBFE ·
#93C5FD · #60A5FA · #3B82F6 · #2563EB · #1D4ED8 · #1E40AF` — trùng với
`brand-primary-50…800`.

Hex: `#2563EB`→`brand-primary-600` · `#1D4ED8`→`brand-primary-700` ·
`#1E40AF`→`brand-primary-800` · `#EFF6FF`→`brand-primary-50`.

`indigo-N` cũng trùng (`tailwind.config.js` đã alias sẵn) → đổi thành
`brand-primary-N` cho nhất quán.

### 3.3 Nền tối — hex → `brand-navy-*` (KHỚP 100%)

`#0B1220`=`brand-navy-950` · `#0F172A`=`brand-navy-900` · `#1E293B`=`brand-navy-800`
· `#334155`=`brand-navy-700`.

### 3.4 Thành công — `emerald-*` → `success*`

| emerald | hex | → | token | khớp |
|---|---|---|---|---|
| 500 | `#10B981` | → | `success` | ✓ |
| 700 | `#047857` | → | `success-strong` | ✓ |
| 800 | `#065F46` | → | `success-strong` | gần |
| 600 | `#059669` | → | `success-strong` | gần |
| 50 | `#ECFDF5` | → | `success-subtle` | ✓ |
| 100/200 | `#D1FAE5` `#A7F3D0` | → | `success-subtle` | gần |

Hex: `#16A34A`→`success-strong` · `#DCFCE7`→`success-subtle` · `#34A853` **giữ**
(màu nút Google).

### 3.5 Chờ / cảnh báo — `amber-*` → `holding*` ⚠ CÓ BẪY

`DESIGN.md` §2.3 cảnh báo: `holding` `#D97706` **cố ý khác** `secondary` `#F59E0B`.
Trộn hai màu này làm người dùng đọc sai trạng thái tài chính.

| amber | hex | → | token | khớp |
|---|---|---|---|---|
| 600 | `#D97706` | → | `holding` | ✓ |
| 700 | `#B45309` | → | `holding-strong` | ✓ |
| 50 | `#FFFBEB` | → | `holding-subtle` | ✓ |
| 100/200 | `#FEF3C7` `#FDE68A` | → | `holding-subtle` | gần |
| 800 | `#92400E` | → | `holding-strong` | gần |
| **500** | `#F59E0B` | → | **`brand-secondary-500`** | ✓ **KHÔNG phải `holding`** |
| **400** | `#FBBF24` | → | **`brand-secondary-400`** | ✓ **KHÔNG phải `holding`** |

Quy tắc: `amber-600/700/50` là **trạng thái chờ** → `holding*`. `amber-500/400` là
**màu trang trí/CTA** → `brand-secondary-500/400`. `fill-amber-400` (icon sao) →
`fill-brand-secondary-400`.

### 3.6 Nguy hiểm — `rose-*` → `danger*`

| rose | hex | → | token |
|---|---|---|---|
| 500 | `#F43F5E` | → | `danger` |
| 600 | `#E11D48` | → | `danger-strong` |
| 50/100/200 | `#FFF1F2` `#FFE4E6` `#FECDD3` | → | `danger-subtle` |

Hex: `#EA4335`→`danger` (nút Google đỏ, chấp nhận lệch nhẹ).

### 3.7 `sky` / `teal` / `cyan` — KHÔNG có token, phải hợp nhất

Đây là nguồn của cảm giác "loạn sắc". Không token tương ứng nên quy về:

- Dùng cho **huy hiệu niềm tin / thông tin** ("Được xác thực", "Bảo chứng"):
  → `info`, nền `info-subtle` (nếu là khẳng định tích cực) hoặc `success-subtle`.
- Dùng cho **nền nhạt** (`sky-50/100/200`, `teal-50/100`, `#ECFEFF`, `#E0F2FE`,
  `#F0FDF4`, `#F0F6FB`, `#F0F7FF`): → `brand-primary-50` / `neutral-50` / `canvas`.
- Dùng cho **chữ nhấn** (`sky-600/700`, `#0284C7`): → `info`.

### 3.8 Trắng / đen

`#FFFFFF` nền → `bg-surface`; chữ trên nền tối → `text-white` (quy ước sẵn có
của repo, 57 chỗ). `#000000` → `text-fg` / `bg-brand-navy-950`.

### 3.9 Giữ nguyên — màu thương hiệu bên thứ ba

`#4285F4` (Google) · `#34A853` (Google) · `#FBBC05` (Google) · `#1877F2` (Facebook)
· `#EA4335` (Google) — đây là màu nút OAuth, **giữ nguyên**. Sửa chúng sẽ vi phạm
hướng dẫn thương hiệu của bên thứ ba.

---

## 4. Yêu cầu riêng theo vùng

### 4.1 Public (Editorial Portfolio)

- Tiêu đề trang: `headline-page` (30px) hoặc `headline-1` (28px) — không
  `text-[30px]`.
- Giữ nguyên bố cục, khoảng cách, ảnh, chữ. Đổi màu thôi.
- Nút bấm: `variant="primary"` / `"outline"` / `"ghost"` qua `<Button>`, không tự
  viết `bg-blue-600 hover:bg-blue-700`.
- Thẻ: `Card` + `rounded-brand-lg` + `border-border`, bóng chỉ khi thực sự nổi.
- Trạng thái: dùng `StateBadge` cho badge trạng thái, không tự phối màu.
- Tiền: `<Money>`. Giá trên thẻ gói dùng `headline-2`/`headline-3`, không mono.
- Còn 7 sắc trang trí → gộp còn **1 brand + 4 ngữ nghĩa**. Đây là mục tiêu
  nhìn thấy được rõ nhất, không phải chi tiết hình thức.

### 4.2 Admin (Operational Ledger)

- Dùng lại đúng bộ `components/ledger/`: `LedgerTable`, `LedgerStrip`,
  `ActionQueue`, `StateBadge`, `SignedAmount`.
- `AdminTutorApplications` là file lớn nhất toàn repo về màu thô (268 chỗ) và
  cũng là màn dày dữ liệu nhất. Nếu file vượt ~700 dòng sau khi sửa, tách
  component con ra `components/admin/`.
- Số tiền trong bảng: `SignedAmount`. Cột cố định bề rộng, chữ phải phải.
- Badge trạng thái đơn: `StateBadge`, không tự chọn màu theo tên trạng thái.
- Platform fee hiển thị trung tính, không xanh.
- Hành động phá huỷ / từ chối: `variant="danger-outline"`, không `variant="success"`.

### 4.3 `BookingCheckout`

- Đây là bước thanh toán — nơi dễ nhầm tiền nhất. Giữ nguyên luồng, chỉ đổi màu.
- Tổng tiền phải nổi hơn hàng còn lại (cỡ chữ lớn hơn + `text-fg`, không phải
  màu xanh để tránh đọc như "đã thanh toán xong").

---

## 5. Cổng kiểm (bắt buộc)

Mỗi nhóm phải đạt **cả 4** trước khi báo xong:

1. `npx eslint <file>` → **0 error**. Warning so với baseline repo (82 toàn cục)
   không được tăng ở file đã đụng.
2. `npm run build` → pass.
3. Đếm lại chỗ màu thô trong đúng các file của nhóm → **0**:
   ```powershell
   $pats = 'text-(slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}','bg-(slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}','border-(slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}','(ring|divide|from|via|to|outline|decoration|shadow|accent|caret|fill|stroke)-(slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}','#[0-9a-fA-F]{3,8}','rgba?\(','oklch\(','hsl\('
   ```
   Ngoại lệ duy nhất: màu thương hiệu OAuth ở §3.9.

   > **`#123` trong một `placeholder` là false positive của cổng đếm, không phải màu.**
   > `AdminStudentWallets.jsx` có `placeholder="… theo quyết định #123"` — đó là *ví dụ
   > định dạng mã quyết định*, không phải mã màu. Đừng "sửa" nó và **đừng lách regex**
   > bằng cách tách chuỗi (`'#' + '123'`): đó là gian lận cổng kiểm, làm mã nguồn
   > tệ đi mà không sửa gì cả. Ghi ngoại lệ vào đây như dòng dưới.
   >
   > ```text
   > AdminStudentWallets.jsx  #123   <- placeholder, false positive (đã biết)
   > ```
4. `git diff` đọc lại được — không có class không tồn tại. Mỗi class mới phải có
   thật trong `tailwind.config.js` hoặc là utility mặc định của Tailwind.
   (`text-fg-secondary` OK, `text-text-muted` là alias cũ — tránh dùng lại.)

---

## 6. Ghi chú triển khai

### 6.1 Kết quả

| Vùng | Chỗ màu thô | Kết quả |
|---|---|---|
| Auth (`Register` 123 · `Login` 90 · `AuthHeader` 6) | 219 | 0 |
| Marketplace (10 file) | 252 | 0 |
| Service detail (6 file) | 207 | 0 |
| Public chrome + how-it-works + checkout (8 file) | 169 | 0 |
| Admin (5 file + 5 component mới) | 307 | 0 |
| `WorkspaceShell.jsx` | 19 | 0 |
| **Tổng** | **1174** | **0** |

Cổng kiểm cuối: eslint **0 error** (73 warning, baseline 82) · build pass · 0 màu thô ·
0 class chết · 0 icon thiếu.

Còn 12 kết quả khớp regex, đều là ngoại lệ có chủ đích:
`Register`/`Login` 5 mỗi file (màu thương hiệu OAuth, §3.9) · `MobileBookingBar` 1
(`rgb(var(--brand-navy-900)/0.15)` — màu token viết trong arbitrary shadow) ·
`AdminStudentWallets` 1 (`#123` trong placeholder, xem cảnh báo ở §5).

### 6.2 Nối thang `neutral` — ảnh hưởng toàn repo

Sau §2.1, **586 class `neutral-*`** trong app đổi giá trị (từ mặc định Tailwind
`#FAFAFA…` sang thang dự án `#F8FAFC…`). Toàn bộ nghiêng về lạnh một chút — trùng
hướng `--canvas`/`--border` vốn đã khai báo. Đã kiểm bằng trình duyệt: link footer
chuyển từ `rgb(163,163,163)` sang `rgb(148,163,184)`, sidebar giữ `rgb(226,232,240)`.

> **Dev server cache Tailwind config.** Sửa `tailwind.config.js` phải restart Vite,
> nếu không class vẫn trả giá trị cũ. CSS của `npm run build` luôn đúng.

### 6.3 Bug phát hiện thêm trong lúc thực thi (không nằm trong §1)

Regex đếm màu thô **không bắt được** ba loại lỗi sau — vì mắt thường cũng không thấy:

| Loại | Số | Vì sao vô hình | Cách phát hiện |
|---|---|---|---|
| Class **không tồn tại** trong Tailwind | 36 | Tailwind bỏ qua, trình duyệt bỏ qua, không cảnh báo | So mọi class trong source với CSS đã build |
| Icon `name` không có trong `ICON_MAP` | 21 | `getLucideIcon` fallback sang `CircleHelp` → hiện **dấu hỏi** ở đúng chỗ | So `<Icon name>` với key của `ICON_MAP` |
| `font-mono` cho tiền / đếm số | 5 | Vẫn hiển thị, chỉ sai chuẩn | Đọc `DESIGN.md` §2.4 từng chỗ |

Chi tiết:

- **`shadow-2xs` (23) và `shadow-xs` (8)** là tên **Tailwind v4**; dự án dùng v3.4 →
  cả 31 class không sinh CSS, mọi card dựa vào chúng đang **bằng phẳng**. Sửa
  thành `shadow-sm` (bậc nhỏ nhất của v3). Thêm `no-scrollbar` vào `index.css`
  (`scrollbar-width` + `::-webkit-scrollbar`) vì Tailwind v3 không có sẵn.
- **`pl-13` / `ml-13`** (`ServiceReviews`) — 13 không có trong thang spacing của v3.
  Tác giả tính đúng: `Avatar size="md"` = 40px + `gap-3` = 12px = **52px** = 13×4.
  Sửa thành `pl-[52px]` / `ml-[52px]`.
- **`bg-danger-50` / `border-danger-100` / `border-danger-200`** — `danger` trong
  config chỉ có `DEFAULT|strong|subtle`, nên nền và viền **không hiện**. Xảy ra ở
  `AdminDashboard` và `AdminUsers`.
- **`animate-slide-up`**, **`text-body-bold`**, **`backdrop-blur-xs`** (3),
  **`rounded-brand-full`**, **`text-body`** — cùng loại, sửa hết.
- **21 icon `name` thiếu** → thêm vào `ICON_MAP` + import Lucide tương ứng vào
  `lucideRegistry.js`. Trong đó có `emoji_events`→`Award` (huy hiệu thành tích),
  `security`→`ShieldCheck`, `add_card`→`CreditCard`, `pie_chart`→`PieChart`,
  `play_arrow`→`Play`. Vì `getLucideIcon` có fallback, lỗi này **hiện dấu hỏi
  chứ không trống** — dễ bỏ sót hơn nhiều.
- **`StatCard` đặt `mono = true` mặc định** — mọi KPI (kể cả số lệnh, số tiền) hiện
  bằng JetBrains Mono, trái `DESIGN.md` §2.4 **và trái chính comment của component**
  ("Mặc định dùng Be Vietnam Pro"). Bốn chỗ gọi ở `AdminDisputes` phải truyền
  `mono={false}` thủ công để sửa — đó là bằng chứng default sai chứ không phải thiếu
  cấu hình. Đổi thành `mono = false`. 30 chỗ `font-mono` còn lại ở `AdminWithdrawals`
  là mã ngân hàng / số tài khoản → giữ nguyên, đúng §2.4.

### 6.4 Script kiểm tra

Hai script dùng để chặn loại lỗi ở §6.3, đặt ngoài repo
(`%LOCALAPPDATA%\Temp\opencode\`):

- `check-all-classes.ps1` — so **mọi** class trong `src/frontend/src` với selector
  thật trong `dist/assets/*.css`. Đây là công cụ đáng tin nhất vì nó không đoán:
  Tailwind chỉ sinh CSS cho class nó tìm thấy, nên "có trong CSS" ⇔ "sẽ render".
- `check-colour-classes.ps1` — soi riêng thang màu tùy chỉnh, bắt các shade không
  tồn tại (`danger-50` khi `danger` chỉ có `DEFAULT|strong|subtle`).

> Bẫy khi viết script PowerShell: `-match` **không phân biệt hoa thường**, nên
> `-notmatch '[A-Z]'` loại cả class viết thường. Phải dùng `-cnotmatch`. Và
> `String.Trim` nhận `char[]`, không nhận chuỗi nhiều ký tự.

### 6.5 Đã sửa, không thuộc phạm vi token

- **`ProfileSettings`**: gia sư chưa có `TutorProfile` thì `GET /tutors/me` trả 404
  và cả trang Cài đặt chết — kể cả tab Đổi mật khẩu vốn không cần hồ sơ giảng dạy.
  Nay fallback sang `GET /users/me`, hiện `Callout` báo hồ sơ đang chờ duyệt, ẩn các
  trường sư phạm, và lưu qua endpoint cấp tài khoản.
