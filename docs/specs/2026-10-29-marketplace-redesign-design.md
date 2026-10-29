# Marketplace gia sư — Design Spec

**Ngày:** 2026-10-29  
**Trạng thái:** Design đã duyệt — spec chờ review  
**Phạm vi:** `/` — Marketplace gia sư  
**Nguồn thị giác:** `final-layout.html` (desktop 1360, mobile 390, loading/empty/error)  
**Thay đổi được duyệt:** thêm “Trở thành gia sư” vào nav giữa và căn giữa thanh nav; giữ nguyên toàn bộ filter và hành vi API.

---

## 1. Tóm tắt

Refactor màn hình marketplace theo hướng **Cobalt Editorial**: bố cục trái-aligned kiểu editorial/Swiss, đường kẻ mảnh thay cho shadow dày, một điểm nhấn cobalt duy nhất, số dùng tabular numerals, icon Lucide nét trần. Màn hình giữ nguyên khả năng tìm kiếm/lọc/sắp xếp/phân trang hiện có; thay đổi chủ yếu là hierarchy, card, filter, trạng thái hệ thống và trải nghiệm mobile.

Thay đổi ngoài marketplace duy nhất là **topbar dùng chung**: thêm “Trở thành gia sư” vào giữa nav, căn giữa cụm nav, bỏ link “Trở thành gia sư” bị trùng ở cụm action bên phải.

## 2. Mục tiêu

- Làm rõ hierarchy: người học hiểu ngay “tìm ai, học gì, giá bao nhiêu, bước tiếp theo là gì”.
- Card gia sư dễ quét hơn: tên, xác minh, học vấn, đánh giá, môn học, giá, CTA.
- Filter giữ đủ chức năng nhưng gọn hơn; mobile có drawer rõ ràng, có summary filter.
- Loading/empty/error có thiết kế riêng, không dùng text trần.
- Giữ nguyên dữ liệu, API, filter state, sort, phân trang và các hành vi hiện có.
- Cải thiện accessibility: focus, touch target, contrast, reduced motion.

## 3. Không nằm trong phạm vi

- Backend, API, database, payment/escrow.
- Đổi nghĩa dữ liệu `minPrice` (đây là **giá gói**, không phải giá theo buổi).
- Thêm filter mới ngoài các filter hiện có. Quick chip kinh nghiệm chỉ là shortcut cho `experienceRange` đã có.
- Lưu favorite lên server; favorite vẫn là local state như hiện tại.
- Dữ liệu thật cho trust panel; panel là nội dung tĩnh.
- Dark mode.
- Redesign `/services` hoặc các màn hình khác. Topbar là ngoại lệ đã được duyệt.

## 4. Nguyên tắc thiết kế

- **Editorial, không dashboard:** hero trái-aligned, đường kẻ hairline, khoảng thở rộng, không bo tròn quá mức.
- **Một điểm nhấn:** cobalt chỉ dùng cho primary action, active state, link và con số quan trọng. Amber chỉ cho sao đánh giá; xanh lá chỉ cho xác minh.
- **Nét trần:** icon Lucide 1.7px, không bọc trong ô màu; active dùng màu + gạch chân 2px.
- **Số là số:** giá, rating, số lượng dùng `font-variant-numeric: tabular-nums`.
- **Thông tin trước trang trí:** card không shadow ở trạng thái nghỉ; hover mới nổi nhẹ.
- **Mobile là một luồng riêng:** toolbar dính, drawer có summary, footer hành động cố định.

## 5. Ngôn ngữ thị giác

### 5.1. Palette — Cobalt & Porcelain

| Biến scoped | Hex | Dùng cho |
|---|---|---|
| `--mkt-canvas` | `#F7F8FA` | Nền trang |
| `--mkt-surface` | `#FFFFFF` | Card, topbar, sidebar, drawer |
| `--mkt-ink` | `#0F172A` | Heading, tên gia sư, giá, số chính |
| `--mkt-body` | `#475569` | Body, mô tả, label |
| `--mkt-muted` | `#94A3B8` | Meta, placeholder, label phụ |
| `--mkt-line` | `#E2E8F0` | Hairline, border |
| `--mkt-cobalt` | `#1F4FD8` | Primary, active, link |
| `--mkt-cobalt-hover` | `#1A43B8` | Hover primary |
| `--mkt-cobalt-50` | `#EFF3FE` | Nền tint nhẹ |
| `--mkt-cobalt-100` | `#DCE4FB` | Border tint, highlight |
| `--mkt-amber` | `#D97706` | Sao đánh giá |
| `--mkt-green` | `#047857` | Icon xác minh |
| `--mkt-danger` | `#B91C1C` | Lỗi, xóa |

**Quan trọng:** các biến này được khai báo trong scope `.marketplace-v2` (CSS riêng của marketplace), **không sửa** `src/frontend/src/styles/tokens.css` và không đổi token toàn cục. Palette hiện tại đã có cobalt/ink gần tương đương; đây là lớp override có chủ đích cho màn hình này.

Contrast tối thiểu:
- Cobalt `#1F4FD8` trên trắng: ~6.6:1.
- Ink `#0F172A` trên trắng: > 15:1.
- Body `#475569` trên trắng: > 7:1.
- Không dùng cobalt làm chữ trên nền cobalt-50 ở cỡ nhỏ nếu contrast < 4.5:1; kiểm tra lại khi implement.

### 5.2. Typography

| Vai trò | Font | Weight | Size / line-height | Ghi chú |
|---|---|---|---|---|
| Display / H1 | Plus Jakarta Sans | 800 | 44 / 1.1 desktop; 29 / 1.12 mobile | `letter-spacing: -0.045em` |
| Section / H2 | Plus Jakarta Sans | 800 | 24 / 1.15 | `-0.035em` |
| Card name | Plus Jakarta Sans | 800 | 15 / 1.2 desktop; 13.5 mobile | `-0.02em` |
| Price | Plus Jakarta Sans | 800 | 16 / 1.2 desktop; 15 mobile | tabular-nums |
| Button | Plus Jakarta Sans | 700 | 10.5–13 | |
| Body | Be Vietnam Pro | 400 | 15 / 1.65 | |
| Meta | Be Vietnam Pro | 400/500 | 10.5–12.5 | |
| Label / UI | Be Vietnam Pro | 600 | 10.5–13 | |
| Eyebrow / price label / trace ID | JetBrains Mono | 500/600 | 7.5–10 | uppercase, tracking `.1–.12em` |

- Thêm Plus Jakarta Sans vào Google Fonts hiện có trong `index.html` với `display=swap`; fallback `ui-sans-serif, system-ui, sans-serif`.
- Không đổi `fontFamily` toàn cục trong `tailwind.config.js`; dùng class scoped trong `marketplace.css` (`.mkt-display`, `.mkt-body`, `.mkt-mono`).
- Rating hiển thị 1 chữ số thập phân; dùng locale Việt Nam (dấu phẩy) trong `TutorCard` của marketplace, không đổi formatter toàn cục.

### 5.3. Icon

- Lucide, nét trần, `strokeWidth={1.7}`; ngoại lệ 2 cho mũi tên/chevron rất nhỏ.
- Size: 13 (meta), 15 (category/nav), 17 (hero/trust), 22 (empty/error).
- Không dùng icon tile nền màu; active chỉ đổi màu + gạch chân.
- Icon xác minh: `verified` nét trần, màu `--mkt-green`, kèm `title`/`aria-label` “Đã xác minh”.
- Sao đánh giá: `star` filled màu amber.
- Dùng `Icon` wrapper hiện có; truyền `strokeWidth` và `name` đã map.

### 5.4. Shape, elevation, motion

- Radius: card 12px; panel/sidebar 14px; input/button 8–10px; pill 999px.
- Border 1px `--mkt-line`; card không shadow ở trạng thái nghỉ.
- Shadow chỉ dùng cho hover card, dropdown, drawer.
- Motion 150–200ms; hover card `translateY(-1px)`; tôn trọng `prefers-reduced-motion` (tắt shimmer, hover transform).

## 6. Bố cục

### 6.1. Topbar — thay đổi toàn cục đã duyệt

`PublicTopbar` là component dùng chung. Thay đổi cấu trúc áp dụng cho toàn bộ public pages; đây là ngoại lệ duy nhất ngoài marketplace.

**Cấu trúc**
- Grid 3 cột: `grid-template-columns: 1fr auto 1fr`.
- Logo căn trái; cụm nav căn giữa; cụm action căn phải.
- Giữ chiều cao 72px hiện tại để không phá offset sticky của các trang khác. Mockup dùng 66px cho gọn; implementation giữ 72px.
- Nền `surface`, border-bottom hairline; bỏ shadow/backdrop blur dày để hợp ngôn ngữ editorial. Sticky như hiện tại.

**Nav khách (chưa đăng nhập)**
Thứ tự chính xác:

1. `Tìm gia sư` → `/` (active cả `/tutors`)
2. `Dịch vụ` → `/services`
3. `Trở thành gia sư` → `/become-tutor`
4. `Cách hoạt động` → `/how-it-works`

- Đây là copy rút gọn theo bản duyệt; thay cho `Khám phá gia sư` / `Dịch vụ học tập`.
- Active: chữ ink + gạch chân 2px cobalt; inactive: body, hover ink + nền neutral-50.
- `min-h-11` (44px), `px-3.5`, gap 6px; `white-space: nowrap`.
- Cụm nav căn giữa tuyệt đối trong topbar, không phụ thuộc độ rộng logo/action.

**Nav đã đăng nhập**
- Giữ nguyên logic hiện tại: `Lịch học`, `Tin nhắn`, `Gói học của tôi`; căn giữa, active underline.
- Không thêm “Trở thành gia sư” cho tutor; student vẫn có thể vào `/become-tutor` qua footer/drawer nếu product muốn, nhưng không thuộc spec này.

**Cụm action**
- Bỏ link “Trở thành gia sư” bên phải (đã chuyển vào nav giữa) để tránh trùng.
- Giữ nguyên hierarchy hiện tại: `Đăng ký` outline + `Đăng nhập` primary; tutor có `Hồ sơ xét duyệt`, notification, avatar menu.
- Không đổi logic auth/logout.

**Responsive**
- `lg+` (≥1024): hiện cụm nav giữa; ẩn hamburger.
- `< lg`: ẩn cụm nav; hiện hamburger + drawer. Đổi breakpoint hiện tại từ `md` sang `lg` để 4 item không bị chật ở tablet.
- Drawer mobile: cùng thứ tự 4 link; “Trở thành gia sư” nằm giữa `Dịch vụ` và `Cách hoạt động`; giữ `Đăng nhập`/`Đăng ký`; đóng drawer sau khi chọn.
- Ở `md` (768–1023), không có nav ngang; hamburger/drawer là đường vào duy nhất. Kiểm tra lại các trang public khác vì topbar đổi breakpoint.

**Active state theo route**
- `/` hoặc `/tutors*`: `Tìm gia sư`.
- `/services*`: `Dịch vụ`.
- `/become-tutor*`: `Trở thành gia sư`.
- `/how-it-works`: `Cách hoạt động`.

### 6.2. Hero

**Desktop (≥1024)**
- Hai cột: trái `minmax(0, 1.45fr)`, phải `minmax(320px, 0.75fr)`; gap 44px; padding 42px 0 36px.
- Trái:
  - Eyebrow mono: `GIA SƯ ĐÃ XÁC MINH` + dấu gạch 22px; nếu có `totalCount`, thêm `· {formatNumber(totalCount)} HỒ SƠ`. Không hardcode 1.240.
  - H1 44px, tối đa 580px, break sau “điều”: “Tìm người dạy đúng điều / bạn cần học.”; highlight cobalt-100 dưới “bạn cần học.” bằng `linear-gradient` (hoạt động qua line break).
  - Sub 15px, tối đa 560px.
  - Search bar 56px, tối đa 660px; icon search 18; input 14; button “Tìm gia sư” 44px + arrow. Submit/clear giữ nguyên hành vi hiện tại.
  - Tag phổ biến: `Toán`, `IELTS`, `Lập trình`, `Vật lý`; button nhỏ, click set keyword và submit (không thêm API).
- Phải: trust panel tĩnh:
  - Tiêu đề “Học an toàn từ buổi đầu tiên” + shield icon.
  - 3 bước: chọn gia sư xác minh → đặt lịch/giữ chỗ 15 phút → học xong mới giải ngân escrow 12h.
  - Rail dọc hairline, icon tròn nhỏ cobalt-50, chữ 12.5/11.
  - Footer link “Tìm hiểu cách bảo chứng →” → `/how-it-works`.
  - Không gọi API; không hiển thị số liệu động ngoài `totalCount` ở eyebrow.

**Mobile (<1024)**
- Một cột; H1 29px; sub 11.5px; search 48px; button “Tìm”.
- Ẩn trust panel dưới `lg` để giữ màn hình gọn; tag phổ biến ẩn dưới `sm`, có thể giữ ở `sm–lg` nếu đủ chỗ.
- Không căn giữa text; giữ trái-aligned.

### 6.3. Category bar

- Full-width surface, border-top/bottom hairline; nằm dưới hero.
- Bên trong `page-shell`; `display:flex`, gap 26px desktop / 18px mobile; `overflow-x:auto`, ẩn scrollbar; không wrap.
- Item: icon 15 + label 12.5/600; padding 15px 0 13px; border-bottom 2px transparent; `min-h-[44px]`.
- Active: cobalt text/icon + border-bottom cobalt; inactive body, hover ink.
- “Khác ▾”: giữ dropdown hiện có; panel trắng, border, radius 12, shadow nhẹ; item active cobalt + check.
- Giữ `role="tablist"`, `aria-selected`; nếu giữ tablist, bổ sung arrow-key navigation (roving tabindex); nếu không, đổi sang group button + `aria-pressed`.
- **Không hardcode thứ tự category**. Giữ logic ưu tiên hiện có trong `CategoryFilterBar` (CNTT, KHTN, KHXH, Kinh tế, Kỹ năng mềm, Ngoại ngữ; còn lại vào “Khác”). Mockup chỉ minh hoạ.
- “Tất cả môn học” dùng icon `grid` (hoặc `auto_stories` nếu giữ mapping cũ); active underline.

### 6.4. Workspace desktop

- `page-shell`; padding-top 30px, padding-bottom 56px.
- Grid `272px minmax(0, 1fr)`; gap 32px; align-start.
- Sidebar sticky `top: 88px` (topbar 72 + 16).
- Results:
  - Toolbar: title 24/800 “{totalCount} gia sư phù hợp” (loading: “Đang tìm kiếm gia sư...”); sub 11.5 “Xếp theo độ phù hợp với mục tiêu và ngân sách của bạn”; sort label + select 38px desktop / 44px mobile; border-bottom.
  - Quick chips: “Dưới 1 triệu”, “Đánh giá 4.8+”, “3–5 năm” (shortcut mới cho `experienceRange`); `aria-pressed`; active cobalt; row scroll ngang trên mobile.
  - Active filter bar: nền cobalt-50, border cobalt-100, radius 10; label “Đang lọc”; chips trắng, border cobalt-200; nút x 44px; “Xóa tất cả” bên phải.
  - Grid: 3 cột `xl` (≥1280), 2 cột `md` (≥768), 1 cột dưới; gap 20px; margin-top 18px.
  - Pagination: count “Hiển thị 1–12 trong {totalCount} gia sư” bên trái; `Pagination` bên phải; mobile căn giữa, có thể ẩn count.

### 6.5. Mobile

- Topbar 72px (dùng chung), logo + hamburger; drawer chứa nav.
- Hero một cột; category bar scroll ngang.
- Sticky toolbar ngay dưới topbar: `top: 72px`; nền canvas/95 + backdrop blur; border-bottom; z-index dưới topbar.
  - Nút “Bộ lọc” 44px + badge `activeFilters.length`.
  - Sort select compact bên phải; label “Sắp xếp” ẩn.
- Kết quả: count “{totalCount} gia sư” + “Đã lọc theo N tiêu chí” (nếu có); **không** hiển thị full active bar trên mobile; summary và nút x nằm trong drawer.
- Card 1 cột; avatar 42; name 13.5; price 15; CTA 44; left rule 3px; bio 2 dòng.
- Pagination cuối danh sách; giữ bottom padding cho `MobileFloatingDock`.
- Drawer:
  - `side="left"`, width 320px; header “Bộ lọc tìm kiếm” + close; body scroll.
  - Summary block đầu body: “Đang áp dụng N bộ lọc” + chips có nút x.
  - `FilterSidebar` đầy đủ bên dưới.
  - Footer cố định: “Xóa” + “Xem {totalCount} gia sư”; “Xem” đóng drawer, không reset filter.
  - Focus trap, Escape, restore focus; `aria-modal`/`role="dialog"` do `Drawer` đảm bảo (kiểm tra lại).

## 7. Thành phần

### 7.1. TutorCard

**Cấu trúc**
- Article trắng, border 1px, radius 12, padding 16, flex column, `h-full`.
- Left rule cobalt 3px, inset top/bottom 16px (dùng `::before`), thay cho top bar 4px hiện tại.
- Hover: border cobalt-200, shadow nhẹ, translateY(-1px); không shadow ở rest.
- Header:
  - Avatar 48px desktop / 42px mobile; fallback initials.
  - Tên 15/800, truncate; icon verified 13 nét trần màu green nếu `isVerified`.
  - Học vấn 10.5/12.5, một dòng, truncate; fallback `major · university` → `university` → `major` → `education`.
  - Rating row: star amber + `4,9` + `(128 đánh giá)` + `· 6 năm`; nếu chưa có đánh giá: badge “Chưa có đánh giá”.
- Subjects: tối đa 3, dạng text có border-bottom hairline, không pill; nếu >3 hiển thị `+N môn`.
- Bio: 2 dòng, 11/13, không dấu ngoặc kép; `title` chứa full text.
- Footer hairline:
  - Label mono “GIÁ GÓI TỪ” 7.5px uppercase.
  - Giá `formatVND(minPrice)` 16/800 tabular + `/ gói học` 8.5px; fallback “Xem chi tiết hồ sơ” nếu không có giá.
  - Heart icon button 36px desktop; trên mobile giữ hit area 44px (visual 36–40px), `aria-label` “Lưu gia sư”/“Bỏ lưu gia sư”; local state như hiện tại.
  - CTA `Xem hồ sơ` 36px desktop, 44px mobile, primary cobalt, link `/tutors/{id}`; không arrow để đủ chỗ.
- Không đổi data mapping/fallback hiện có; chỉ đổi presentation.
- Giá là **giá gói**, không đổi thành “/ buổi”.

### 7.2. FilterSidebar

- Giữ nguyên toàn bộ control và behavior:
  - Giá: `DualRangeSlider` + min/max boxes + 4 preset (`Tất cả`, `Dưới 1 triệu`, `1–2,5 triệu`, `2,5–5 triệu`).
  - Đánh giá: radio single-select, giữ options hiện có: `Tất cả đánh giá`, `4.8+`, `4.5+`, `4.0+`. **Không** thay bằng 5.0.
  - Kinh nghiệm: single-select, giữ `Tất cả`, `Dưới 1 năm`, `1–2 năm`, `3–5 năm`, `Từ 6 năm`. Có thể render dạng chip single-select; vẫn map về `experienceRange`.
  - Học vị: radio single-select, giữ options hiện có.
  - Trường: radio + ô tìm trường; giữ search.
  - Chứng chỉ: radio single-select, giữ options hiện có.
- Visual:
  - Card trắng, border, radius 14; bỏ shadow dày.
  - Header “Bộ lọc” + icon sliders + badge active count + “Đặt lại”.
  - Section header 12/700 + chevron; hairline giữa các section; `aria-expanded`/`aria-controls`.
  - Không lồng card trong card; dùng hairline.
- Footer summary (desktop): “Đang áp dụng N bộ lọc” + “{totalCount} kết quả”; dùng `activeFilters.length` để khớp active bar. Có thể thêm props optional `activeFilterCount`/`resultCount` hoặc render summary ở `Marketplace`; drawer ẩn footer này.
- Sidebar ẩn dưới `lg`; drawer dùng cùng component, chỉ mount một nơi (giữ logic hiện tại để không trùng id radio).

### 7.3. Toolbar, sort, quick chips, active chips

- Toolbar giữ `aria-live="polite"` cho count.
- Sort giữ `SORT_OPTIONS` hiện có; default `priority` (“Ưu tiên phù hợp”). Không đổi label option.
- Quick chips:
  - `Dưới 1 triệu`: toggle `minPrice=0`, `maxPrice=1.000.000`.
  - `Đánh giá 4.8+`: toggle `minRating=4.8`.
  - `3–5 năm`: toggle `experienceRange='3-5'` / `'All'`.
  - Tất cả reset page 1; `aria-pressed`.
- Active chips:
  - Giữ logic `activeFilters` hiện có; có thể rút gọn label hiển thị:
    - Category: tên category.
    - Price: “Học phí đến 5.000.000 ₫” / “Học phí từ ...” / “Học phí: ...”.
    - Rating: “Đánh giá 4.8+”.
    - Experience: “3–5 năm”.
    - Degree/university/certification: giữ prefix “Học vị:”, “Trường:”, “Chứng chỉ:”.
    - Search: `"keyword"`.
  - `aria-label` của nút x dùng label đầy đủ.
  - Xóa chip reset page 1.
  - “Xóa tất cả” gọi `handleResetFilters`.

### 7.4. Pagination

- Giữ `Pagination` component và `page`/`totalPages`/`onChange`.
- Thêm count text bên trái; tính `start = (pageNumber - 1) * pageSize + 1`, `end = min(pageNumber * pageSize, totalCount)`.
- Nút trang 32px desktop / 44px mobile; giữ `aria-current="page"` cho trang hiện tại nếu component hỗ trợ.
- `handlePageChange` giữ reset scroll; thay magic number 260 bằng ref tới toolbar kết quả và `scrollIntoView({ behavior: 'smooth', block: 'start' })` (tôn trọng reduced motion: dùng `auto` nếu reduced).
- Không hiển thị pagination khi loading hoặc `totalPages <= 1` (giữ logic hiện tại).

### 7.5. Trạng thái

**Loading**
- 6 skeleton card theo đúng layout 3/2/1 cột; giữ chiều cao tương đương card thật để tránh layout shift.
- Skeleton toolbar: title bar + sort bar; thêm `aria-live` sr-only “Đang tìm kiếm gia sư...”.
- Shimmer tôn trọng `prefers-reduced-motion`.

**Empty**
- Card trung tính (không nền đỏ), icon `search_off` 22 trong vòng cobalt-50.
- Title “Không tìm thấy gia sư phù hợp”; mô tả ngắn.
- Active chips (nếu có) + nút x 44px.
- Primary “Xóa bộ lọc” → `handleResetFilters`.
- Secondary “Khám phá danh mục” → reset category và scroll/focus category bar (hoặc mở “Khác” nếu phù hợp).
- Nếu không có filter: ẩn primary “Xóa bộ lọc”, chỉ hiển thị secondary “Khám phá danh mục”.

**Error**
- Card trung tính, icon `cloud_off` đỏ trong vòng đỏ nhạt.
- Title “Không thể tải danh sách gia sư”; message từ `error.message`.
- Trace ID/correlation ID dạng mono; với timeout 10s, gắn `traceId` = correlationId đã generate để hiển thị.
- Primary “Thử lại” → `handleRetry`; secondary “Về trang chủ” → `/` (giữ behavior hiện tại).
- `role="alert"`.

### 7.6. Drawer mobile

- Dùng `Drawer` hiện có; `side="left"`, width 320px.
- Header, summary chips, `FilterSidebar`, footer.
- Footer “Xóa” → `handleResetFilters`; “Xem {totalCount} gia sư” → đóng drawer.
- Body scroll; footer cố định; focus trap/Escape/restore focus.
- Summary chips dùng cùng `activeFilters`; nút x 44px; xóa chip reset page 1.

## 8. Dữ liệu và hành vi phải giữ nguyên

| State | API param | Ghi chú |
|---|---|---|
| `searchKeyword` / `debouncedKeyword` | `search` | debounce 300ms; URL `q`; submit/clear như hiện tại |
| `selectedCategory` | `categoryId` | `null` nếu rỗng; reset page 1 |
| `minPrice` / `maxPrice` | `minPrice` nếu >0; `maxPrice` nếu <5.000.000 | giá gói |
| `degreeLevel` | `degreeLevel` nếu != `All` | |
| `university` | `university` nếu != `All` | |
| `certification` | `certification` nếu != `All` | |
| `minRating` | `minRating` nếu khác null | |
| `experienceRange` | `minExperience` / `maxExperience` | giữ mapping hiện tại |
| `sortBy` | `sortBy` trừ `priority` → `null` | |
| `pageNumber` / `pageSize` | `pageNumber` / `pageSize=12` | reset page 1 khi filter đổi |
| `retryKey` | trigger refetch | “Thử lại” |
| `getCategories()` | mount | không hardcode category |
| `getTutors()` | filter/sort/page/retry | timeout 10s, abort, error |

- Không thêm API call mới.
- Không đổi `tutorService.getTutors` contract.
- Không đổi timeout 10s, abort cleanup, retry.
- `handleResetFilters` reset toàn bộ state + `setSearchParams({})`.
- `clearAndResetPage` giữ nguyên.
- Favorite vẫn local state; không persist.
- Trust panel static; không lấy dữ liệu.
- Hero count dùng `totalCount` optional; nếu không có thì chỉ hiện “Gia sư đã xác minh”.
- Category order lấy từ API + logic ưu tiên hiện có; mockup chỉ minh hoạ.
- Giá card là `minPrice` (giá gói); label “Giá gói từ” + “/ gói học”.

## 9. Responsive

| Breakpoint | Topbar | Hero | Sidebar | Grid | Ghi chú |
|---|---|---|---|---|---|
| `<640` | 72px, logo + hamburger | 1 cột, ẩn trust/tag | Drawer | 1 cột | Sticky toolbar; card 1 cột |
| `640–767` | 72px, hamburger | 1 cột | Drawer | 1 cột | Trust ẩn; có thể hiện tag |
| `768–1023` | 72px, hamburger (nav ẩn) | 1 cột | Drawer | 2 cột | Trust ẩn; drawer có đủ 4 nav link |
| `1024–1279` | 72px, nav giữa 4 link | 2 cột | 272px sticky | 2 cột | Bắt đầu hiện sidebar |
| `1280+` | 72px, nav giữa 4 link | 2 cột | 272px sticky | 3 cột | Layout chuẩn |
| `1440` | `page-shell` căn giữa | 2 cột | 272px | 3 cột | Max width theo `page-shell` |

- `page-shell` hiện có (max 80rem/1280) được dùng để topbar và nội dung thẳng hàng; mockup 1240 chỉ là tham chiếu.
- Sidebar sticky `top: 88px`; mobile toolbar sticky `top: 72px`.
- Drawer width 320px; dưới 360px viewport vẫn phải dùng được (max-width 90vw nếu cần).

## 10. Accessibility

- Topbar: `nav aria-label="Điều hướng chính"`; `aria-current="page"` cho link active; focus ring 2px cobalt + offset.
- Category: `role="tablist"` + `aria-selected`; nếu giữ tablist phải có arrow-key navigation/roving tabindex. Nếu không, dùng group button + `aria-pressed`.
- Filter section: button với `aria-expanded`, `aria-controls`; label radio đầy đủ; input có `name`.
- Quick chips: `aria-pressed`; active chips: nút x có `aria-label` đầy đủ, target 44px.
- Count: `aria-live="polite"`; loading có `role="status"` + sr-only text.
- Error: `role="alert"`; trace ID đọc được.
- Drawer: `role="dialog"`, `aria-modal="true"`, focus trap, Escape, restore focus; kiểm tra `Drawer` hiện có.
- Card: tên là link; CTA là link; heart là button có label; icon verified có label; rating có text đọc được (“4,9 trên 5, 128 đánh giá”).
- Contrast: kiểm tra cobalt trên trắng, body trên trắng, amber star trên trắng, focus ring.
- Touch target: tối thiểu 44×44px trên mobile cho nav, filter, chip x, pagination, heart (có thể dùng padding ẩn); desktop có thể 32–36px nếu có spacing.
- Reduced motion: tắt shimmer/hover transform; smooth scroll dùng `auto`.
- Keyboard: toàn bộ filter/sort/pagination dùng được không cần chuột; thứ tự tab hợp lý.

## 11. Implementation notes

### Files dự kiến

- `src/frontend/src/pages/discovery/Marketplace.jsx`
- `src/frontend/src/components/discovery/HeroSection.jsx`
- `src/frontend/src/components/discovery/CategoryFilterBar.jsx`
- `src/frontend/src/components/discovery/FilterSidebar.jsx`
- `src/frontend/src/components/discovery/TutorCard.jsx`
- `src/frontend/src/components/layout/PublicTopbar.jsx`
- `src/frontend/index.html` (thêm Plus Jakarta Sans)
- `src/frontend/src/styles/marketplace.css` (mới)
- Có thể thêm:
  - `src/frontend/src/components/discovery/MarketplaceStates.jsx`
  - `src/frontend/src/components/discovery/MarketplaceCardSkeleton.jsx`
  - `src/frontend/src/components/discovery/ActiveFilterBar.jsx`

### Cách ly style

- Wrap marketplace trong `<div className="marketplace-v2 ...">`.
- Khai báo `--mkt-*` trong `.marketplace-v2`; class tiện ích `.mkt-display`, `.mkt-body`, `.mkt-mono`, `.mkt-card`, `.mkt-shell` (nếu cần).
- Không sửa `tokens.css`, `tailwind.config.js`, hoặc class toàn cục.
- Không đổi `Card`, `Button`, `Input`, `Select`, `Pagination` toàn cục; nếu cần variant, thêm prop optional mặc định giữ nguyên output cũ.
- Với `EmptyState`/`ErrorState`: thêm prop `variant="marketplace"` (backward compatible) hoặc tạo wrapper riêng; không đổi output mặc định.
- Với skeleton: tạo `MarketplaceCardSkeleton` hoặc thêm variant; không đổi `CardSkeleton` mặc định.

### Topbar

- `PublicTopbar` đổi layout sang grid 3 cột; nav căn giữa; thêm link; bỏ link trùng bên phải.
- Đổi breakpoint nav/hamburger/drawer từ `md` sang `lg`.
- Cập nhật label nav khách thành `Tìm gia sư`, `Dịch vụ`, `Trở thành gia sư`, `Cách hoạt động`.
- Giữ height 72px và auth hierarchy hiện tại.
- Kiểm tra các trang public khác (services, how-it-works, become-tutor, checkout guest) vì topbar dùng chung.
- Nếu phát hiện offset sticky `top-[72px]`/`top-[88px]` ở trang khác, giữ nguyên vì height không đổi.

### Sticky và scroll

- Sidebar marketplace `lg:top-[88px]`.
- Mobile toolbar `top: 72px`.
- `handlePageChange` dùng ref tới toolbar kết quả thay vì `top: 260`.
- Drawer/footer không bị `MobileFloatingDock` che; kiểm tra z-index và padding bottom.

### Fonts

- Thêm `Plus Jakarta Sans:wght@500;600;700;800` vào link Google Fonts trong `index.html`; giữ `Be Vietnam Pro`, `Inter`, `JetBrains Mono`.
- Dùng `display=swap`; fallback system.
- Không đổi `fontFamily` toàn cục.

## 12. Acceptance criteria

1. Ở desktop ≥1024, topbar có 4 link khách đúng thứ tự: `Tìm gia sư` → `Dịch vụ` → `Trở thành gia sư` → `Cách hoạt động`; cụm nav căn giữa; link active có gạch chân cobalt; không còn “Trở thành gia sư” trùng bên phải.
2. Ở `<1024`, nav ngang ẩn; hamburger mở drawer có đủ 4 link đúng thứ tự; chọn link đóng drawer.
3. Hero desktop 2 cột; mobile 1 cột; search submit, clear, debounce 300ms, URL `q` hoạt động như cũ.
4. Category bar lấy dữ liệu từ API, giữ logic ưu tiên và “Khác”; active underline; scroll ngang khi tràn; không hardcode thứ tự.
5. Tất cả filter hiện có hoạt động: giá, đánh giá (4.8/4.5/4.0/Tất cả), kinh nghiệm, học vị, trường + search, chứng chỉ; reset page 1 khi đổi.
6. Active chips hiển thị đúng, xóa từng chip và “Xóa tất cả” reset toàn bộ; count/badge khớp.
7. Card hiển thị tên, xác minh, học vấn 1 dòng, rating + số đánh giá + kinh nghiệm, tối đa 3 môn, bio 2 dòng, giá gói, CTA, heart; fallback không có giá/đánh giá đúng.
8. Sort 5 option hoạt động; page size 12; pagination đúng; đổi trang scroll tới toolbar kết quả.
9. Loading hiển thị 6 skeleton đúng layout; empty có chips + “Xóa bộ lọc” + “Khám phá danh mục”; error có trace ID + “Thử lại” + “Về trang chủ”; timeout 10s vẫn hoạt động.
10. Mobile 390: toolbar dính; filter badge; card 1 cột; drawer 320 có summary chips + footer; focus trap/Escape/restore focus.
11. Keyboard: tab được qua nav, category, filter, sort, card CTA, heart, pagination; focus ring rõ; không có bẫy focus ngoài drawer.
12. Contrast đạt WCAG AA cho text/UI; touch target ≥44px trên mobile; reduced motion tắt shimmer/hover transform.
13. Không thay đổi `tokens.css`/`tailwind.config.js`/API; các màn hình khác chỉ chịu thay đổi topbar đã duyệt.
14. `npm run lint` và `npm run build` pass.

## 13. Kiểm tra

- `cd src/frontend && npm run lint`
- `cd src/frontend && npm run build`
- Manual ở 390, 768, 1024, 1280, 1440.
- Simulate: API chậm >10s (timeout), API lỗi 500/network, empty result, filter cực hẹp.
- Keyboard-only: topbar → hero search → category → filter → sort → card → pagination.
- Screen reader spot-check: count live region, error alert, drawer dialog, card rating/verified.
- Visual regression: `/services`, `/how-it-works`, `/become-tutor`, checkout guest (topbar dùng chung).

## 14. Rủi ro và câu hỏi mở

- **Topbar dùng chung:** thay đổi nav/breakpoint ảnh hưởng mọi public page. Đã chọn cập nhật toàn cục (không dùng variant) vì link nav bị thiếu ở mọi trang; bù lại bằng visual regression ở các trang public.
- **Filter control semantics:** mockup dùng checkbox/select cho gọn; implementation phải giữ radio single-select và ô search trường. Không biến rating thành multi-select.
- **Giá gói vs giá buổi:** `minPrice` là giá gói; không đổi label thành “/ buổi”.
- **Rating options:** giữ `4.0+` và `Tất cả`; mockup’s `5.0` chỉ là minh hoạ, không implement.
- **Category order:** data-driven; không copy thứ tự mockup.
- **Hero count:** dùng `totalCount` động hoặc bỏ số; không hardcode 1.240.
- **Font FOUT:** Plus Jakarta Sans tải thêm; dùng `display=swap`, kiểm tra layout với fallback.
- **Drawer height:** summary + 6 filter sections có thể vượt viewport; body scroll, footer cố định; test 390×667.
- **Sticky offset:** giữ topbar 72px để không phá offset hiện có; nếu đổi height phải audit toàn bộ `top-[...]`.
- **Mockup simplifications:** topbar 66px, auth emphasis, select controls, 5.0 rating, 1.240 count, category order — không phải tất cả đều là yêu cầu implement; spec này là nguồn chính.


