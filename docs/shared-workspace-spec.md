# SPEC — Nhóm Shared (Messages · Notifications · ProfileSettings)

> Trạng thái: SPEC v1.0 — chờ duyệt, chưa implement.
> Hướng thẩm mỹ: **Operational Ledger**, giữ nguyên như hai vùng đã làm.
> Phạm vi: 3 màn dùng chung cho mọi vai trò. Đây là nhóm cuối trong chuỗi
> Student → Tutor → Shared.
> Liên quan: `docs/student-workspace-spec.md` (đã implement),
> `docs/tutor-workspace-spec.md` (đã implement), `DESIGN.md`.

---

## 1. Design brief

```
Purpose:    Trao đổi và cấu hình — hai việc nhỏ, nhưng làm sai thì mất tiền/mất tài khoản
Audience:   Cả 3 vai trò dùng chung; học viên và gia sư đều vào hằng ngày
Tone:       Operational Ledger cho phần tiền/đối soát; phần chat gọn và tĩnh
Reference:  Console vận hành: danh sách + chi tiết, không phải landing page
Palette:    Token có sẵn. Đỏ = xung đột, KHÔNG phải "chưa đọc" hay "vai trò Admin"
Type:       Be Vietnam Pro. Tiền qua <Money>. Mã/giờ kỹ thuật qua mono
Memorable:  Thẻ thỏa thuận trong chat tách khỏi dòng tin nhắn, ghim đầu vùng đọc
Restraint:  Không gradient, không icon thô, không ép API ngoài thiết kế, 1 CTA/màn
```

---

## 2. Bug có sẩn (đã đọc code + kiểm `iconMap.js`)

| # | Vị trí | Vấn đề | Hậu quả |
|---|---|---|---|
| **B-9** | `Notifications.jsx:98` | Icon `payment` **không có** trong `iconMap.js` | Nhóm **Tài chính & Ký quỹ** hiện `CircleHelp` — đúng nhóm quan trọng nhất lại là nhóm vỡ icon |
| **B-10** | `ProfileSettings.jsx:431,415` | Icon `security` và `save` **không có** | Icon tròn hỏi ở header đổi mật khẩu + nút lưu hồ sơ |
| **B-11** | `ProfileSettings.jsx:326` | Badge **"Đã xác thực"** cứng cho ô email, nhưng backend **không hề có** field `EmailVerified`/`IsEmailVerified` (đã grep toàn repo: 0 kết quả) | **Khẳng định sai sự thật với người dùng.** Không có gì xác thực email |
| **B-12** | `ProfileSettings.jsx:343` | `<select>` thô cho "Hình thức giảng dạy" | Lệch focus ring/height với mọi form khác (cùng lớp bug như B-3 đã sửa ở ví Học viên) |
| **B-13** | `ProfileSettings.jsx:229-256` | Tự dựng tab bằng `<div>` + `<button>` thay vì `Tabs` chung | Mất `role="tablist"`, lệch style với mọi màn khác |
| **B-14** | `Messages.jsx:165,376` | `handleTyping()` bắn `SendTyping` **mỗi lần gõ** | Flood hub: mỗi phím 1 invoke, không throttle |
| **B-15** | `Messages.jsx:200,246` + `ProfileSettings.jsx:90` | Avatar fallback gọi **`https://api.dicebear.com`** | Rò tên người dùng ra dịch vụ bên thứ ba; phụ thuộc mạng ngoài; phong cách cartoon lệch design system |

**Cần bạn quyết (liên quan pháp lý, không thuần thiết kế):**

- **B-11** — đề xuất: bỏ badge "Đã xác thực", thay bằng nhãn trung tính
  "Email là định danh đăng nhập, không đổi được" + `Callout info` giải thích
  chưa có bước xác thực. Nếu sản phẩm *đã* gửi mail xác thực ở nơi khác thì
  cần backend trả trạng thái; tôi chưa thấy bằng chứng nên không khẳng định.
- **B-15** — đề xuất: bỏ DiceBear, dùng `Avatar` của hệ (đã có fallback chữ cái
  đầu) + chỉ nhận URL ảnh thật. Nếu bạn muốn giữ nút "tạo avatar ngẫu nhiên"
  thì cần nói rõ với người dùng là ảnh từ dịch vụ bên thứ ba.

---

## 3. Đặc tả từng màn

### 3.1 `/app/messages` — Hộp thư

Giữ nguyên cấu trúc 2 cột (danh sách 320px · vùng đọc) — đây là mẫu chuẩn và hoạt động
tốt. Sửa:

1. **B-9 tương tự:** danh sách cuộc trò chuyện rút gọn — avatar, tên, giờ
   `formatRelativeTime` thay vì chỉ `HH:mm` (tin nhắn 3 ngày trước không nên hiện
   "14:02"), preview 1 dòng, chấm xanh nếu có tin chưa đọc.
2. **Thẻ thỏa thuận: ghim lên đầu vùng đọc, không nhét giữa dòng tin nhắn.**
   Hiện nó là một `Card` nằm *sau toàn bộ* message list (IIFE trong JSX) nên trông
   như tin nhắn của người gửi nhưng thực ra là panel bên. Đưa lên ngay dưới header
   cuộc trò chuyến, có nhãn rõ "Thỏa thuận đào tạo".
3. **Nút "Thanh toán giữ chỗ" `variant="success"` → `primary`.** Thanh toán là
   tiền ra (cùng lý do đã sửa nút rút tiền ở vùng Tutor).
4. **B-15:** bỏ DiceBear. `Avatar` đã tự fallback về chữ cái đầu khi URL rỗng/hỏng.
5. **B-14:** throttle `SendTyping` — gọi tối đa 1 lần / 2 giây, kèm cờ
   "đang gõ" hiển thị phía người nhận (đã có, giữ nguyên).
6. **Bỏ `animate-pulse` vĩnh viễn** ở dòng "Kênh nhắn tin mã hóa bảo mật".
7. **Sửa claim bảo mật:** hiện ghi *"Kênh nhắn tin mã hóa bảo mật"*. SignalR chạy
   trên HTTPS → mã hoá **kênh truyền**, không phải mã hoá đầu-cuối. Đổi thành
   *"Trao đổi qua kênh bảo mật của TutorHub"*, bỏ chấm nhấp nháy. Không tự nhận
   mã hoá E2E khi không có.
8. Thêm `aria-live="polite"` cho vùng danh sách tin nhắn và cho dòng "đang gõ".
9. Empty state của danh sách cuộc trò chuyện dùng component chung thay vì `div` thô.

### 3.2 `/app/notifications` — Trung tâm thông báo

1. **B-9:** thay `payment` bằng icon có thật cho nhóm Tài chính
   (`payments` → Banknote) — cùng nhóm với ví.
2. **Badge "N mới" `variant="danger"` → `primary`.** Đỏ theo §2.2 là xung đột /
   tranh chấp; "có 3 thông báo chưa đọc" không phải tín hiệu nguy hiểm.
3. **Bỏ `opacity-85` cho thông báo đã đọc.** Hạ opacity cả thẻ làm giảm tương
   phản chữ ở mức dưới ngưỡng WCAG. Thay bằng phân biệt có/không chấm đọc +
   nền trung tính; chữ luôn đủ tương phản.
4. **Nút "đánh dấu đã đọc" hiện là chấm 10px** — vùng bấm quá nhỏ (dưới chuẩn
   24×24, tệ cho cảm ứng lẫn bàn phím). Đổi thành nút có `min-w`/`min-h` 24px
   với `aria-label` giữ nguyên.
5. `h1` dùng `PageHeader` với `<span>` bên trong → chuyển sang khối h1 đơn giản
   `text-headline-page`, badge unread nằm cạnh.
6. Bổ sung nhóm danh mục dùng thật: hiện `getCategoryFromType` so chuỗi trên
   `type` — dễ vỡ (xem §4). Giữ nguyên hàm nhưng **sắp xếp thứ tự kiểm tra** và
   ghi chú rõ đây là suy đoán, vì API không trả `category` thật.
7. Giữ nguyên: `markAsRead`, `markAllAsRead`, `resolveDeepLink`, 4 tab, copy.

### 3.3 `/tutor|student|admin/settings` — Hồ sơ & Cài đặt

1. **B-13:** bỏ tab tự dựng, dùng `Tabs` chung (nhận cả `content`).
2. **B-12:** `<select>` thô → `Select` chung.
3. **B-10:** `security` → `verified_user` (ShieldCheck), `save` → `check`.
4. **B-11:** bỏ badge "Đã xác thực" (xem §2), giữ email `disabled` vì email là
   định danh đăng nhập.
5. **Badge vai trò:** `Admin` đang dùng `variant="danger"` (đỏ) chỉ để nói "quản
   trị viên". Đổi theo vai trò: Học viên `info`, Gia sư `primary`, Quản trị `neutral`.
6. `h1` → `text-headline-page`; tiêu đề tab dùng token 14px/500 như `Tabs` chung.
7. **B-15:** bỏ DiceBear. Thay nút "Tạo avatar ngẫu nhiên" bằng gợi ý dán URL,
   và nói rõ ảnh đại diện hiển thị ở hồ sơ công khai.
8. Tab mật khẩu: thêm **báo lý do chặn inline** (`role="status"`) cho
   <8 ký tự / không khớp — đồng bộ với các form khác đã sửa. Giữ nguyên 3 `toast`.
9. Giữ nguyên: `getMyTutorProfile` / `getMyProfile`, `updateMyTutorProfile` /
   `updateMyProfile`, `changePassword`, đồng bộ `authStore` qua `login(...)`,
   mọi payload key và toasts.

---

## 4. Điểm cần nói thẳng (không phải quyết định thiết kế)

- **`getCategoryFromType` là suy đoán.** API thông báo không trả `category`; code
  hiện đoán bằng cách tìm chuỗi trong `type`. Thứ tự kiểm tra cứu cụt bảo đảm
  `SessionPayoutCredit` ra nhóm Tài chính, nhưng một type mới có thể rơi sai nhóm.
  Sửa đúng là thêm `category` vào DTO backend — ghi ở §5, không tự bịa bản phân loại.
- **Route `/app/messages` và `/app/notifications` nằm trong `PublicLayout`**, nên
  vẫn dùng topbar/footer của trang công khai trong khi đây là công cụ trong sàn.
  Đề xuất: chuyển sang layout workspace. Nhưng Messages/Notifications là **dùng
  chung 3 vai trò** nên cần layout chung, không phải copy 3 lần — việc này đụng
  `routes/index.jsx` và ngoài phạm vi một đợt UI, **hỏi bạn trước khi làm**.

---

## 5. Acceptance criteria

- [ ] B-9, B-10 → 0 icon `CircleHelp` trên cả 3 màn (verify bằng cách soi DOM).
- [ ] B-11 → không còn khẳng định "Đã xác thực" khi backend không xác thực email.
- [ ] B-12, B-13 → `Select` + `Tabs` chung trong `ProfileSettings`.
- [ ] B-14 → `SendTyping` tối đa 1 lần / 2 giây.
- [ ] B-15 → không còn `api.dicebear.com` trong 3 file này.
- [ ] Nút "Thanh toán giữ chỗ" và badge "N mới" không dùng `success`/`danger` sai nghĩa.
- [ ] Thẻ thỏa thuận ở đầu vùng đọc, không lẫn vào dòng tin nhắn.
- [ ] Không còn `opacity` hạ trên nội dung đã đọc (tương phản WCAG).
- [ ] Nút đánh dấu đã đọc ≥ 24×24 px.
- [ ] Claim bảo mật trong chat không tự nhận mã hoá E2E.
- [ ] `npx eslint` 0 error 0 warning trên 3 file + phần dùng chung · `npm run build` pass.
- [ ] Verify live bằng tài khoản thật (Học viên + Gia sư): hộp thư, thông báo, hồ sơ.
- [ ] Không đổi call site API, payload, validation, copy.

---

## 6. Còn nợ

- Backend chưa có `category` cho thông báo → phân loại vẫn là suy đoán.
- Backend chưa có trạng thái xác thực email.
- `Notification` không có phân trang (pageSize 50 cố định).
- Chat không có phân trang ngược (pageSize 50), không có phân ngày, không có
  trạng thái đã đọc phía gửi.
- `Messages` chưa có trạng thái lỗi toàn trang (chỉ toast).
