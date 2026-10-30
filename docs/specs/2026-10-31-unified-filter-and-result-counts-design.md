# Thống nhất hiển thị số lượng kết quả và bộ lọc — Design Spec

**Ngày:** 2026-10-31  
**Trạng thái:** Đã duyệt thiết kế (Phương án 1 — Chuẩn Marketplace)  
**Phạm vi:** `/` (Marketplace gia sư) và `/services` (Marketplace dịch vụ học tập)  

---

## 1. Tóm tắt

Dọn dẹp và thống nhất hiển thị thông tin số lượng kết quả (`totalCount`) và số lượng bộ lọc (`activeCount`) trên cả hai trang Marketplace (`/` và `/services`). Loại bỏ các vị trí đếm phân mảnh, thừa thãi (như `Đang áp dụng 0 bộ lọc`, `{totalCount} kết quả` ở chân sidebar, text lặp lại ở subtitle). Quy về đúng **1 vị trí duy nhất cho số lượng kết quả** và **1 chỉ báo gọn nhẹ duy nhất cho số lượng bộ lọc** khi có kích hoạt.

## 2. Mục tiêu

- **Duy nhất 1 nơi hiển thị số lượng kết quả:** Đặt tại Toolbar đầu danh sách kết quả (phía trên danh sách card): `{totalCount} gia sư phù hợp` / `{totalCount} dịch vụ phù hợp`.
- **Loại bỏ hiển thị số 0 vô nghĩa:** Khi chưa áp dụng bộ lọc nào (`activeCount === 0`), không bao giờ hiện dòng chữ `0 bộ lọc` hay badge `0`.
- **Gọn gàng Sidebar:**
  - Bỏ hoàn toàn footer đếm ở đáy sidebar (`Đang áp dụng N bộ lọc - M kết quả`).
  - Badge số đếm trên header sidebar chỉ hiện khi `activeCount > 0`.
- **Thanh Chip lọc trực quan:** Giữ hàng chip `Đang lọc: [Tiêu chí ×] [Xóa bộ lọc]`, loại bỏ các dòng text phụ như `Đã lọc theo N tiêu chí`.
- **Đồng bộ trải nghiệm Mobile và Desktop:** Nút `Bộ lọc` trên mobile toolbar chỉ đính badge số khi `activeCount > 0`.

## 3. Không nằm trong phạm vi

- Không thay đổi logic truy vấn API backend hay cấu trúc query parameters.
- Không thay đổi các tiêu chí lọc, sắp xếp, phân trang hay logic URL sync.
- Không thay đổi thiết kế các thẻ card gia sư và dịch vụ.

## 4. Chi tiết thay đổi

### 4.1. Trang `/` (`Marketplace.jsx` & `FilterSidebar.jsx`)

1. **`FilterSidebar.jsx`:**
   - Header badge: Thay vì `<span className="mkt-filter-count">{activeCount}</span>` luôn hiện, chỉ render khi `activeCount > 0`.
   - Bỏ prop `footer` hoặc dọn dẹp footer không còn cần thiết.
2. **`Marketplace.jsx`:**
   - Bỏ hoàn toàn prop `footer` truyền vào `renderFilterSidebar`:
     - Xóa dòng `Đang áp dụng {activeFilters.length} bộ lọc` và `{formatCount(totalCount)} kết quả` ở đáy sidebar.
   - Toolbar danh sách kết quả (cột phải):
     - Tiêu đề `h2`:
       - Khi loading: `Đang tìm kiếm gia sư...`
       - Khi rỗng (`totalCount === 0` và không loading): `Không tìm thấy gia sư phù hợp`
       - Khi có kết quả: `{formatCount(totalCount)} gia sư phù hợp`
     - Subtitle bên dưới:
       - Nếu có `searchKeyword.trim()`: hiển thị `Kết quả tìm kiếm cho "{searchKeyword.trim()}"`.
       - Nếu không có từ khóa: hiển thị gợi ý ngắn gọn hoặc ẩn, xóa dòng đếm trùng lặp `${formatCount(totalCount)} hồ sơ phù hợp...`.
       - Xóa dòng text mobile `Đã lọc theo {activeFilters.length} tiêu chí`.
   - Mobile drawer: Bỏ dòng chữ đếm thừa dưới chân drawer nếu có, giữ lại nút hành động.

### 4.2. Trang `/services` (`ServicesMarketplace.jsx` & `ServiceFilterSidebar.jsx`)

1. **`ServiceFilterSidebar.jsx`:**
   - Header badge: Đã có điều kiện `activeCount > 0` (giữ nguyên).
   - Footer đáy sidebar: Xóa dòng `<span><strong>{activeCount}</strong> bộ lọc đang dùng</span>`, giữ nút `Xóa lọc` (chỉ enable khi `activeCount > 0`) hoặc đưa nút về dạng icon gọn gàng giống `FilterSidebar.jsx`.
2. **`ServicesMarketplace.jsx`:**
   - Toolbar danh sách kết quả:
     - Tiêu đề `h2`:
       - Khi loading: `Đang tìm kiếm dịch vụ...`
       - Khi rỗng: `Không tìm thấy dịch vụ phù hợp`
       - Khi có kết quả: `{totalCount} dịch vụ phù hợp`
     - Subtitle: `So sánh lộ trình, gia sư và học phí trọn gói.`
   - Mobile sticky bar:
     - Xóa span text `{totalCount} kết quả` thừa ở thanh mobile toolbar (vì tiêu đề `h2` ngay bên dưới đã thể hiện rõ).

## 5. Acceptance Criteria

1. Khi không có bộ lọc nào được chọn (`activeCount === 0`):
   - Không xuất hiện bất kỳ chuỗi ký tự nào như "0 bộ lọc" hay "Đang áp dụng 0 bộ lọc".
   - Header sidebar ở cả hai trang không hiển thị badge số `0`.
   - Nút mobile "Bộ lọc" không có badge số `0`.
2. Số lượng kết quả (`totalCount`):
   - Chỉ xuất hiện duy nhất ở tiêu đề toolbar danh sách kết quả: ví dụ `10 gia sư phù hợp` hoặc `18 dịch vụ phù hợp`.
   - Không còn dòng text `{totalCount} kết quả` ở chân sidebar hay thanh mobile toolbar.
3. Khi áp dụng bộ lọc (`activeCount > 0`):
   - Badge số đếm `{activeCount}` xuất hiện trên header sidebar và nút `Bộ lọc` mobile.
   - Hàng chip `Đang lọc: ...` hiển thị đầy đủ các tiêu chí và nút xóa.
4. Giao diện sạch sẽ, không bị nhảy layout (layout shift) khi chuyển đổi giữa có lọc và không lọc.
5. `npm run lint` và `npm run build` vượt qua 100%.
