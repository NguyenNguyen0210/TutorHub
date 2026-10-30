# Bộ lọc giá `/services` — Design Spec

**Ngày:** 2026-10-31
**Trạng thái:** Đã duyệt hướng (chỉ khối giá, thang 0–10 triệu) — spec chờ review
**Phạm vi:** `/services` — Services Marketplace
**Liên quan:** khối giá của `/` (Marketplace gia sư) đã hoàn thành ngày 2026-10-30

---

## 1. Tóm tắt

Thay khối "Học phí trọn gói" một đầu trượt ở sidebar `/services` bằng **bộ lọc khoảng giá hai đầu** giống `/`: dòng đọc giá trị, thanh trượt mỏng, hai ô nhập **Từ / Đến**, và 4 preset. Toàn bộ hành vi lọc, sắp xếp, phân trang, chip lọc và drawer mobile hiện có được giữ nguyên; chỉ bổ sung chiều **giá tối thiểu** (backend đã hỗ trợ sẵn).

## 2. Mục tiêu

- Người học lọc được **khoảng giá** (`min`–`max`) thay vì chỉ "tối đa".
- Nhập chính xác số tiền bằng tay, không phải kéo mò.
- Preset bù cho thực tế dữ liệu: 18 dịch vụ hiện có giá 800.000–1.800.000đ, nằm gọn trong 18% đầu của thang 0–10 triệu.
- Kéo thanh trượt mượt: không bắn request theo từng bước kéo, không nhảy layout.
- Dùng lại đúng ngôn ngữ thị giác của `/` (cobalt `#2563eb`, track 4px, thumb trắng viền cobalt, ô nhập 38px, preset 2×2).

## 3. Không nằm trong phạm vi

- Backend/API/database: `GET /services` đã nhận `minPrice`, `maxPrice` và lọc `Price >= min && <= max`.
- Restyle các mục khác của sidebar `/services` (danh mục, môn học, đánh giá, header).
- Đổi nghĩa dữ liệu: `Price` vẫn là **giá trọn gói** của dịch vụ, không phải giá/buổi.
- Đồng bộ bộ lọc giá lên URL (hiện `/services` chỉ đọc `q`, `categoryId`, `subjectId`).
- Thay đổi `MAX_PRICE` của trang (`10.000.000`).
- Preset động theo dữ liệu (không có endpoint trả min/max giá).

## 4. Hiện trạng và ràng buộc

| Hạng mục | Hiện tại |
| --- | --- |
| API | `GET /services?minPrice&maxPrice&categoryId&subjectId&minRating&search&sortBy&pageNumber&pageSize` |
| Handler | `s.Price >= MinPrice` và `s.Price <= MaxPrice` (`GetPublicServicesQueryHandler`) |
| Service FE | `tutorService.getPublicServices` đã forward `minPrice`/`maxPrice` |
| State trang | `priceRange` (number, mặc định `MAX_PRICE = 10.000.000`) |
| Sidebar | 1 input `range` 500.000–10.000.000, step 500.000, không ô nhập, không preset |
| Chip | `Học phí ≤ {priceRange}` |
| Quick chip | "Dưới 1 triệu" bật/tắt `priceRange <= 1.000.000` |
| Style | Trang đã import `marketplace.css` và root có `.marketplace-v2`; các class `.mkt-price-*` dùng được ngay |

Ràng buộc: `minPrice > maxPrice` trả về danh sách rỗng, nên **frontend phải luôn bảo đảm `min ≤ max`** trước khi gọi API.

## 5. Thiết kế

### 5.1. Thang giá và preset

- `priceLimit = 10.000.000`, `min = 0`, `step = 100.000`.
- `max = priceLimit` nghĩa là **không giới hạn trên** → không gửi `maxPrice` lên API.
- `min = 0` nghĩa là **không giới hạn dưới** → không gửi `minPrice`.
- Preset (2×2):

| Nhãn | Khoảng |
| --- | --- |
| Tất cả | 0 – 10.000.000 |
| Dưới 1 triệu | 0 – 1.000.000 |
| 1 – 2 triệu | 1.000.000 – 2.000.000 |
| Trên 2 triệu | 2.000.000 – 10.000.000 |

Preset đang đúng khoảng hiện tại có `aria-pressed="true"`.

### 5.2. Khối UI

Thứ tự trong section "Học phí trọn gói":

1. **Dòng đọc**: `Mức giá:` (nhãn xám) + `800.000 ₫ – 1.800.000 ₫` (cobalt, đậm, tabular-nums), căn hai đầu.
2. **Thanh trượt hai đầu**: track 4px `#e8eef7`, đoạn chọn `#9cc0fb`, thumb 15px trắng viền 2px cobalt, focus ring 4px. Không dùng transform/scale trên thumb.
3. **Hai ô nhập**: nhãn `Từ` / `Đến`, input 38px, viền `--mkt-line`, focus viền cobalt; gõ tự format hàng nghìn kiểu vi-VN; `Enter` hoặc rời ô là áp dụng.
4. **Preset**: grid 2 cột, nút 44px, viền nhạt, trạng thái chọn nền cobalt-50 + viền cobalt.

Khối giá dùng lại đúng các class `.mkt-price-readout`, `.mkt-price-slider`, `.mkt-price-inputs`, `.mkt-price-field`, `.mkt-price-presets`, `.mkt-filter-chip-grid` — không thêm CSS mới nếu không cần.

### 5.3. Hành vi

**Chuẩn hoá giá trị**
- Kéo thanh trượt: `onChange([min, max])` với `min ≤ max`, cả hai trong `[0, priceLimit]`.
- Gõ ô `Từ`: bỏ ký tự không phải số → làm tròn về bội số `step` → kẹp `[0, max hiện tại]`.
- Gõ ô `Đến`: tương tự, kẹp `[min hiện tại, priceLimit]`.
- Ô trống coi như `0`.
- Giá trị đang gõ giữ ở state nháp, chỉ đồng bộ lại khi blur/Enter hoặc khi giá trị thật đổi.

**Gọi API**
- `minPrice`/`maxPrice` được **debounce 300ms** trước khi đưa vào effect tải dữ liệu (giống `debouncedKeyword`), để kéo thanh trượt không bắn request mỗi bước và không bật skeleton liên tục.
- Reset filter đặt thẳng giá trị debounce để áp dụng ngay, không chờ 300ms.
- Mỗi lần đổi giá: `pageNumber = 1`.

**Chip lọc đang áp dụng**
- Có cả hai đầu: `Học phí: 1.000.000 ₫ – 2.000.000 ₫`
- Chỉ có min: `Học phí: từ 1.000.000 ₫`
- Chỉ có max: `Học phí: đến 2.000.000 ₫`
- Nút `×` gỡ cả hai đầu về `0 – 10.000.000` và reset trang 1.

**Quick chip "Dưới 1 triệu"**
- Bật khi `minPrice === 0 && maxPrice <= 1.000.000`.
- Bấm khi đang bật → về `0 – 10.000.000`; bấm khi đang tắt → `0 – 1.000.000`.

**Reset toàn bộ**
- `handleResetFilters` đặt `minPrice = 0`, `maxPrice = priceLimit`, đồng thời cập nhật giá trị debounce.

### 5.4. Thành phần và props

Tách khối giá thành component dùng chung để `/` và `/services` không lặp logic:

`components/discovery/PriceRangeFilter.jsx`
```jsx
<PriceRangeFilter
  min={number}            // giá trị min hiện tại
  max={number}            // giá trị max hiện tại
  limit={number}          // trần thanh trượt (10.000.000)
  step={number}           // mặc định 100.000
  presets={[{ label, min, max }]}
  onChange={([min, max]) => void}
  ariaLabelMin, ariaLabelMax
/>
```
Bên trong component: dòng đọc, `DualRangeSlider`, hai ô nhập, preset, toàn bộ logic nháp/kẹp/làm tròn.

`ServiceFilterSidebar` đổi props giá:
- Bỏ: `priceRange`, `onPriceRangeChange`, `maxPrice` (mặc định 10.000.000).
- Thêm: `minPrice`, `maxPrice`, `priceLimit`, `onPriceChange({ min, max })`.

`FilterSidebar` (trang `/`) chuyển sang dùng `PriceRangeFilter` với preset hiện có, giữ nguyên props `minPrice`/`maxPrice`/`priceLimit`/`onPriceChange` và hành vi.

## 6. Luồng dữ liệu

```
Kéo slider / gõ ô / bấm preset
        ↓
onChange([min, max])  →  ServicesMarketplace: setMinPrice/setMaxPrice + pageNumber = 1
        ↓ (debounce 300ms)
debouncedMinPrice / debouncedMaxPrice
        ↓
tutorService.getPublicServices({ minPrice, maxPrice, ... })
        ↓
GET /services?minPrice=…&maxPrice=…&pageNumber=1&pageSize=12
```

## 7. Accessibility

- Hai `input[type=range]` có `aria-label` ("Giá dịch vụ tối thiểu/tối đa") và `aria-valuemin/max/now`.
- Hai ô nhập có `aria-label` rõ ràng, `inputMode="numeric"`, nhãn hiển thị Từ/Đến.
- Preset dùng `aria-pressed`.
- Vùng chạm tối thiểu 44px cho preset và nút; ô nhập 38px nằm trong label đủ lớn.
- Focus-visible ring 3px cobalt cho input và slider; không phụ thuộc màu đơn thuần (preset có cả viền + nền).

## 8. Responsive

- Desktop: sidebar rộng 288px; khối giá dùng đúng bố cục 2 cột ô nhập + 2×2 preset.
- Mobile (< lg): cùng component trong drawer `w-[340px] max-w-[92vw]`, panel có `marketplace-v2` nên token màu đúng.
- Không thay đổi chiều cao header/section khi giá trị đổi (tránh layout shift khi kéo).

## 9. Acceptance criteria

1. `/services` có thanh trượt hai đầu 0–10 triệu, step 100.000; kéo được cả hai đầu, thumb không nhảy khỏi track.
2. Hai ô Từ/Đến nhập được, tự format hàng nghìn, `Enter`/blur áp dụng; nhập vượt biên bị kẹp; `min` không vượt `max`.
3. 4 preset hoạt động đúng khoảng, `aria-pressed` phản ánh trạng thái.
4. Kéo thanh trượt: **0 request** trong lúc kéo, đúng **1 request** sau khi ngừng 300ms, URL có `minPrice`/`maxPrice` tương ứng (bỏ tham số khi ở biên).
5. Danh sách, số kết quả, phân trang cập nhật theo khoảng giá.
6. Chip "Học phí: …" đúng định dạng 3 trường hợp; nút × gỡ cả hai đầu.
7. Quick chip "Dưới 1 triệu" đồng bộ hai chiều với khối giá.
8. Reset xóa cả min lẫn max và trả trang về 1.
9. Drawer mobile hiển thị và thao tác được; chiều cao panel không đổi khi kéo.
10. Trang `/` giữ nguyên hành vi sau khi tách `PriceRangeFilter`.
11. `npm run lint` và `npm run build` pass.

## 10. Kiểm tra

- `npm run lint`, `npm run build` trong `src/frontend`.
- Trình duyệt 1440px và 390px: kéo cả hai đầu, đếm request qua `page.on('request')`, kiểm tra vị trí Y của thanh trượt không đổi khi kéo, thử preset, gõ ô nhập với giá trị vượt biên, kiểm tra chip và reset.
- So sánh hành vi khối giá trang `/` trước/sau refactor.

## 11. Rủi ro

- **Thang 0–10 triệu rộng so với dữ liệu thực**: vùng 0,8–1,8 triệu chỉ chiếm 18% thanh trượt. Giảm thiểu bằng preset + ô nhập; nếu sau này dữ liệu dày ở khoảng khác thì cân nhắc preset động.
- **Tách component dùng chung** có thể ảnh hưởng trang `/`: giảm thiểu bằng cách giữ nguyên props và kiểm tra lại toàn bộ hành vi slider/nhập/preset ở `/`.
- **Debounce 300ms** làm kết quả cập nhật chậm hơn một nhịp so với tay kéo; đây là chủ ý để tránh dội request.
