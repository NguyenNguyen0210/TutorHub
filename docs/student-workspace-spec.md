# SPEC — Vùng Học Viên (Student workspace)

> Trạng thái: SPEC v1.0 — **đã implement** (V1). Xem "Ghi chú triển khai" ở §8.
> Hướng thẩm mỹ: **Operational Ledger**.
> Phạm vi: 5 màn `/student/*`. Nhóm Tutor và Shared viết SPEC riêng sau.
> Quyết định đã chốt: scope theo vai trò (Student → Tutor → Shared) · Operational Ledger
> cho workspace · giữ **Be Vietnam Pro** (sửa `DESIGN.md`) · SPEC gộp rồi implement từng màn.
> Liên quan: `DESIGN.md`, `docs/tutor-profile-spec.md` (public đã xong), `docs/prd.md`.

---

## 1. Design brief

```
Purpose:    Trả lời trong 5 giây: "việc gì đang chờ tôi" và "tiền của tôi đang ở đâu"
Audience:   Học viên dùng hằng ngày trên mobile trước, desktop để đối soát
Tone:       Operational Ledger — sổ cái, đối soát, số liệu dày, zero trang trí
Reference:  Console vận hành / sổ cái kế toán: cột số tabular, gạch ngang, ký quỹ rõ ràng
Palette:    Token có sẵn. Màu = trạng thái, không phải trang trí (xem §2.2)
Type:       Be Vietnam Pro. Tiền qua <Money>. Số & thời gian kỹ thuật qua tabular/mono
Memorable:  Action Queue — hàng đầu mọi màn là việc đang chờ mình, xếp theo hạn chót
Restraint:  Không hero, không gradient, không icon-card 4 ô, tối đa 1 CTA primary mỗi màn
```

**Vì sao Operational Ledger chứ không phải Editorial:** trang public bán niềm tin, còn
vùng này là công cụ vận hành — người dùng cần số và hạn chót, không cần không gian thở
để quyết định có mua hay không. Editorial giữ nguyên cho public; workspace gọn lại.

---

## 2. Token block (dùng token có sẵn — KHÔNG tạo token mới)

### 2.1 Bề mặt & chữ

```css
--surface: 255 255 255;      /* card, bảng */
--canvas: 248 250 252;       /* nền trang (neutral-50) */
--border: 226 232 240;       /* #E2E8F0 — đường kẻ chính */
--text-primary: 15 23 42;
--text-secondary: 71 85 105;
--text-muted: 148 163 184;
--brand-primary-600: 37 99 235;  /* accent DUY NHẤT: CTA, link, active */
/* Type: page title 30/700 · section 20/600 · row title 15/600 · body 14/400
   meta 12–13 · cell 13 · money 20/700 tabular · mono cho mã GV & timestamp */
/* Radius: brand-lg 16 (card) · brand-md 10 (control) · brand-sm 6 (chip, ô số) */
/* Shadow: brand-sm mặc định; brand-md chỉ khi hover card tương tác được */
/* Motion: 150–200ms ease-out. Không animation trên số liệu tài chính. */
```

### 2.2 Màu = trạng thái (quy tắc cứng)

| Màu | Chỉ dùng cho | Không dùng cho |
|---|---|---|
| `success` #10B981 | Tiền đã quyết toán, buổi đã hoàn thành, hợp đồng active | Trang trí, "phí sàn" |
| `holding` #D97706 | **Tiền đang ký quỹ / chờ đối soát / chờ rút** | Nút phụ thường |
| `danger` #EF4444 | Xung đột điểm danh, hủy buổi, tranh chấp, tiền bị giữ | Nút chính khi chỉ chọn lý do |
| `info` #3B82F6 | Lịch đã xếp, đang chờ xử lý | Trạng thái đã xong |
| `neutral` | Mọi thứ còn lại | — |

**Sửa luôn:** `EnrollmentDetail` đang tô "Tỷ lệ phí sàn" bằng `success-subtle` + chữ
success. Phí sàn **không phải tín hiệu tốt** cho học viên → chuyển `neutral`.

---

## 3. Bug có sẵn phải sửa TRƯỚC khi thiết kế (đã verify live)

| # | Vị trí | Vấn đề | Hậu quả | Fix |
|---|---|---|---|---|
| B-1 | `SessionDetail.jsx:319`, `AdminWithdrawals.jsx:788` | `variant="danger-outline"` không tồn tại trong `Button.VARIANT_CLASS` | Button **phá hủy** render thành **primary xanh** (`|| VARIANT_CLASS.primary`) | Thêm variant `danger-outline` thật (viền đỏ + chữ đỏ) — 2 call site cần, hợp lý |
| B-2 | `StudentWallet.jsx:312`, `AdminStudentWallets.jsx:257`, `TutorSchedule.jsx:228` | Truyền `activeTab=` + tab dùng `id`; `Tabs` nhận `value` + `key` | `t.key` = `undefined` → **mọi tab cùng `aria-selected="true"`**; `onChange(undefined)` → click tab không đổi nội dung. Verify live: `/tutor/schedule` 2/2 tab selected, click không đổi | Sửa 3 file sang `value` + `key` |
| B-3 | `StudentWallet.jsx:691` | `<select>` thô thay vì `Select` chung | Lệch focus ring, height, style với mọi form khác | Dùng `Select` |

---

## 4. Khung bố cục chung

```text
┌ SIDEBAR 240px (WorkspaceShell, có sẵn) ┐ ┌ CANVAS ───────────────────────────┐
│                                        │ │ PAGE TITLE 30/700      [CTA 1]   │
│                                        │ │ SUBTITLE 14 secondary            │
│                                        │ │ ─────────────────────────────── │
│                                        │ │ ACTION QUEUE  (mốc đỏ: hạn chót)│
│                                        │ │ LEDGER STRIP (4 số, phẳng)      │
│                                        │ │ ─────────────────────────────── │
│                                        │ │ NỘI DUNG CHÍNH      │ RAIL 320px │
│                                        │ │ (bảng / dòng sổ)   │ (sticky)   │
└────────────────────────────────────────┘ └────────────────────────┴──────────┘
```

- **Action Queue** chỉ hiện khi có việc. Hết việc → biến mất, không hiện "tất cả tốt" ảo.
- **Ledger strip**: số lớn 28/700 tabular + nhãn 13 secondary, trên nền `surface`, viền
  `border`. **Không** icon tròn, không màu nền theo tone. Số là nhân vật chính.
- **Rail** chỉ desktop (`lg:sticky lg:top-24`). Mobile: rail bung xuống dưới nội dung.

---

## 5. Đặc tả từng màn

### 5.1 `/student/dashboard` — Bàn học của tôi

**Nguồn:** `GET /enrollments/me` (pageSize 20) · `GET /sessions/me` · `authStore.user.absentStrikes`

```text
Bàn học của tôi                                    [+ Tìm thêm gia sư]
Hợp đồng, lịch học và học phí đang bảo chứng của bạn

┌ ACTION QUEUE (sắp theo hạn chót) ────────────────────────────┐
│ ⏳ Buổi #4 · Toán — đối soát điểm danh    còn 9h   [Xác nhận]│  holding
│ ● Buổi #5 bắt đầu sau 18h                             [Xem]  │  info
└──────────────────────────────────────────────────────────────┘

  3 Hợp đồng   │ 1.800.000đ ký quỹ │ 22/09 19:30 │ 0/3 tín nhiệm   ← ledger strip
  đang học     │                   │ buổi tới   │

Hợp đồng đang học (3)                                    Xếp theo ↓
┌──────────────────────────────────────────────────────────────┐
│ ● Toán THCS lớp 9–10        [Đang học]        12/15 buổi 80% │
│   Nguyễn Văn An · 60p/buổi                    1.800.000đ    │
└──────────────────────────────────────────────────────────────┘
┌ RAIL ┐  ┌ Tiền của bạn đang ở đâu ──────┐
       │  │ Ký quỹ      1.800.000đ        │
       │  │ Đã giải ngân   0đ            │
       │  │ Đã hoàn      200.000đ        │
       │  ├──────────────────────────────┤
       │  │ Buổi tới — 22/09 19:30       │
       │  │ Toán THCS · Nguyễn Văn An     │
       │  └──────────────────────────────┘
```

- **Hành vi cũ giữ nguyên:** filter Active/Scheduled, `escrowRemaining` tính từ
  `totalPrice × (total - completed)/total`, badge trạng thái, CTA `Chi tiết hợp đồng`.
- **Cải tiến cấu trúc:** Action Queue thay cho `Callout` điểm danh đang nằm lọt sau 4 stat
  card. Xếp theo `attendanceVerificationDueAt` / `startAt` — đúng ưu tiên thật.
- Bỏ `StatCard` icon tròn → ledger strip phẳng (StatCard vẫn dùng ở màn khác nếu hợp).
- `Tổng: N hợp đồng` dùng `font-mono` → tabular, không mono (số đếm không phải mã kỹ thuật).
- Sorting: `Đang học` trước `Hoàn thành`, cùng nhóm thì sắp buổi tới gần nhất.

### 5.2 `/student/wallet` — Ví Học Viên

**Sửa B-2, B-3 trước.** Tách 2 modal thành 2 trang (xem §7).

```text
Ví Học Viên                                    [Rút tiền] [+ Nạp tiền]
Số dư, sổ cái giao dịch và lịch sử nạp/rút

  1.240.000đ        300.000đ         1.540.000đ      ← 3 số dư, khả dụng to nhất
  SỐ DƯ KHẢ DỤNG    ĐANG CHỜ RÚT     TỔNG SỐ DƯ
  [dùng ngay]       [chờ Admin]     [tham khảo]

Sổ cái biến động số dư (128) │ Lịch sử nạp tiền │ Lịch sử rút tiền
───────────────────────────────────────────────────────────────────
│ Thời gian │ Loại │ Diễn giải │ Trước │ Biến động │ Sau     │
│ 22/09 14:02│ Nạp  │ Nạp tiền  │  0₫ │ +1.000.000₫ │ 1.000.000₫ │
│ 21/09 09:11│ Mua  │ Toán THCS │ 2,1tr│ −900.000₫ │ 1.200.000₫ │
```

- **3 số dư là chủ đạo**, `Sổ cái biến động số dư` là tab mặc định (giữ nguyên).
- Bỏ banner "Sổ cái bất biến" — thay bằng 1 dòng caption 12px dưới ledger strip. Đây là
  chân dung sàn, không phải dữ liệu; nằm giữa 2 khối số nó chen ngang.
- Cột "Biến động" là neo thị giác: `+`/`−` + màu semantic + **bold tabular**. Số dư trước/sau
  muted. Bỏ `font-mono` ở cột tiền (DESIGN.md §2.4: không mono cho tiền).
- Giữ nguyên mọi call site API, validation (nạp ≥10.000₫, rút ≥50.000₫, ≤ số dư),
  copy-transfer-reference, `hold` badge.
- Row hover đổi từ `/80` → `/60` (bớt gợi).

### 5.3 `/student/wallet/topup` + `/student/wallet/withdraw` (mới)

Lý do tách khỏi modal: nạp có 1 trường nhưng **rút có 5** (số tiền, ngân hàng, số tài khoản,
chủ tài khoản, ghi chú) + cảnh báo giữ tiền. Nhét vào modal làm nghẽn trên mobile — cùng lý do
đã chuyển tạo gói dịch vụ từ drawer sang wizard ở `/tutor/services/new`.

- Cùng khung trang card chuẩn, breadcrumb `Ví Học Viên / Nạp tiền`.
- Top-up: 6 preset + custom, min 10.000₫, nút primary đổi nhãn theo số tiền thật
  `Thanh toán 1.000.000 ₫ qua VNPay`.
- Withdraw: available balance strip ở đầu form, hint "tạm giữ (Reserved)" ngay dưới
  nút, disable submit khi vượt số dư với message cụ thể (không chỉ toast).
- Cùng `handleRequestTopUp` / `handleRequestWithdrawal` — chuyển nguyên vẹn sang trang.

### 5.4 `/student/enrollments/:id` — Hợp đồng học tập

```text
HỢP ĐỒNG #a1b2…            [Đang hiệu lực — Escrow đang khóa]
Toán THCS lớp 9 và 10
Gia sư phụ trách: Nguyễn Văn An

 1.800.000đ    15 buổi    12/15 hoàn thành    10% phí sàn     ← 4 số, phẳng
─────────────────────────────────────────────────────────────────
[████████████░░░░] 80%  Tiến độ hợp đồng

Lộ trình 15 buổi  (mỗi buổi một khoản ký quỹ riêng)
 ●  Buổi #1  21/09 19:30   120.000đ   [Đã hoàn thành]      [Chi tiết]
 ●  Buổi #2  22/09 19:30   120.000đ   [Đã hoàn thành]      [Chi tiết]
 ●  Buổi #3  23/09 19:30   120.000đ   [Đã xếp lịch]        [Chi tiết]
 ◐  Buổi #4  Chờ gia sư xếp lịch  120.000đ  [Chờ xếp lịch]  [Chi tiết] [Khiếu nại]
```

- **Sổ cái buổi học là phần lõi** → dạng dòng ledger: số thứ tự dạng spine màu trạng thái,
  thời gian tabular, ký quỹ buổi cột riêng căn phải, action cuối dòng. Giảm 3 lớp `flex` lồng
  nhau của hiện tại.
- `Tỷ lệ phí sàn` → `neutral` (xem §2.2).
- Hợp đồng `Active` không viền xanh; trạng thái nằm ở badge cạnh tiêu đề.
- Giữ nguyên: inline form xếp lịch của Tutor, 24h notice, review block + tutor reply,
  `getStatusBadge` (conflict > chờ điểm danh > trạng thái).
- `HỢP ĐỒNG #{full-uuid}` quá dài → rút gọn 8 ký tự đầu, copy được.

### 5.5 `/student/sessions/:id` — Buổi học

**Sửa B-1 trước.**

```text
● Buổi học #4 · Toán THCS                        [Chờ đối soát]
Nguyễn Văn An · 22/09 2026, 19:30 – 20:30
                                            Học phí buổi này
                                                 120.000 ₫

⏳ Cửa sổ đối soát 24h — hạn 23/09 19:30            ← holding, đặt TRƯỚC action
┌ ĐỐI SOÁT ĐIỂM DANH 2 CHIỀU ─────────────────────────────┐
│ Bạn: chưa xác nhận          Gia sư: chưa xác nhận        │
│ [ Xác nhận có mặt ]                                  │
└──────────────────────────────────────────────────────────┘
Nội dung: Nhật ký buổi học  (do gia sư ghi)
                                          [Đổi lịch]  [Hủy buổi học]
```

- Thứ tự mới: **identity → deadline banner → đối soát → nhật ký → action**.
  Hiện tại action nằm giữa card, đẩy khối đối soát xuống dưới — đúng thứ quan trọng nhất
  lại nằm dưới cùng.
- Action dồn xuống chân trang, luôn thấy, không chen giữa nội dung.
- "Hủy buổi học" = `danger-outline` (B-1). "Đổi lịch" (Tutor) = `outline`.
- Giữ nguyên: `useConfirm` + `requireReason` (min 5 ký tự), quy tắc 24h, refund copy,
  modal đổi lịch, form nhật ký (Tutor), `AttendanceCard` component.

### 5.6 `/student/disputes/new` — Mở khiếu nại

Hướng: **điềm tĩnh + thủ tục**. Hiện tại có 3 tín hiệu đỏ cùng lúc (radio đỏ, callout đỏ,
nút submit đỏ) → người dùng không biết cái nào quan trọng.

```text
Quay lại chi tiết buổi học
Mở đơn khiếu nại                                  [Tiền sẽ được giữ an toàn]
Mô tả điều xảy ra để Ban Trọng Tài có căn cứ đối soát.

┌ Buổi #4 · Toán THCS · 22/09 19:30 · Nguyễn Văn An │ 120.000₫ ┐
└────────────────────────────────────────────────────┴─────────┘

1 · Chọn lý do chính
  ( ) Gia sư vắng mặt không báo trước
  (•) Buổi học không trọn vẹn thời lượng            ← chọn = primary, KHÔNG đỏ
  ( ) Nội dung không đúng cam kết
  …

2 · Mô tả chi tiết                       ≥ 20 ký tự  (đếm trực tiếp)
3 · Bằng chứng (tùy chọn)   JPG PNG WEBP PDF TXT · ≤10 MB
───────────────────────────────────────────────────────────────
Khi gửi, 120.000 ₫ của buổi này được giữ trong Escrow và chỉ giải
ngân hoặc hoàn theo phán quyết của Ban Trọng Tài.        ← đỏ, đúng chỗ
[ Gửi đơn khiếu nại ]  [ Hủy ]
```

- **Đánh số 3 bước** — người dùng đang làm việc có hậu quả tài chính, đánh số giúp biết
  còn bao nhiêu. Không phải 1 form dài 7 lựa chọn.
- Radio **chưa chọn = trung tính**; đã chọn = `brand-primary` (chọn lý do không phải lỗi).
  Đỏ chỉ dành cho hậu quả tiền + nút submit.
- 7 lý do dạng **radio 1 cột có mô tả**, thay vì lưới 2 cột 7 ô nhìn như menu.
- Đếm ký tự trực tiếp cạnh label (`Field` chưa có counter → thêm vào form này bằng
  `aria-describedby` + `<p>`).
- Badge "Bảo chứng Escrow" ở header → dạng text 13px; badge làm loãng khi đã có callout
  giải thích ký quỹ ngay dưới.
- Giữ nguyên: `cannotDispute` 3 nhánh (tương lai/Unscheduled/Cancelled) + copy hướng dẫn
  đúng (hủy/dời lịch), MIME whitelist + giới hạn 10MB, tạo dispute rồi upload bằng chứng
  (bổ sung warning nếu upload lỗi), min 20 ký tự.

---

## 6. Component dùng chung (trích ra để tái dùng)

| Component | Dùng ở | Việc |
|---|---|---|
| `ledger/ActionQueue` | Dashboard, SessionDetail | Hàng việc chờ, sắp theo hạn chót, badge deadline |
| `ledger/LedgerStrip` | Cả 5 màn | Hàng số phẳng: value 28/700 tabular + label 13 |
| `ledger/SignedAmount` | Wallet, Enrollment | `+`/`−` + màu semantic + tabular |
| `ledger/LedgerTable` | Wallet (3 tab), Enrollment | `<table>` thật: `<caption>` ẩn, `scope="col"`, sticky header |
| `ledger/StateBadge` | Cả 5 màn | 1 nơi map status → Badge variant (đang rải 4 file) |

Nguyên tắc: `LedgerTable` thay `<div>` bảng tay ở Wallet (giữ nguyên look, thêm ngữ nghĩa
bảng + `overflow-x-auto` + mobile card fallback theo guideline "table → card").

---

## 7. Quyết định cần bạn duyệt (ngoài layout)

1. **Tách modal ví → 2 trang** `/student/wallet/topup` và `/withdraw`. Lý do: form rút có 5
   trường, modal hẹp trên mobile. Đồng bộ quyết định đã chuyển tạo gói dịch vụ ra wizard.
2. **Thêm variant `danger-outline`** vào `Button` thay vì hạ `Hủy buổi học` xuống
   `danger-ghost` — 2 call site cần viền đỏ + chữ đỏ.
3. **Action Queue** là thay đổi lớn nhất về hành vi: đưa việc chờ lên đầu trang thay vì
   4 stat card. Nếu bạn muốn giữ stat card làm hàng đầu, nói tôi giữ nguyên và chỉ thêm
   Action Queue bên dưới.
4. **`DESIGN.md` sửa Inter → Be Vietnam Pro** (bạn đã chốt) — tôi sửa luôn trong commit này.

---

## 8. Ghi chú triển khai (V1 — đã xong)

**Component mới:** `components/ledger/` — `LedgerStrip`, `ActionQueue`, `LedgerTable`, `SignedAmount`, `StateBadge`.

**Quyết định lệch so với SPEC (có lý do):**

1. **§2.1 ghi "page title 30/700"** nhưng type scale không có bậc 30px. Thay vì giữ
   `text-[30px]` rải rác ở 11 file (arbitrary value, trái tinh thần `DESIGN.md`), đã
   thêm token `headline-page: 30px / 1.2 / 700` vào `tailwind.config.js`.
2. **`animate-fade-in` không tồn tại** trong `tailwind.config.js` (token là
   `animate-fadeIn`) — 3 file admin dùng class chết, animation không chạy. Đã sửa.
3. **Icon `event_upcoming` không có trong `iconMap.js`** → im lặng fallback về
   `CircleHelp` trong form xếp lịch của Tutor. Đổi sang `event`.
4. **`EnrollmentDetail`: tổng học phí giữ neutral, không `holding`.** Chỉ *một phần*
   hợp đồng đang ký quỹ; tô `holding` cho toàn bộ tổng sẽ nói sai. Ở
   `StudentDashboard`, "Học phí trong Escrow" là số liệu thuần ký quỹ nên dùng `holding`
   — khác nhau có chủ đích.
5. **`SessionDetail`: bỏ `font-mono` trên số tiền trong dialog hoàn tiền.** Ràng buộc
   là giữ *nội dung copy* `INV-REFUND-004` nguyên vẹn, không phải giữ class; mono cho
   tiền vi phạm `DESIGN.md` §2.4 nên đã đổi sang `tabular-nums`.

**Bảng bug (đã sửa, verify live):**

| # | Trạng thái | Bằng chứng |
|---|---|---|
| B-1 | ✅ | Nút "Hủy buổi học này": `color rgb(185,28,28)`, `border rgba(239,68,68,.4)`, `bg trắng` — trước là primary xanh |
| B-2 | ✅ | `/student/wallet`: đúng 1 tab `aria-selected=true`, click đổi nội dung (trước: 3/3) |
| B-3 | ✅ | Form rút dùng `Select` chung, không còn `<select>` thô |

**Verify live** (tài khoản thật `student.tuan@tutorhub.com`): dashboard action queue +
ledger + rail; ví 3 tab; trang nạp/rút + validate + uppercase; hợp đồng (bảng 4 cột,
5 `th[scope=row]`, mã hợp đồng rút gọn 8 ký tự, phí sàn trung tính); buổi học (thứ tự
identity → deadline → đối soát → nhật ký → action, dialog hoàn tiền còn `INV-REFUND-004`
+ ô lý do); khiếu nại (3 bước, radio viền xanh không đỏ, đếm ký tự đỏ dưới 20).
Console 0 error 0 warning · eslint 0/0 trên toàn bộ file đã đụng · build pass.

**Còn nợ (xem §9).**

---

## 9. Acceptance criteria

- [x] B-1, B-2, B-3 đã sửa và verify live (`/tutor/schedule` chỉ 1 tab selected;
      click tab đổi nội dung; `Hủy buổi học` viền đỏ không phải xanh).
- [x] Action Queue chỉ hiện khi có việc; xếp đúng hạn chót tăng dần.
- [x] 3 số dư ví là chủ đạo, sổ cái là tab mặc định.
- [x] Mọi số tiền dùng `<Money>`; không `font-mono` cho tiền; mã GV/timestamp mới dùng mono.
- [x] Màu đỏ chỉ ở: xung đột, hủy, tranh chấp, hậu quả ký quỹ. Phí sàn → neutral.
- [x] Mỗi màn tối đa 1 CTA primary; không gradient; không hero.
- [x] Mọi mảng dùng scroll-friendly: bảng cuộn ngang có `overflow-x-auto`, mobile
      chuyển card.
- [x] `npx eslint` 0 error 0 warning trên toàn bộ file đã đụng · `npm run build` pass.
- [x] 5 màn verify live với tài khoản học viên thật (không mock).
- [x] Không đổi bất kỳ call site API nào; validation và copy quy định giữ nguyên.

---

## 9. Còn nợ (không thuộc V1)

- Không có API "việc cần tôi làm" → Action Queue tính từ dữ liệu đã có. Nếu muốn chính xác
  tuyệt đối cần endpoint `GET /students/me/action-queue`.
- Sổ cái ví chỉ tải trang 1 (15 dòng) → cần phân trang thật hoặc infinite scroll.
- Không có lịch sử khiếu nại của học viên → sau khi gửn, chỉ điều hướng về dashboard, không
  theo dõi được. Cần `GET /disputes/me`.
- Chưa có cổng VNPay thật (đang Sandbox) → copy ghi rõ Sandbox.
