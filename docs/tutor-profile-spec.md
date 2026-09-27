# SPEC — Trang cá nhân gia sư công khai (`/tutors/:id`)

> Trạng thái: SPEC v1.0 — **đã implement** (V1). Xem "Ghi chú triển khai" ở cuối.
> Tham khảo: ảnh màn hình Preply-style do stakeholder cung cấp (gallery ảnh + video, verify badge,
> rating, môn học, tabs neo, cards gói học, reviews, rail đặt lịch sticky).
> Tài liệu liên quan: `docs/frontend-specification.md`, `docs/openapi.json`,
> `src/frontend/src/pages/discovery/TutorProfile.jsx` (hiện trạng), `docs/prd.md` §11.

---

## 1. Design brief (8 dòng, theo skill designing-frontend-interfaces)

```
Purpose:    Biến hồ sơ công khai thành booking — tạo tin tưởng trong 30 giây, chốt gói học trong 2 phút
Audience:   Học viên/phụ huynh so sánh gia sư trên desktop; kiểm tra nhanh trên mobile
Tone:       Editorial Portfolio — độ tin cậy kiểu catalogue triển lãm + giá kiểu ledger
Reference:  Trang tutor Preply (ảnh đính kèm) + catalogue in: gallery, rule, số tabular
Palette:    Nền slate / mặt trắng / mực navy / một accent xanh; hổ phách chỉ cho rating
Type:       Be Vietnam Pro toàn trang (hệ sẵn có); số tabular cho giá và rating
Memorable:  Rail đặt lịch sticky — số liệu tin cậy + CTA đi theo khi đọc
Restraint:  Không hero tối, không gradient trên card, một radius, không tự phát video
```

**Hướng thẩm mỹ đã chọn:** Editorial Portfolio (light). Điểm đổi hướng so với hiện trạng:
trang hiện tại dùng cover hero navy tối + avatar chồng lấn — SPEC này chuyển sang gallery
sáng (ảnh/video + thumbnails) đúng ảnh tham khảo, vì mục tiêu là niềm tin con người, không phải
nhận diện nền tảng.

---

## 2. Token block (ánh xạ về `tokens.css` — KHÔNG tạo token mới)

```css
/* Page TutorProfile — dùng đúng token sẵn có */
--surface: 255 255 255;        /* mặt card */
--canvas: 248 250 252;         /* nền trang */
--border: 226 232 240;         /* viền #E2E8F0 */
--text-primary: 15 23 42;      /* mực chính */
--text-secondary: 71 85 105;   /* mực phụ */
--text-muted: 148 163 184;     /* meta */
--brand-primary-600: 37 99 235;  /* accent duy nhất (CTA, link, active tab) */
--brand-secondary-500: 245 158 11; /* chỉ cho sao rating */
/* Type: Be Vietnam Pro — title 30px/700 · section 22px/600 · card title 16px/600 ·
   price 20px/700 tabular · body 14px/400 · meta 12–13px · tab 14px/500 */
/* Radius: brand-lg 16px (card), brand-md 10px (control) · Shadow: brand-sm/md */
/* Motion: 220ms ease-out hover; gallery fade 220ms; KHÔNG autoplay video */
```

---

## 3. Layout skeleton

### 3.1 Desktop (≥1024px) — 12 cột: nội dung 8 + rail 4 sticky

```text
Trang chủ › Gia sư › {Tên gia sư}                                   [Lưu] [Chia sẻ]

┌ GALLERY (8) ────────────────────────┐ ┌ HEADLINE (liền gallery) ──────────┐
│ [ ảnh/video chính 16/10 ]            │ │ [Đang nhận học viên]               │
│ [thumb][thumb][thumb][+n]            │ │ Tên + tick xanh                    │
│                                      │ │ Gia sư {môn} · {n} năm KN          │
└──────────────────────────────────────┘ │ ★ 5.0 (128 đánh giá) · 500+ HV     │
                                         │ 📍 Hà Nội · 💻 Online & tại nhà    │
┌ TABS (neo, sticky dưới topbar) ────────────────────────────────┐ │ ⌛ Phản hồi 1 giờ · 🕘 HĐ 3 giờ trước │
│ Giới thiệu · Dịch vụ học tập · Đánh giá (n) · Bằng cấp · Lịch · FAQ │ │ [IELTS][Giao tiếp][Luyện thi]...      │
└────────────────────────────────────────────────────────────────┘ └──────────────────────────────────┘
┌ NỘI DUNG (8) ─────────────────────────┐ ┌ RAIL STICKY (4) ──────────────────┐
│ ## Giới thiệu về tôi                   │ │ [ Nhắn tin với gia sư ] (primary) │
│ đoạn bio + Xem thêm (clamp 4 dòng)     │ │ Trao đổi trực tiếp để được tư vấn │
│ ┌ Điểm mạnh giảng dạy (checklist) ┐    │ │ ⚡ Tỷ lệ phản hồi / Thường 1 giờ  │
│ ## Dịch vụ học tập    Xem tất cả →     │ │ ★ Đánh giá trung bình 5.0 (128)  │
│ [card][card][card] (grid 3)            │ │ 👥 Số học viên đã dạy 500+        │
│ ## Đánh giá từ học viên  Xem tất cả →  │ │ 🎓 Kinh nghiệm 8 năm             │
│ [tóm tắt 5.0 + bars] [review cards]    │ │ ────────────────────────────────  │
│ ## Chứng chỉ & Bằng cấp (V2)           │ │ ## Chứng chỉ & Bằng cấp (V2)      │
│ ## Môn học & Kỹ năng (tags)            │ │ ## Môn học & Kỹ năng (tags)       │
│ ## Khu vực giảng dạy (V2)              │ │ ## Khu vực giảng dạy (V2)         │
└────────────────────────────────────────┘ └──────────────────────────────────┘
```

### 3.2 Mobile (<1024px)

Gallery → headline → CTA kép sticky đáy (`Nhắn tin` outline + `Xem gói học` primary) →
tabs cuộn ngang (ẩn scrollbar) → sections xếp dọc → rail bung thành sections thường
(không sticky). Gallery aspect 16/10 full-bleed trừ padding.

---

## 4. Component specs

### 4.1 Gallery (V1 ảnh đại diện · V2 video + album)

| # | Quy tắc |
|---|---------|
| G-1 | V1: render `avatarUrl` aspect 16/10 `object-cover rounded-brand-lg`. Thiếu ảnh → khối brand-primary-50 + tên môn (pattern `ServiceThumb`). |
| G-2 | V2 (cần backend §7): ảnh chính + dải thumbnails + nút play overlay mở modal video (KHÔNG autoplay, `prefers-reduced-motion` tắt hiệu ứng). |
| G-3 | Mọi ảnh có `alt` thật; ảnh trang trí `aria-hidden`. |

### 4.2 Headline

- Pill trạng thái: `Đang nhận học viên` (success) — suy từ `services.length > 0`; ngược lại `Tạm ngừng nhận lớp` (neutral).
- H1 tên + tick `verified` khi `isVerified`; dòng `Gia sư {subjectName đầu} · {experienceYears} năm kinh nghiệm`.
- Dòng tin cậy: `★ {ratingAvg} ({totalReviews} đánh giá)` (amber, tabular) · `{studentCount} học viên` (V2) · meta địa chỉ/hình thức/phản hồi (V2, fallback text tĩnh hiện tại giữ nguyên).
- Tags môn: `Tag` từ `subjects[].subjectName`.
- Actions phụ: `Lưu` (V2 — bookmark cần backend), `Chia sẻ` (V1 — copy link + toast, dùng Clipboard API + fallback).

### 4.3 Tabs neo (sticky)

`Giới thiệu · Dịch vụ học tập · Đánh giá (n) · Bằng cấp · Lịch dạy · Câu hỏi thường gặp`.
Dùng `Tabs` shared (đã ẩn scrollbar). Click → smooth scroll + `scroll-mt`; mục đang xem
đổi qua IntersectionObserver (V1 có thể chỉ scroll, observer là V2-nice-to-have).
`Lịch dạy` V1: anchor tới section giải thích "gia sư xếp lịch sau giữ chỗ" (không có public
schedule API) — KHÔNG dựng lịch giả.

### 4.4 Dịch vụ học tập

- Grid 3 cards (giữ component card hiện tại: ribbon học thử, price hero, checklist, CTA đôi).
- Chuẩn giá package-first theo refactor `/tutor/services`: giá gói 20px/700, `≈ xđ/buổi` muted.
- `Xem tất cả dịch vụ →` (V2 — filter theo tutor trên sàn; V1 ẩn khi ≤ 3 gói).
- CTA `Giữ chỗ ngay` giữ guards hiện tại (chưa login → login?redirect; role Tutor → cảnh báo).

### 4.5 Đánh giá

- Tóm tắt: số 5.0 lớn + 5 sao + bars phân bố (tính từ `reviews` trang hiện tại; phân trang đầy đủ là V2).
- Card review: avatar + tên + badge `Đã hoàn thành khóa học` + ngày + sao + comment + reply gia sư (giữ).
- `Xem tất cả {n} đánh giá →` (V2 — trang/modal phân trang; V1 hiển thị N đánh giá đầu + đếm).

### 4.6 Rail đặt lịch (sticky, desktop)

1. CTA primary `Nhắn tin với gia sư` → `/app/messages?tutorId=` (giữ).
2. Dòng phụ: `Trao đổi trực tiếp để được tư vấn lộ trình phù hợp.`
3. 4 stat rows (icon + label + value): phản hồi / đánh giá TB / học viên đã dạy (V2) / kinh nghiệm.
4. Blocks `Chứng chỉ & Bằng cấp`, `Môn học & Kỹ năng`, `Khu vực giảng dạy` — V2, xem §7.
5. Nội dung rail KHÔNG trùng headline: rail = hành động + số liệu, headline = con người + niềm tin.

### 4.7 Trạng thái chung (5 states)

| State | Quy tắc |
|---|---|
| Loading | `ProfileSkeleton` (giữ). |
| Error | `ErrorState` + retry (giữ); reviews lỗi riêng → `Callout` warning, trang vẫn hiện (giữ). |
| Empty | services rỗng → EmptyState + CTA nhắn tin (giữ); reviews rỗng → text muted (giữ). |
| Focus | Không suppress outline; dùng focus-visible của hệ. |
| Forbidden/guards | Đặt chỗ: guest → login redirect; Tutor role → toast cảnh báo (giữ nguyên logic). |

---

## 5. Responsive & accessibility (chốt)

- Breakpoints theo hệ: `sm/md/lg`; rail sticky `lg:top-24`; CTA sticky đáy chỉ mobile.
- Tương phản: body ≥ 4.5:1, text lớn ≥ 3:1; sao rating luôn kèm số (không chỉ màu).
- Giảm chuyển động: `prefers-reduced-motion` tắt float/fade/smooth-scroll.
- Bàn phím: tabs là `role=tablist` thật (shared), gallery prev/next + modal video focus-trap + Esc đóng.

---

## 6. Những gì KHÔNG làm (Restraint)

1. Không hero cover navy tối + avatar chồng lấn (bỏ pattern hiện tại).
2. Không gradient trên card gói học (ribbon học thử là màu đặc, không gradient).
3. Không autoplay/preload video; không lightbox gallery ở V1.
4. Không dựng số liệu giả (tỷ lệ phản hồi, học viên đã dạy, khu vực) — thiếu data thì ẩn block, ghi V2.
5. Không thêm màu mới ngoài amber-rating; không radius mới; không emoji thay icon.

---

## 7. Data contract & khoảng trống backend (V1 build được / V2 cần API)

| UI cần | Hiện có (V1) | Thiếu (V2, cần backend) |
|---|---|---|
| Tên, avatar, bio, học vấn, KN, hình thức, địa chỉ, rating, đếm reviews, môn, gói, reviews + reply | `TutorProfileDto` + `GET /tutors/{id}/reviews` ✅ | — |
| Video giới thiệu + album ảnh | — | `TutorProfile.introVideoUrl`, `galleryImageUrls[]` (upload qua Media) |
| Chứng chỉ & bằng cấp | — | `TutorCertificate[] {tên, đơn vị, năm}` (từ `TutorApplication` đã duyệt hoặc nhập tay) |
| Tỷ lệ/giờ phản hồi, học viên đã dạy | — | aggregate từ Messages/Enrollments hoặc field snapshot |
| Khu vực giảng dạy | `address` text | `teachingAreas[]` có cấu trúc |
| Lưu (bookmark) | — | `POST /tutors/{id}/save` + trạng thái đã lưu |
| Lịch dạy công khai | — | QUYẾT ĐỊNH: không public lịch (giữ flow giữ chỗ → gia sư xếp lịch); tab Lịch chỉ giải thích |
| Full list gói + full reviews | giới hạn theo DTO hiện tại | query `tutorId` trên `/services` + phân trang reviews |

**Nguyên tắc V1:** mọi block thiếu data thì ẩn hoàn toàn, không placeholder số 0 giả.

---

## 8. Acceptance criteria (đóng SPEC)

- [x] Desktop/mobile khớp skeleton §3; rail sticky đúng, không che CTA.
- [x] Mọi con số trên màn hình đều từ API (không hardcode 500+/128 trừ dữ liệu thật).
- [x] Tabs neo scroll đúng section, active underline xanh 2px, không scrollbar.
- [x] Giá gói package-first 20px/700 + `≈ xđ/buổi` muted trên mọi card.
- [x] Guards đặt chỗ (guest/Tutor role) giữ nguyên và có toast đúng.
- [x] 0 lỗi eslint, build pass.
- [x] Soi rubric skill: 1 accent, 1 radius, spacing/token đúng block §2, memorable (§rail) hiện diện, restraint §6 giữ.

---

## 9. Ghi chú triển khai (V1)

**Component mới** (`src/frontend/src/components/tutor/profile/`):

| File | Vai trò |
|---|---|
| `TutorProfile.jsx` (page) | Bố cục 12 cột + guards; giữ nguyên data-loading cũ |
| `ProfileGallery.jsx` | Ảnh 16/10 `object-top` (giữ mặt khi crop), fallback khi URL hỏng |
| `ProfileHeadline.jsx` | Pill trạng thái, tên + tick, dòng tin cậy, Chia sẻ (copy link) |
| `ProfileAnchorNav.jsx` | Tabs neo + scroll-spy (IntersectionObserver) |
| `SectionShell.jsx` | Vỏ section dùng chung (id, `scroll-mt`, h2 22px/600) |
| `ProfileAbout.jsx` | Bio (Xem thêm), điểm mạnh, block môn học |
| `ServicePackageCard.jsx` | Card gói học, giá package-first |
| `ServicePackageGrid.jsx` | Grid 3 cột + EmptyState; tối đa 3 gói ở V1 |
| `ReviewsSection.jsx` | Tóm tắt 5.0 + bars + review cards + reply gia sư |
| `BookingRail.jsx` | CTA + 4 stat row từ dữ liệu thật |
| `MobileBookingBar.jsx` | CTA kép dính đáy, chỉ mobile |
| `ProfileScheduleExplainer.jsx` | Quy trình xếp lịch (không dựng lịch giả) |
| `ProfilePlaceholderSection.jsx` | Section chờ backend (Bằng cấp, Câu hỏi) |
| `sectionNav.js` | `scrollToSection` + scroll-spy dùng chung |

**Quyết định lệch so với SPEC (có lý do):**

1. **§7 nói "thiếu data thì ẩn block"** — nhưng ẩn hẳn sẽ giết tab neo tương ứng. Thay bằng
   `ProfilePlaceholderSection`: một dòng chữ nói rõ "sẽ hiển thị sau khi hồ sơ được thẩm định".
   Vẫn trung thực (không bịa số 0), nhưng giữ được điều hướng.
2. **§4.1 V2 gallery** — dùng `object-top` thay `object-center`: ảnh chân dung crop
   trong khung 16/10 sẽ mất mặt nếu căn giữa.
3. **`scrollToSection` có fallback** — `scrollTo({behavior:'smooth'})` bị bỏ qua im lặng ở
   môi trường không cấp animation frame (headless, webview nhúng, tab chưa render). Sau
   150ms không nhúc nhích thì trượt sang dạng số để điều hướng không chết lặng.
4. **Bỏ `defaultProps`** — chuyển sang default parameters đúng convention repo và xóa
   16 warning React 18.3 (`defaultProps` sẽ bị gỡ trong React 19).

**Sửa bug phát hiện khi implement:** `normalizeTutorReview` trong `tutor.service.js` không
khai báo `tutorReply`/`studentAvatarUrl`, dù backend `TutorPublicReviewDto` có trả. Ô
"Phản hồi từ gia sư" vì thế là dead code — không bao giờ hiển thị. Đã bổ sung 2 field.

**Còn nợ (V2, đã ghi ở §7):** video/album, chứng chỉ, tỷ lệ phản hồi, số học viên đã
dạy, khu vực có cấu trúc, nút Lưu, phân trang đánh giá, lọc gói học theo gia sư.
