# SPEC — Vùng Gia Sư (Tutor workspace)

> Trạng thái: SPEC v1.0 — **đã implement** (V1). Xem "Ghi chú triển khai" ở §7.
> Hướng thẩm mỹ: **Operational Ledger** (giữ nguyên như vùng Học viên).
> Phạm vi: 5 màn `/tutor/*` **chưa** làm. `TutorServices` + `ServiceCreateWizard` đã xong ở
> commit trước nên không nằm trong đợt này. Nhóm Shared (`Messages`, `Notifications`,
> `ProfileSettings`) viết SPEC riêng sau.
> Quyết định đã chốt (giữ nguyên từ vùng Student): scope theo vai trò · Operational Ledger ·
> Be Vietnam Pro · SPEC gộp rồi implement từng màn.
> Liên quan: `docs/student-workspace-spec.md` (đã implement — dùng làm mẫu),
> `DESIGN.md`, `docs/prd.md`.

---

## 1. Design brief

```
Purpose:    Biến việc dạy thành việc bán hàng: "buổi nào đang chờ tôi xếp lịch / xác nhận"
Audience:   Gia sư chính quyết kiếm, vào giữa buổi dạy và buổi tối
Tone:       Operational Ledger — tiền và lịch là hai sổ cái, luôn mở trước mắt
Reference:  Console vận hành: hàng việc chờ, sổ buổi học, sổ dòng tiền Escrow
Palette:    Token có sẵn. Màu = trạng thái (xem §2.2). Món ngon nhất: phí sàn = neutral
Type:       Be Vietnam Pro. Tiền qua <Money>. Số & giờ kỹ thuật qua tabular / mono
Memorable:  Action Queue dùng CHUNG khung với Học viên — cùng một component, hai vai
Restraint:  Không gradient, không hex thô, không pulse trên số tiền, 1 CTA primary/màn
```

**Quyết định quan trọng:** dùng lại **nguyên bộ `components/ledger/`** đã dựng cho vùng
Học viên. Không tạo kit mới cho Tutor. Hệ quả: Tutor và Student nhìn như hai mặt của
cùng một sàn, và `ActionQueue` chỉ có một cách render.

---

## 2. Token & màu (giữ nguyên §2 của SPEC Student)

Bề mặt / chữ / type / radius / shadow: **dùng y hệt** `docs/student-workspace-spec.md` §2.1.
Bổ sung quy tắc riêng cho Tutor:

| Màu | Tutor dùng cho | Không dùng cho |
|---|---|---|
| `holding` #D97706 | `pendingBalance` (tiền hợp đồng đang ký quỹ), buổi **chưa xếp lịch** | nút phụ |
| `success` #10B981 | `availableBalance` (đã đối soát, đã trừ phí sàn) | nút rút tiền, ký quỹ |
| `danger` #EF4444 | `heldBalance` khi **đang** có tranh chấp, sự cố điểm danh | nút chính khi chỉ chọn |
| `info` #3B82F6 | buổi đã xếp lịch, hồ sơ đang chờ duyệt | đã xong |

**Sửa luôn (cùng nguyên tắc §2.2 đã áp cho Student):**

1. **Nút rút tiền của Tutor hiện `variant="success"` (xanh lá)** ở `TutorDashboard`,
   `TutorWallet`, `TutorWithdraw`, và `Callout variant="success"` cho hạn mức rút.
   Rút tiền là **tiền ra**, không phải "đã quyết toán". → đổi `primary`.
2. **Phí sàn 10%** được in bằng `text-brand-primary-700` ở banner 3 bước Escrow — dùng
   màu CTA cho thông tin nền. → `text-fg-secondary`.
3. `TutorWallet` tô `border-emerald-500/80 bg-emerald-50/30` cho ô "Hạn mức được rút" →
   về token trung tính; số tiền là nhân vật chính, không cần viền đậm.
4. **`animate-pulse` vĩnh viễn trên ô "Phong tỏa tranh chấp"** khi có tiền bị giữ. Số tiền
   không nhấp nháy (SPEC Student §2.1: không animation trên số liệu tài chính). Bỏ hẳn;
   trạng thái đã nói bằng màu `danger` + nhãn.

---

## 3. Bug có sẵn phải sửa TRƯỚC khi thiết kế

| # | Vị trí | Vấn đề | Hậu quả |
|---|---|---|---|
| **B-4** | `TutorSchedule.jsx:254` | Truyền `action={<Button/>}` cho `EmptyState`, nhưng `EmptyState` chỉ nhận `actionLabel`/`actionPath`/`onAction` | **CTA "Xem N buổi cần xếp lịch" không bao giờ hiện.** Khi hết buổi sắp tới nhưng còn buổi chưa xếp, Tutor **không còn đường điều hướng** ra tab kia — kẹt cứng |
| **B-5** | `TutorSchedule.jsx:251,332` | `icon={<Icon …/>}` truyền **element** trong khi `EmptyState.icon` là **chuỗi** | `resolveIconName(element)` → fallback `CircleHelp`. Mọi EmptyState trên trang này hiện icon tròn hỏi |
| **B-6** | `TutorSchedule.jsx:296,303,332` | Icon `clock`, `user`, `checkCircle` **không có** trong `iconMap.js` | Im lặng fallback `CircleHelp` ở giờ học, tên học viên, empty state |
| **B-7** | `TutorSchedule.jsx:119,151` | `handleScheduleSingle` và `handleScheduleBatch` **không validate 24h**; chỉ dựa vào `min` của `datetime-local` (bypass được). `EnrollmentDetail` thì có validate | Xếp lịch vi phạm 24h chỉ bị backend từ chối, Tutor mất thời gian điền lại. Cũng là **thứ tự hợp đồng** (bất biến dự án) |
| **B-8** | `TutorApplication.jsx` | **201** chỗ dùng màu thô ngoài design system: `bg-[#2563EB]`, `ring-blue-100`, `bg-slate-200/80`, `text-slate-600`, `rounded-xl`, `text-[13.5px]`, `shadow-2xs`… | Trang này **trông như của sản phẩm khác** so với phần còn lại đã chuẩn hoá |

B-4 và B-5 đã đọc xác nhận từ chữ ký component `EmptyState`
(`src/frontend/src/components/common/EmptyState.jsx`); B-6 đã kiểm danh sách `iconMap.js`.

---

## 4. Đặc tả từng màn

### 4.1 `/tutor/dashboard` — Bảng điều hành

**Nguồn:** `walletService.getMyWallet()` · `sessionService.getMySessions()` ·
`tutorService.getMyTutorApplication()` (`.catch(() => null)`)

```text
Nguyễn Văn An                    [Đang xét duyệt]     [+ Tạo gói dịch vụ]
Bảng điều hành · lịch dạy · dòng tiền Escrow

┌ VIỆC ĐANG CHỜ BẠN ──────────────────────────────────────────┐
│ ⏳ Buổi #4 Toán THCS chưa có lịch      Hôm nay   [Xếp lịch] │ holding
│ ⏳ Buổi #5 Toán THCS chưa có lịch      Hôm nay   [Xếp lịch] │ holding
│ ●  Buổi #3 cần xác nhận điểm danh       còn 9h   [Xác nhận]  │ info
│ ⚠  Xung đột điểm danh buổi #2                          [Xem]  │ danger
└────────────────────────────────────────────────────────────────┘

  12 Học viên │ 1.800.000₫ ký quỹ │ 2.400.000₫ khả dụng │ 0/3 kỷ luật
```

- **Action Queue là phần lõi.** Thứ tự ưu tiên: (1) buổi chưa xếp lịch — **tiền hợp đồng
  đang ký quỹ mà học viên đang chờ**; (2) buổi đã diễn ra chưa xác nhận điểm danh, xếp
  theo `attendanceVerificationDueAt`; (3) xung đột điểm danh; (4) buổi sắp tới.
  Dùng `ActionQueue` của vùng Student — không viết lại.
- **Đã verify: `GET /sessions` trả về cả session `Unscheduled`** (kèm `enrollmentId`,
  `startAt: null`). Vì vậy Action Queue chỉ cần **1 request** — không cần gọi
  `getMyEnrollments` + `getEnrollmentById` như `TutorSchedule` đang làm (N+1 request cho
  mỗi enrollment). Lưu ý khi implement: đừng copy cách làm N+1 của `TutorSchedule`.
- Ba banner onboarding (chưa nộp / đang chờ / bị từ chối) giữ nguyên **nội dung**, nhưng
  dựng lại bằng token: `Callout`/`ActionQueue` thay vì `div` gradient + `bg-[#2563EB]`.
  Trạng thái hồ sơ dùng `StateBadge domain="application"` cần bổ sung vào `StateBadge.jsx`.
- Bỏ `StatCard` icon tròn → `LedgerStrip` 4 số.
- `variant="warning"` trên `Badge` là alias legacy → `holding`.
- **Google Meet:** `href="https://meet.google.com"` là **link chết chung cho mọi buổi**.
  Không giả vờ là tính năng. Đã verify `SessionDto` **không có** `meetingUrl` → ẩn hẳn
  nút cho tới khi backend có trường đó (xem §8).
- Bỏ khối "Thao tác nhanh" — trùng lặp sidebar đã có 6 mục. Thay bằng rail "Buổi dạy tới"
  như vùng Student.

### 4.2 `/tutor/schedule` — Lịch dạy (sửa B-4..B-7)

```text
Lịch dạy
Xếp lịch buổi dạy · quy tắc báo trước tối thiểu 24 giờ

Lịch dạy sắp tới (3)          Cần xếp lịch (2)
──────────────────────────────────────────────────────────────
● Toán THCS · #3   22/09 19:30   Học viên Phạm Minh Tuấn   120.000₫  [Chi tiết]
● Toán THCS · #4   25/09 19:30   Học viên Nguyễn Thị Lan   120.000₫  [Chi tiết]
```

- `h1` → `text-headline-page text-fg` (đang là 24px `text-gray-900`).
- **Toàn bộ 23 màu thô → token**: `bg-white`→`bg-surface`, `border-gray-200`→`border-border`,
  `rounded-xl`→`rounded-brand-lg`, `bg-blue-50/text-blue-600/border-blue-100`→
  `bg-brand-primary-50/text-brand-primary-600/border-brand-primary-100`,
  `bg-amber-50/border-amber-200/text-amber-800`→`bg-holding-subtle/border-holding/30/text-holding-strong`,
  `text-green-500`→`text-success`, `ring-blue-500`→`ring-brand-primary-600`,
  `text-gray-*`→`text-fg*`.
- Icon: `clock`→`timer`, `user`→`person`, `checkCircle`→`check_circle` (đều có trong `iconMap`).
- `EmptyState`: `icon` nhận **chuỗi**; CTA dùng `actionLabel` + `onAction` (giữ hành vi
  chuyển sang tab `unscheduled`) — vá B-4.
- `getSessionStatusMeta` + `Badge` → `StateBadge domain="session"`.
- **B-7: thêm validate 24h vào cả `handleScheduleSingle` và `handleScheduleBatch`**,
  dùng chung một helper `assertMinNotice(startAt)` (đã có logic tương tự ở
  `EnrollmentDetail` và `SessionDetail`). Báo `toast.error` tiếng Việt, giống hệt.
- Giữ nguyên: URL-driven tab qua `useSearchParams`, batch `scheduleSessionsBatch`,
  tính `calculatedEnd` hiển thị, `filledCount`, `Xếp tất cả (n)`, copy quy tắc 24h.
- Batch: thêm `aria-live` nhẹ trên `filledCount` để đọc bằng màn hình biết nút bật/tắt.

### 4.3 `/tutor/wallet` — Ví bảo chứng

```text
Trung tâm tài chính
Sổ dòng tiền Escrow và hạn mức rút (DEC-WD-001)

  1.800.000₫        2.400.000₫       0₫            2.400.000₫
  KÝ QUỸ CHỜ        KHẢ DỤNG         PHONG TỎA      ĐƯỢC RÚT
  (holding)          (success)        (danger nếu>0) (mặc định)
  ────────────────────────────────────────────────────────────────
  Hạn mức được rút = Khả dụng 2.400.000 ₫ − Phong tỏa 0 ₫ = 2.400.000 ₫
```

- Bỏ tiền tố `1. 2. 3. 4.` trong nhãn — vô nghĩa với người dùng.
- 4 ô `StatCard` → `LedgerStrip`. Bỏ `animate-pulse`, bỏ viền emerald thủ công (§2).
- Công thức hạn mức nổi thành **1 dòng phương trình** ngay dưới strip, tabular, thay vì
  nhét dài gói trong `hint` của StatCard (hiện tại bị bó/khó đọc).
- Banner 3 bước Escrow: giữ nội dung, làm thành **3 bước ngang có spine** gọn hơn
  (bỏ 3 hộp `bg-neutral-50` lồng nhau). Sửa màu chữ bước 3.
- Bảng lệnh rút → `LedgerTable` + `StateBadge domain="withdrawal"` + `SignedAmount`.
  Cột "Số tiền rút" dùng `SignedAmount direction="Debit"`.
- Nút rút: `variant="success"` → `primary`. Giữ nguyên nhánh disabled với `title` giải thích.
- Giữ nguyên `DEC-WD-001` (withdrawable = available − held), ngưỡng 50.000 ₫, copy quy tắc.

### 4.4 `/tutor/wallet/withdraw` — Yêu cầu rút

- Nút submit `variant="success"` → **`primary`**; `Callout variant="success"` cho hạn mức
  → Callout trung tính có nhãn "Hạn mức được rút hiện tại".
- **Thêm dòng báo lý do chặn** (giống trang rút của Học viên): dưới 50.000 ₫ / vượt hạn
  mức / chưa có tài khoản KYC. Disable submit kèm message cụ thể, không chỉ toast.
- `getWithdrawalStatusMeta` + `Badge` → `StateBadge domain="withdrawal"`.
- Giữ nguyên: mặc định số tiền = `min(withdrawableBalance, 500.000)`,
  fallback `bankName || 'Ngân Hàng'` / `bankCode || 'BANK'`, copy "Rút thù lao giảng dạy",
  `STK:` line **có `font-mono` là đúng** (đó là định danh tài khoản — giữ nguyên),
  mã lệnh `w.id.slice(0,8)` mono, badge "Đã xác thực KYC", `navigate('/tutor/wallet')`.
- Danh sách "Lệnh rút gần đây" giữ dạng list, chuyển sang `StateBadge`.

### 4.5 `/tutor/application` — Hồ sơ gia sư (1345 dòng)

Cùng cách đã làm thành công cho `ServiceDrawer`: **tách phần, giữ nguyên UI nghiệp vụ.**

```text
components/tutor/application/
  applicationFormUtils.js   validate từng bước + build payload (1 nơi duy nhất)
  ApplicationSteps.jsx      6 step body components
  ApplicationStepper.jsx    stepper dọc (thay rail inline)
TutorApplication.jsx        điều phối: state, gọi API, điều hướng bước
```

- **B-8: 201 màu thô → token.** Bảng ánh xạ chính:
  `bg-[#2563EB]`→`bg-brand-primary-600` · `text-[#2563EB]`→`text-brand-primary-700` ·
  `ring-blue-100`→`ring-brand-primary-100` · `bg-blue-50/80 border-blue-100`→
  `bg-brand-primary-50 border-brand-primary-100` · `bg-slate-200/80`→`bg-border` ·
  `bg-slate-100/60`→`bg-neutral-100` · `text-slate-800`→`text-fg` ·
  `text-slate-600`→`text-fg-secondary` · `text-slate-400`→`text-fg-muted` ·
  `border-slate-200`→`border-border` · `rounded-xl`→`rounded-brand-lg` ·
  `rounded-2xl`→`rounded-brand-lg` · `shadow-2xs`→`shadow-brand-sm` ·
  `text-[13.5px]`→`text-caption` · `text-[11.5px]`→`text-[11px]` (đã có token 11px dùng chung).
- `bg-white`→`bg-surface`. Bỏ mọi `bg-gradient-*` (không có token gradient nào được phép).
- Bố cục 2 cột (stepper dọc + step body) giữ nguyên; stepper dùng `brand-*` token,
  ẩn `sub` ở `< lg` (hiện chật trên mobile).
- **Không đổi:** 6 `STEPS`, `POPULAR_SUBJECTS`, `GRADE_LEVELS`, mọi `tutorService` call
  (`getMyTutorApplication` / `submitApplication` / resubmit), upload bằng chứng (drag &
  drop + input ref), validation hiện có, điều kiện click step (chỉ bước đã xong hoặc bước 1),
  copy hướng dẫn và thông báo lỗi.

---

## 5. Component dùng chung (tái sử dụng, không viết mới)

| Component | Nguồn | Dùng ở |
|---|---|---|
| `ledger/ActionQueue` | vùng Student | Dashboard |
| `ledger/LedgerStrip` | vùng Student | Dashboard, Wallet |
| `ledger/LedgerTable` | vùng Student | Wallet |
| `ledger/SignedAmount` | vùng Student | Wallet |
| `ledger/StateBadge` | vùng Student | Schedule, Wallet, Withdraw, Dashboard |

**Mở rộng duy nhất:** thêm domain `application` vào `StateBadge.jsx`
(`getTutorApplicationStatusMeta` đã có sẵn trong `config/enums.js` — chỉ cần nối vào).

---

## 6. Quyết định cần bạn duyệt

1. **Đổi nút rút tiền từ xanh `success` sang `primary`.** Rút tiền là tiền ra; xanh lá đang
   báo "đã quyết toán". Đây là thay đổi thị giác trên 3 màn.
2. **Ẩn nút Google Meet thay vì giữ link chết.** Link `https://meet.google.com` không dẫn
   tới phòng học cụ thể nào. Nếu bạn muốn giữ tạm, nói tôi đổi thành `outline` + tiêu đề
   ghi rõ "tính năng đang phát triển".
3. **Bỏ khối "Thao tác nhanh"** ở dashboard vì trùng sidebar 6 mục.
4. **B-7: thêm validate 24h client-side** cho cả 2 luồng xếp lịch của Tutor — hiện chỉ
   backend chặn. Đây là bất biến dự án nên tôi coi là sửa bug, không phải đổi hành vi.

---

## 7. Ghi chú triển khai (V1 — đã xong)

**Component mới** (`components/tutor/application/`): `applicationFormUtils.js` (20 export) ·
`ApplicationSteps.jsx` (6 step) · `ApplicationStepper.jsx`. `TutorApplication.jsx`
**1454 → 528 dòng**, **201 → 0** màu thô, **53 → 0** warning.

**Quyết định lệch so với SPEC (có lý do):**

1. **SPEC nói "không sửa API call"; `TutorSchedule` gọi `getEnrollmentById` cho *mọi*
   hợp đồng `Active` rồi mới lọc** (N+1). Đã thu hẹp: chỉ mở chi tiết cho hợp đồng
   thực sự có buổi `Unscheduled` (lấy từ `GET /sessions`). **Cùng endpoint, ít hơn
   request, kết quả render y hệt.**
2. **`SessionCalendarDto` không có field điểm danh.** Đã verify:
   `GET /sessions` trả `SessionCalendarDto` — thiếu `attendanceVerificationDueAt`,
   `studentAttendance`, `tutorAttendance`, `hasAttendanceConflict`; những field này
   chỉ có ở `GET /sessions/{id}`. Nếu chỉ dựa vào danh sách calendar thì nhánh
   "cần đối soát / xung đột điểm danh" của action queue **không bao giờ chạy** — kể
   cả ở dashboard Học viên. Đã sửa bằng cách chỉ hydrate các buổi *đã kết thúc*
   (thường 0–3) qua `getSessionById`. Sau khi hydrate, dashboard Tutor hiện đủ 5 nhóm
   việc chờ. **Còn nợ: thêm 4 field này vào `SessionCalendarDto`** để bỏ được N call.
3. **`ActionQueue` thêm prop `priority`.** Sắp xếp cũ chỉ theo `deadlineAt`, mà buổi
   `Unscheduled` có `startAt: null` nên không có deadline → bị đẩy xuống cuối, ngược
   ý SPEC (học viên đang chờ thì phải lên trước). `priority` (nhỏ hơn = trước) thắng
   `deadlineAt`.
4. **H1 của `/tutor/application` là 28px (`headline-1`), không phải 30px.** Đây là
   trạng thái chờ duyệt, không phải wizard; wizard dùng `headline-page`.

**Bảng bug (đã sửa):**

| # | Trạng thái | Bằng chứng |
|---|---|---|
| B-4 | ✅ | `EmptyState` nhận `icon` chuỗi + `actionLabel`/`onAction`; 0 `CircleHelp` trên `/tutor/schedule` |
| B-5 | ✅ | Như trên |
| B-6 | ✅ | `timer` / `person` / `check_circle` đều có trong `iconMap.js` |
| B-7 | ✅ | Chọn lịch 2 giờ sau → toast "Lịch mới phải được xếp trước giờ bắt đầu ít nhất 24 giờ", **0 API call** (đã chặn network để đo) |
| B-8 | ✅ | grep màu thô: **0** trên cả 4 file |

**Verify live** (`tutor.an@tutorhub.com` + `tutor.ha@tutorhub.com`):
dashboard có **5 nhóm việc chờ** đúng thứ tự ưu tiên (chưa xếp lịch → đối soát →
xung đột → buổi tới), h1 30px, 0 gradient, 0 hex, không còn link Meet / "Thao tác
nhanh" · lịch dạy: h1 30px, đúng 1 tab selected, 3 dòng, quy tắc 24h render đúng
màu `holding` · ví: 4 số không tiền tố, dòng phương trình `DEC-WD-001`, bảng có
`<caption>`, nút rút **xanh primary** không còn xanh lá · rút: nút primary, blocker
inline · hồ sơ: trạng thái Approved và Pending đều **0 màu thô**; stepper + 6 step +
20 helper đã wiring đầy đủ.
Console 0 error · eslint 0/0 trên mọi file đã đụng · build pass.

**Chưa verify được:** wizard 6 bước không render với tài khoản seed nào (5 Approved,
1 Pending). Cần một tài khoản Tutor **chưa nộp hồ sơ** để chạy thật; chưa tự tạo vì
sẽ thêm dữ liệu vào DB seed.

**Ngoài phạm vi, đã phát hiện:** ~130 chỗ `text-[#2563EB]` + hàng chục màu thô nằm ở
trang **public** (`PublicTopbar`, `PublicFooter`, `ServiceHeroSection`, `Login`,
`Register`, `FilterSidebar`…). `/tutor/application` nằm trong `PublicLayout` nên
vẫn thấy chúng. Đó là nợ riêng của vùng public, không phải vùng Tutor.

---

## 8. Acceptance criteria

- [x] B-4 → `EmptyState` nhận chuỗi + CTA qua `actionLabel`/`onAction`.
- [x] B-5 → 0 `CircleHelp` trên `/tutor/schedule`.
- [x] B-6 → icon thay bằng bản có thật trong `iconMap.js`.
- [x] B-7 → chọn lịch dưới 24h ra toast tiếng Việt, **0 API call** (đã chặn network để đo).
- [x] B-8 → grep còn **0** màu thô / hex / gradient trong 5 file `/tutor/*` này.
- [x] Action Queue dùng chung component với Học viên, thứ tự ưu tiên đúng §4.1.
- [x] `LedgerStrip` 4 số, bỏ số thứ tự 1–4, bỏ `animate-pulse` trên số tiền.
- [x] Không có `variant="success"` cho hành động rút tiền; phí sàn không dùng màu CTA.
- [x] Mọi số tiền qua `<Money>`; mono chỉ cho mã lệnh / số tài khoản / timestamp.
- [x] `TutorApplication` tách section, file chính **1454 → 528 dòng**.
- [x] `npx eslint` 0 error 0 warning trên mọi file đã đụng · `npm run build` pass.
- [x] Verify live bằng tài khoản gia sư thật, không mock.
- [x] Không đổi call site API; validation và copy quy định giữ nguyên.

---

## 8. Còn nợ (không thuộc V1)

- `SessionDto.meetingUrl` chưa tồn tại → sau khi có mới bật được nút "Mở phòng học".
- Lịch sử lệnh rút chỉ tải 15 bản ghi, chưa có phân trang.
- Không có API "việc chờ tôi" → Action Queue suy ra từ dữ liệu hiện có, giống vùng Student.
- `AdminTutorApplications` còn 170 chỗ màu thô — thuộc vùng Admin, chưa vào scope.
