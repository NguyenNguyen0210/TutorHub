# Roadmap UI/UX — TutorHub Frontend (Execution Roadmap)

**Phạm vi:** `TutorHub-frontend/src/frontend` (React 18 + Vite 5 + AntD v5 + Tailwind 3.4, JavaScript thuần — không TypeScript)
**Nguồn chuẩn thiết kế:** `../DESIGN.md` (§2 tokens, §3 signature components, §4.1 responsive, §5 motion/loading, §6 checklist)
**Nguồn rà soát:** `../UI-AUDIT.md` (audit UI/UX), `../PROJECT-REVIEW.md` (review toàn dự án), `../docs/frontend-specification.md`
**Trạng thái:** đang thực thi — P0 hoàn tất, P1 là bước tiếp theo

> Tài liệu này là roadmap **thực thi**: mỗi phase là một đơn vị commit độc lập, có acceptance đo được và bảng truy vết tới từng phát hiện của audit.

---

## 1. Mục tiêu & tiêu chí nghiệm thu

**Mục tiêu:** đưa `src/frontend` từ *prototype tĩnh chất lượng cao* thành **ứng dụng thật**: mọi màn hình liên quan tiền tệ chỉ hiển thị kết quả mà backend đã xác nhận, đúng `DESIGN.md`, có đầy đủ trạng thái loading/empty/error, dùng được bằng bàn phím, và design token được định nghĩa thật.

**Tiêu chí nghiệm thu toàn roadmap:**

| # | Tiêu chí | Cách đo |
|---|---|---|
| 1 | Build + lint sạch | `npm run build` pass; `npm run lint` **0 error** |
| 2 | 3 luồng E2E chạy với API local | checklist §8 (dùng dev simulator) |
| 3 | Không còn khẳng định tài chính sai | grep: literal `vnp_ResponseCode=00` sinh ở client = 0; không có `setTimeout(…message.success)` cho money action |
| 4 | API layer nhất quán | grep `res\.data` sau khi `api.js` đã bóc envelope = **0** |
| 5 | Responsive đúng §4.1 | 360 / 768 / 1024 / 1440 / 2560; Admin có nav dưới 1024px |
| 6 | A11y | `jsx-a11y` = 0 error; đi hết luồng chính chỉ bằng bàn phím; contrast chữ tiền ≥ 4.5:1 |

---

## 2. Hiện trạng đã xác minh (ground truth)

### 2.1 Backend đã được hợp nhất vào nhánh frontend (P0 prerequisite — xong)

| Hạng mục | Sự thật |
|---|---|
| Merge | `379579a` — `refactor/application-boundaries` → `feature/frontend-client` (27 commit backend), **không conflict**, đã push |
| Lý do | Nhánh FE trước đó đứng ở merge-base `4a9429c`: backend cũ, **không có CORS**, `appsettings.Development.json` còn secret `super_secret_…` |
| Sau merge | CORS có (`Program.cs`), `Jwt.Secret = ""`, compose fail-closed (`${Jwt__Secret}`, `ASPNETCORE_ENVIRONMENT:-Production`), có health checks + dev simulator + `docs/openapi.json` + `scripts/dev-bootstrap.ps1` |
| Kiểm chứng | Build **0 warning / 0 error**; **571/571 test xanh**; `/health` = Healthy (database + platform-fee-setting 0.10/policy v2) |

### 2.2 Frontend

| Hạng mục | Số liệu / bằng chứng |
|---|---|
| Quy mô | 23 page, 5 layout, 12 service, 13 component, 1 util, 3 thư mục rỗng (`hooks/`, `contexts/`, `assets/`) |
| Nối API thật | **3/23** page (Login, Register, DisputeNew) |
| Gọi API nhưng luôn rơi về mock | **3** (Marketplace, TutorProfile, BookingCheckout) do **double-unwrap `res.data`** ở **13 call site** — `services/api.js:56-58` đã bóc envelope |
| Tĩnh / no-op | **13 tĩnh** + **4 stub** chỉ bắn toast (TutorApplication, TutorAvailability, TutorServices, TutorWithdraw) |
| Component chết | **9/13**; §3 signature: 3 file tồn tại (**đều dead**), **4 chưa có file** (chỉ inline JSX) |
| Service chết | **7/11** module không được import |
| Trạng thái | **0 Skeleton, 0 Empty, 0 error UI**; `@tanstack/react-query` provider-only (**0 `useQuery`**); `@microsoft/signalr` chỉ xuất hiện trong comment |
| Khẳng định tiền tệ sai | Checkout gọi `paymentService.createPaymentUrl` **không tồn tại** → catch → tự điều hướng "thành công" với `vnp_ResponseCode=00`; `PaymentReturn` mặc định `'00'` + 2.000.000 ₫; `AttendanceCard` tự set `tutorChoice=true` ⇒ 1 click "giải ngân"; admin no-op toast "tiền đã ra khỏi Escrow" |
| Timezone | Không có chuyển đổi `Asia/Ho_Chi_Minh` (chưa cài plugin `dayjs/utc|timezone`) — vi phạm luật #5 `CLAUDE.md` |
| Tooling | `dev`/`build`/`preview` (Vite 5173); **lint đã thêm ở P0**, chưa có test framework |
| Lint baseline (P0) | Trước: **142 vấn đề (4 error, 138 warning)** / 66 file. Sau P0: **0 error, 138 warning** — backlog chia theo phase bên dưới |

**Backlog lint 138 warning** (đo bằng `npm run lint -f json`): `no-unused-vars` **47** (→ P9), `jsx-a11y/label-has-for` **28** + `label-has-associated-control` **25** + `control-has-associated-label` **23** + `anchor-is-valid` **5** + `no-static-element-interactions` **4** + `click-events-have-key-events` **4** (→ P7), `react-hooks/exhaustive-deps` **2** (→ P4/P5).

### 2.3 Lệch hợp đồng frontend ↔ backend (đã xác minh trong code cả hai phía)

| Mã | Vấn đề | Hướng sửa |
|---|---|---|
| F1 | Double-unwrap `res.data` (13 chỗ) | Frontend |
| F2 | Mark-as-read dùng `POST`; backend là **`PATCH /notifications/{id}/read`** và `PATCH /notifications/read-all` → 405 | Frontend |
| F3 | `GET /sessions/{id}` **không tồn tại** ở backend | **Backend (thêm mới)** |
| F4 | Body phân xử gửi `{verdictType, notes}`; backend cần `Decision`/`CustomRefundAmount`/`AdminNotes` → 400 | Frontend |
| F5 | `TutorCard` đọc `rating`/`isVerified`/`minPrice`; `TutorSummaryDto` có `RatingAvg`/`TotalReviews`, **thiếu** `MinPrice`/`IsVerified`; `rating: null` ⇒ crash `toFixed` | Cả hai |
| F6 | Audit log UI hiển thị "hash kiểm toán" bịa; DTO có `UserName`/`Action`/`OldValuesJson`/`NewValuesJson`, **không có** hash | Frontend (bỏ hash giả) |
| F7a | Availability đọc `res.slots`; backend trả `Days` | Frontend |
| F7b | Admin stats phẳng; backend `AdminDashboardStatsDto` lồng (`Users/Tutors/Bookings/Financials/ActionQueue`) | Frontend |
| F7c | `u.absentStrikes` không có trên `AdminUserSummaryDto` | **Backend (thêm field)** |
| F7d | `tutorName/fullName/avatarUrl` vs `User*` | Frontend |
| F7e | `TutorProfile.jsx:111` truyền object; `booking.service.js:10` cần `serviceId` (Guid) | Frontend |
| F7f | `'PENDING_VERIFICATION'` không tồn tại; enum thật `Unscheduled/Scheduled/Completed/Cancelled` | Frontend |

---

## 3. Chiến lược nhánh & runtime

| Việc | Nơi | Nhánh |
|---|---|---|
| Roadmap + toàn bộ code UI/UX | worktree `TutorHub-frontend` → `src/frontend` | `feature/frontend-client` |
| Bổ sung backend mà UI cần | worktree `TutorHub` → `src/backend` | `refactor/application-boundaries` |

- **Runtime dev:** API Development ở `http://localhost:5129` (`.env` mỗi worktree là file local riêng; đã tạo `.env` cho worktree FE). Postgres 17 ở `localhost:5432`.
- **Hoàn tất thanh toán ở local:** `POST /api/v1/dev/payments/simulate-ipn { bookingId, success: true }` (chỉ tồn tại ở Development, đã có test E2E).
- **Quy trình:** mỗi phase một commit Conventional Commits (`feat(ui)`, `fix(ui)`, `refactor(ui)`, `chore(ui)`, `docs(ui)`); backend sửa trên nhánh backend rồi merge sang nhánh FE khi cần; push cuối roadmap.

---

## 4. Decision log

1. **Mock policy:** bỏ fallback mock ngầm (`catch { return MOCK_* }`). Dual-mode chỉ khi `VITE_USE_MOCK=true` (mặc định false) và **cấm** cho luồng tài chính/admin; service lỗi ⇒ `throw`.
2. **Error contract:** `api.js` reject `{ status, code, message, errors[], traceId }`; bóc `data` **một lần duy nhất**.
3. **Data fetching:** dùng **TanStack Query** (`useQuery`/`useMutation`) cho dữ liệu trang; Zustand chỉ giữ auth/session.
4. **Enum:** một bảng map duy nhất theo giá trị backend (`Active/Suspended/Banned`, `Unscheduled/Scheduled/Completed/Cancelled`).
5. **Timezone:** `dayjs/plugin/utc` + `timezone`; mọi mốc thời gian qua `formatDateTimeVN()`; AvailabilitySlot đối chiếu giờ VN.
6. **Signature components:** §3 component phải được **nối vào màn hình thật**; 4 component thiếu viết mới, nhận dữ liệu API.
7. **A11y tooling:** eslint + `jsx-a11y` (bắt đầu ở mức **warn** để đo backlog, **P7 nâng thành error**). Vitest/Playwright ngoài phạm vi.
8. **Dead code:** sau khi nối, service/component/dependency không consumer ⇒ xoá.
9. **Không sáng tạo dữ liệu:** bỏ placeholder bịa (`0 Vi Phạm (Uy Tín 100%)`, `Ledger Synchronized`, `1.248`, `4 bản ghi`).
10. **Tiền:** lấy từ snapshot backend, không `Math.round(price / totalSessions)` ở client.

---

## 5. Các phase

| # | Phase | Trạng thái | Nội dung chính | Acceptance |
|---|---|---|---|---|
| **P0** | Baseline & guardrail | ✅ **xong** (`a69d281`) | `eslint.config.js` + `eslint@9` + `jsx-a11y` + `react-hooks` + script `lint`; sửa 4 error `react/no-unescaped-entities`; `public/favicon.svg` + `index.html`; commit `UI-AUDIT.md` + `PROJECT-REVIEW.md`; tài liệu này | `npm run build` pass; `npm run lint` **0 error** (138 warning = backlog) |
| **P1** | API contract + backend gaps | ✅ **xong** (`f4b0ad2`, `5867c2b`, `108c923`, merge `4f3bb42`) | `api.js` error object + 1 lần bóc; xoá 13 double-unwrap; PATCH notifications; map field/enum theo §2.3; bỏ mock ngầm. **Backend:** `GET /sessions/{id}` (+`AttendanceVerificationDueAt`), `TutorSummaryDto.MinPrice/IsVerified`, `AdminUserSummaryDto.AbsentStrikes` | API local: Marketplace/TutorProfile/AdminUsers/wallet/notifications hiện **dữ liệu thật**; `grep res\.data` = 0 |
| **P2** | **Sự thật tiền tệ** | ✅ **xong** (`0e7a69d`) | Checkout gọi `createVnPayUrl` + lỗi thật + retry + nút dev "Giả lập thanh toán" (`VITE_DEV_PAYMENT_SIMULATOR`); PaymentReturn lấy kết quả **từ server**, không param ⇒ "không tìm thấy giao dịch"; AttendanceCard chỉ đọc `tutorAttendance` từ server; SessionDetail gắn `onClick` gọi `submitAttendance`; AdminDisputeDetail gọi service + `Modal.confirm` + bắt buộc nhập lý do; DisputeNew surface lỗi thật; AdminUsers map enum | Không còn `vnp_ResponseCode=00` sinh ở client; money action chỉ toast sau khi promise resolve |
| **P3** | DESIGN §3.1 + §4.1 | ✅ **xong** (`a910bdc`) | Countdown: deadline từ `holdingExpiresAt`, re-sync `visibilitychange`, 3 urgency state, hết hạn ⇒ `disabled` + `00:00` + nút "Tạo lại đơn hàng"; shell: sidebar 260px ≥1024, rail 768–1023, dock <640 + `pb-24`, admin nav <1024, container trong `PublicLayout` | Countdown khớp booking; hết hạn khoá CTA; admin vào được 4 route trên mobile |
| **P4** | State infrastructure | ✅ **xong** (`aca45a4`) | `Skeleton`/`EmptyState`/`ErrorState`+retry/`AsyncBoundary`; adopt TanStack Query; typed error → UX | Không còn `return null` khi loading; lỗi ⇒ error UI + retry (không mock) |
| **P5** | Nối Student + Tutor | ✅ **xong** (`0e0196a`) | StudentDashboard, EnrollmentDetail (§3.5), SessionDetail (§3.2 + countdown 24h), TutorDashboard, TutorAvailability, TutorServices, TutorWallet (§3.3 + `Withdrawable=Available−Held`), TutorWithdraw (gate 50.000), TutorApplication wizard | 8 màn chỉ render dữ liệu API; ví khớp DEC-WD-001 |
| **P6** | Nối Shared + Admin | ✅ **xong** (`f75a3bf`) | Messages (+SignalR), Notifications (PATCH + badge realtime), AdminDashboard (KPI thật), AdminTutorApplications, AdminUsers (strike tracker), AdminAuditLogs (search + diff, **bỏ hash giả**), AdminDisputeDetail (§3.7 + DEC-S8-025 + gate DEC-S8-028) | Realtime chạy; audit log tìm/diff được; calculator không cho clawback vượt số thực nhận |
| **P7** | Accessibility | ✅ **xong** (`2136c3b`) | Xử lý 89 warning a11y (label/control/anchor/keyboard), `htmlFor`/`id`, `aria-label` icon-only, `aria-live`, `Modal.confirm` cho hành động tiền bất khả hoàn, token `financial-available-strong`, tap target ≥44px, `:focus-visible`; **nâng jsx-a11y lên error** | `npm run lint` 0 error với a11y = error; luồng chính chạy được chỉ bằng bàn phím |
| **P8** | Tokens & design system | ✅ **xong** (`c057449`) | `borderRadius` scale (6/10/16/24), `.glass-surface`, `animate-fadeIn`, keyframe `shake` + `prefers-reduced-motion`, `outline-hidden`→`outline-none` (16 chỗ), `text-[10px]`→`caption`, bỏ `darkMode` chết | Không còn class không tồn tại trong Tailwind 3.4 |
| **P9** | Copy, dữ liệu & dead code | ✅ **xong** (`f677b35`) | 47 `no-unused-vars`; xoá 7 service + component chết; bỏ jargon (`Smart Escrow Protocol`, `Trọng tài DEC-S8`, `Stitch ID`); sửa dấu 404/RouteGuards; link `#`; `ProRataRefundModal` theo `INV-REFUND-004`; tiền per-session từ snapshot | Grep jargon = 0; dead code đã xoá; 0 error 0 warning trên toàn project |
| **P10** | Quality gate & Final push | ⏳ **đang chốt** | 3 luồng E2E + responsive matrix; `build` + `lint`; push cả hai worktree lên remote | Checklist §8 pass; code và tài liệu đồng bộ |

---

## 6. Bảng truy vết (audit → phase)

| Nguồn | Mã | Phase |
|---|---|---|
| UI-AUDIT §3 | P0-1, P0-2, P0-3 (checkout/return) | P2 |
| UI-AUDIT §3 | P0-4 (điểm danh), P0-6 (dispute), P0-8 (nút không handler) | P2 |
| UI-AUDIT §3 | P0-5 (admin no-op), P0-7 (badge user) | P2 |
| UI-AUDIT §4 | P1-1 (8/9 signature dead) | P5/P6/P9 |
| UI-AUDIT §4 | P1-2 (§3.1 countdown) | P3 |
| UI-AUDIT §4 | P1-3 (§4.1 shell), P1-4 (dock che nội dung) | P3 |
| UI-AUDIT §4 | P1-5 (skeleton/empty/error) | P4 |
| UI-AUDIT §4 | P1-6 (timezone) | P4/P5 |
| UI-AUDIT §4 | P1-7 (reduced-motion, shake) | P8 |
| UI-AUDIT §4 | P1-8 (§3.3/§3.7 thiếu điều kiện, DEC-S8-028) | P5/P6 |
| UI-AUDIT §5 | P2 toàn bộ (a11y) | P7 |
| UI-AUDIT §6 | P3 toàn bộ (token, copy, dead code) | P8/P9 |
| PROJECT-REVIEW §4 | F1, F2, F4, F5, F6, F7a, F7b, F7d, F7e, F7f | P1 |
| PROJECT-REVIEW §4 | F3, F7c | P1 (backend) |
| PROJECT-REVIEW §5 | S1 (secret) | ✅ đã xử lý bằng merge (cấu hình fail-closed); secret cũ trong history ⇒ **rotate** |
| PROJECT-REVIEW §5 | S2, S3, S4, S5, S7, S8, S9 | Ngoài phạm vi roadmap này (đợt hardening backend riêng) |
| PROJECT-REVIEW §5 | S6 (refresh token trong `localStorage`) | P4 (chuyển sang lưu trong memory + refresh qua httpOnly nếu backend hỗ trợ; tối thiểu là ghi nhận rủi ro) |

---

## 7. Thay đổi backend kèm theo (nhánh `refactor/application-boundaries`)

1. `GET /api/v1/sessions/{id}` — query + endpoint thin controller, trả `SessionDto` (bổ sung `AttendanceVerificationDueAt`), authorize student/tutor sở hữu hoặc Admin.
2. `TutorSummaryDto` + `MinPrice` (giá gói published rẻ nhất) + `IsVerified`.
3. `AdminUserSummaryDto` + `AbsentStrikes`.
4. Không cần đổi backend cho: PATCH mark-as-read (đã đúng), body phân xử (UI align), audit log hash (UI bỏ hash giả).
5. Mỗi thay đổi: giữ **0 warning / 0 error** và **571 test xanh**; thêm test integration cho endpoint mới.

---

## 8. Kiểm thử & verification

**Tĩnh:** `npm run build`, `npm run lint` · `dotnet build`, `dotnet test` (571).

**Grep gate (trước mọi commit liên quan tiền):**
```
res\.data                       → 0 (sau khi api.js đã bóc envelope)
vnp_ResponseCode=00             → 0 (không sinh ở client)
setTimeout( + message.success   → 0 cho hành động tài chính
catch { return MOCK             → 0
```

**E2E thủ công (API local + dev simulator):**
1. Login student → mua gói → "Giả lập thanh toán" → `/payment/return` hiện **đúng trạng thái server** → enrollment + 3 session.
2. Schedule → điểm danh student (chưa giải ngân) → điểm danh tutor → giải ngân + số dư ví đổi.
3. Mở khiếu nại → admin phân xử (confirm + note bắt buộc) → số dư khớp `DEC-S8-025`; ca thiếu tiền ⇒ `RequiresAdminFinancialIntervention`.
4. Chat 2 tab realtime; 5. Dừng API/DB ⇒ UI hiện error + retry (không mock).

**Responsive:** 360 / 768 / 1024 / 1440 / 2560 — không tràn, dock không che nội dung, admin có nav.
**A11y:** keyboard walkthrough + lint + contrast token chữ tiền.

---

## 9. Rủi ro & giả định

| Rủi ro | Xử lý |
|---|---|
| Secret cũ vẫn trong lịch sử git chung | **Rotate**; không rewrite history; cấu hình hiện fail-closed |
| Nhánh FE lệch backend khi backend tiếp tục thay đổi | Sửa backend trên nhánh backend rồi merge sang FE; kiểm tra overlap trước khi merge |
| Không có test framework FE | Lint + checklist E2E thủ công; Vitest/Playwright là non-goal |
| 17 màn tĩnh là khối lượng lớn | Chia theo subsystem (P5, P6), acceptance theo từng màn |
| Không có môi trường VNPay thật | Dev simulator (đã verify idempotent + nhánh fail) |
| `npm audit`: 4 lỗ hổng (3 moderate, 1 high) trong cây dependency | Ghi nhận; xử lý ở đợt riêng (không thuộc UI/UX) |

**Giả định:** (1) bỏ fallback mock ngầm — dev phải chạy API; (2) adopt TanStack Query; (3) thêm eslint + jsx-a11y; (4) xoá dead code; (5) UI tiếng Việt, JavaScript thuần (không TypeScript).

---

## 10. Phi mục tiêu

TypeScript/đổi framework; dark mode; Vitest/Playwright; thiết kế lại visual/branding (bám `DESIGN.md`); rewrite git history; các mục backend không phục vụ UI (S2 outbox atomic, S4 HSTS, S8 validate bằng chứng, S9 MIME drift…).
