# Thiết kế Cụm Đồ họa Hero Banner Trang Dịch vụ (/services)

- **Ngày tạo:** 31-10-2026
- **Trạng thái:** Đã phê duyệt (Approved)
- **Tác giả:** AI Assistant & Người dùng
- **Phạm vi:** `src/frontend/src/components/discovery/ServiceHeroVisual.jsx`, `src/frontend/src/components/discovery/ServiceHeroSection.jsx`, `src/frontend/src/pages/discovery/ServicesMarketplace.jsx`

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Bối cảnh
Trang `/services` hiện đang hiển thị banner đầu trang (`ServiceHeroSection.jsx`) với 2 cột:
- **Cột trái:** Tiêu đề "Chọn đúng gói học. Theo đúng lộ trình của bạn.", mô tả ngắn, ô tìm kiếm dịch vụ và các thẻ gợi ý nhanh.
- **Cột phải:** Khối thẻ màu trắng có tiêu đề *"Khám phá theo nhu cầu / Gói học đang được quan tâm"*, chứa 2 thẻ dịch vụ mẫu (sample services) và 3 dòng text cam kết.

Khối thẻ ở cột phải hiện tại chiếm nhiều diện tích nhưng mang tính chất lặp lại nội dung danh sách dịch vụ bên dưới, chưa tạo được điểm nhấn thị giác thu hút và chưa đồng bộ phong cách đồ họa với trang chủ `/` và trang `/become-tutor`.

### 1.2 Mục tiêu
- Thay thế hoàn toàn khối thẻ *"Khám phá theo nhu cầu"* ở cột phải banner trang `/services` bằng cụm đồ họa minh họa học viên chất lượng cao (student hero cutout) kèm các thẻ nổi (floating badges) và chữ typography nghệ thuật tương tự trang `/become-tutor`.
- Giữ nguyên toàn bộ cấu trúc và chức năng tìm kiếm ở cột trái (tiêu đề, thanh search, quick tags).
- Tối ưu hiển thị responsive: Cụm đồ họa chỉ hiển thị trên màn hình máy tính (`hidden lg:block`) để giữ không gian gọn gàng cho thanh tìm kiếm trên thiết bị di động.
- Tách thành component độc lập `ServiceHeroVisual.jsx` để mã nguồn sạch, tuân thủ Design System và dễ bảo trì.

---

## 2. Kiến trúc & Cấu trúc Component

```
ServiceHeroSection (Section wrapper)
 ├── Background Gradients & Dot Matrix (Hiệu ứng nền hiện có)
 └── Container
      ├── Left Column (lg:col-span-6 / max-w-[720px])
      │    ├── Badge: "GÓI HỌC RÕ RÀNG · GIA SƯ ĐÃ XÁC MINH"
      │    ├── Heading: "Chọn đúng gói học. Theo đúng lộ trình của bạn."
      │    ├── Subtitle: "So sánh số buổi, thời lượng và học phí..."
      │    ├── Search Form & Quick Tags (Giữ nguyên)
      │
      └── Right Column (hidden lg:block)
           └── <ServiceHeroVisual /> (Component đồ họa mới)
                ├── Ambient Glow (Vòng sáng mờ xanh dương)
                ├── Slogan Typography (Chữ nghệ thuật nghiêng)
                ├── Hero Student Image (/images/transparent-student-clean.png)
                └── 3 Floating Badges (Thẻ nổi nhấp nhô CSS float)
```

---

## 3. Đặc tả Kỹ thuật Chi tiết

### 3.1 Component Mới: `ServiceHeroVisual.jsx`
- **Đường dẫn:** `src/frontend/src/components/discovery/ServiceHeroVisual.jsx`
- **Nhiệm vụ:** Đảm nhiệm hiển thị toàn bộ phần đồ họa ở cột bên phải.
- **Chi tiết giao diện:**
  1. **Lớp ánh sáng nền (Ambient Glow):**
     - Đặt tại tâm: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-blue-100/70 rounded-full blur-3xl pointer-events-none`
  2. **Chữ nghệ thuật (Typography Accents):**
     - Góc trên - Trái:
       ```jsx
       <p aria-hidden="true" className="hidden xl:block absolute top-2 left-0 -rotate-6 text-sm font-semibold italic text-blue-800/80 leading-tight select-none">
         Learn<br />Practice<br />Achieve<br />Excel.
       </p>
       ```
     - Góc dưới - Phải:
       ```jsx
       <p aria-hidden="true" className="hidden xl:block absolute bottom-2 right-2 rotate-6 text-sm font-semibold italic text-blue-800/80 leading-tight text-right select-none">
         Better<br />Learning<br />Brighter Future.
       </p>
       ```
  3. **Hình ảnh trung tâm (Student Cutout):**
     - Nguồn: `/images/transparent-student-clean.png`
     - Kích thước: `w-full max-w-[480px] h-auto object-contain select-none pointer-events-none drop-shadow-md`
     - Tải nhanh: `loading="eager"`
     - Accessibility: `alt="Học viên lựa chọn dịch vụ học tập trực tuyến cùng TutorHub"`
  4. **3 Thẻ nổi (Floating Badges):**
     - Các thẻ sử dụng nền `bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg px-3.5 py-2.5 flex items-center gap-3 transition-transform`.
     - Hiệu ứng chuyển động: `animate-float` (với `@media (prefers-reduced-motion)` tắt hiệu ứng).
     - **Badge 1 (Góc trên phải - `top-2 -right-2 sm:right-0`):**
       - Icon: `group` trong khung tròn `bg-blue-50 text-blue-600`
       - Chỉ số: **500+** (font bold, text-slate-900)
       - Chú thích: *Học viên tin tưởng* (text-xs, text-slate-500)
       - Delay: `0s`
     - **Badge 2 (Góc giữa phải - `top-1/3 -right-3 sm:right-1`):**
       - Icon: `star` trong khung tròn `bg-amber-50 text-amber-500`
       - Chỉ số: **4.9/5** (font bold, text-slate-900)
       - Chú thích: *Đánh giá trung bình* (text-xs, text-slate-500)
       - Delay: `0.8s`
     - **Badge 3 (Góc dưới trái - `bottom-6 -left-3 sm:left-0`):**
       - Icon: `verified_user` trong khung tròn `bg-emerald-50 text-emerald-600`
       - Chỉ số: **Bảo chứng an toàn** (font bold, text-slate-900)
       - Chú thích: *Thanh toán minh bạch* (text-xs, text-slate-500)
       - Delay: `1.4s`

### 3.2 Cập nhật `ServiceHeroSection.jsx`
- Xóa bỏ import không cần thiết: `Link`, `Money`.
- Import component mới: `import ServiceHeroVisual from './ServiceHeroVisual';`.
- Xóa bỏ prop `sampleServices` và biến tính toán `visibleSamples`.
- Thay thế toàn bộ thẻ `<div className="hidden lg:block">...</div>` cũ bằng:
  ```jsx
  <div className="hidden lg:flex items-center justify-center">
    <ServiceHeroVisual />
  </div>
  ```

### 3.3 Dọn dẹp tại `ServicesMarketplace.jsx`
- Loại bỏ truyền prop `sampleServices={sampleServices}` vào `<ServiceHeroSection />`.
- Giữ logic lấy dữ liệu dịch vụ của trang phục vụ cho danh sách kết quả, loại bỏ code thừa nếu có liên quan riêng đến sample hero.

---

## 4. Trạng thái Giao diện & Khả năng Tiếp cận (UX & Accessibility)

| Màn hình / Trạng thái | Hành vi hiển thị |
| :--- | :--- |
| **Desktop (>= 1024px)** | Hiển thị trọn vẹn cụm visual: hình ảnh sinh viên, 3 badges nhấp nhô nhẹ, 2 cụm slogan nghệ thuật. |
| **Mobile & Tablet (< 1024px)** | Ẩn hoàn toàn cụm visual (`hidden lg:block`), nhường trọn vẹn không gian màn hình nhỏ cho thanh tìm kiếm và bộ lọc. |
| **Prefers Reduced Motion** | Nếu người dùng bật cài đặt giảm chuyển động, hiệu ứng `animate-float` tự động ngừng để đảm bảo thân thiện người dùng. |
| **Screen Reader / A11y** | Hình ảnh có `alt` mô tả chuẩn ngữ nghĩa; các thẻ badge có text đọc tuần tự rõ ràng. |

---

## 5. Kế hoạch Kiểm thử & Xác minh

1. **Kiểm tra cú pháp & Bundle:**
   - Chạy `npm run lint` tại thư mục `src/frontend` (đảm bảo 0 lỗi ESLint).
   - Chạy `npm run build` tại thư mục `src/frontend` (đảm bảo build Vite thành công không lỗi cú pháp).
2. **Kiểm tra trực quan bằng Playwright:**
   - Mở trang `http://localhost:5173/services` ở độ phân giải Desktop (1440x900):
     - Xác nhận khối "Khám phá theo nhu cầu" và các service mẫu không còn xuất hiện.
     - Xác nhận hình ảnh `/images/transparent-student-clean.png` hiển thị rõ nét, load thành công (mã 200).
     - Xác nhận 3 badges: "500+", "4.9/5", "Bảo chứng an toàn" hiển thị đúng vị trí.
   - Mở ở độ phân giải Mobile (390x844):
     - Xác nhận cụm visual được ẩn gọn gàng, thanh search và các nút lọc không bị lệch hay tràn khung ngang.
