# Kế hoạch Triển khai Cụm Đồ họa Hero Banner Trang Dịch vụ (/services)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế khối thẻ "Khám phá theo nhu cầu" cũ ở cột phải hero banner trang `/services` bằng component đồ họa `ServiceHeroVisual.jsx` gồm ảnh học viên, 3 thẻ nổi (floating badges) và chữ nghệ thuật.

**Architecture:** Tạo component đồ họa độc lập `ServiceHeroVisual.jsx` tách bạch với logic tìm kiếm, nhúng vào cột phải của `ServiceHeroSection.jsx` (`hidden lg:flex`), dọn dẹp prop `sampleServices` không còn sử dụng ở `ServicesMarketplace.jsx`.

**Tech Stack:** React 18, Tailwind CSS, Lucide / Custom Icon component (`@/components/ui/Icon`), Vite, ESLint, Playwright.

---

### Cấu trúc file liên quan
- **Tạo mới:** `src/frontend/src/components/discovery/ServiceHeroVisual.jsx` - Component đồ họa minh họa cột phải, chứa ambient glow, student cutout image, floating badges và typography.
- **Chỉnh sửa:** `src/frontend/src/components/discovery/ServiceHeroSection.jsx` - Tích hợp `ServiceHeroVisual`, loại bỏ khối card cũ, loại bỏ import `Link`, `Money` và prop `sampleServices`.
- **Chỉnh sửa:** `src/frontend/src/pages/discovery/ServicesMarketplace.jsx` - Bỏ truyền prop `sampleServices={sampleServices}` vào `<ServiceHeroSection />`.

---

### Task 1: Tạo component đồ họa `ServiceHeroVisual.jsx`

**Files:**
- Create: `src/frontend/src/components/discovery/ServiceHeroVisual.jsx`

- [ ] **Step 1: Tạo file `src/frontend/src/components/discovery/ServiceHeroVisual.jsx`**

Viết code hoàn chỉnh cho `ServiceHeroVisual.jsx` bao gồm ambient glow, 2 slogan typography, hình ảnh `/images/transparent-student-clean.png` và 3 floating badges (`500+ Học viên tin tưởng`, `4.9/5 Đánh giá trung bình`, `Bảo chứng an toàn Thanh toán minh bạch`) với animation float:

```jsx
import React from 'react';
import Icon from '@/components/ui/Icon';

export default function ServiceHeroVisual() {
  return (
    <div className="relative flex w-full max-w-[480px] select-none items-center justify-center">
      {/* Vòng hào quang sáng mờ phía sau */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70 blur-3xl"
        aria-hidden="true"
      />

      {/* Slogan nghệ thuật góc trên - trái */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 top-0 hidden -rotate-6 select-none text-xs font-semibold italic leading-tight text-blue-800/80 xl:block"
      >
        Learn
        <br />
        Practice
        <br />
        Achieve
        <br />
        Excel.
      </p>

      {/* Hình ảnh học viên trung tâm */}
      <img
        src="/images/transparent-student-clean.png"
        alt="Học viên lựa chọn dịch vụ học tập trực tuyến cùng TutorHub"
        width="480"
        height="480"
        className="pointer-events-none relative z-10 h-auto w-full select-none object-contain drop-shadow-md"
        loading="eager"
      />

      {/* Badge 1: Học viên tin tưởng (Góc trên phải) */}
      <div className="animate-float absolute -right-2 top-2 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:right-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon name="group" size="sm" />
        </div>
        <div>
          <p className="text-[13px] font-bold leading-tight text-slate-900">500+</p>
          <p className="text-[11px] font-medium text-slate-500">Học viên tin tưởng</p>
        </div>
      </div>

      {/* Badge 2: Đánh giá trung bình (Góc giữa phải) */}
      <div
        className="animate-float absolute -right-3 top-1/3 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:right-1"
        style={{ animationDelay: '0.8s' }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          <Icon name="star" size="sm" />
        </div>
        <div>
          <p className="text-[13px] font-bold leading-tight text-slate-900">4.9/5</p>
          <p className="text-[11px] font-medium text-slate-500">Đánh giá trung bình</p>
        </div>
      </div>

      {/* Badge 3: Bảo chứng an toàn (Góc dưới trái) */}
      <div
        className="animate-float absolute -left-3 bottom-6 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:left-0"
        style={{ animationDelay: '1.4s' }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon name="verified_user" size="sm" />
        </div>
        <div>
          <p className="text-[13px] font-bold leading-tight text-slate-900">Bảo chứng an toàn</p>
          <p className="text-[11px] font-medium text-slate-500">Thanh toán minh bạch</p>
        </div>
      </div>

      {/* Slogan nghệ thuật góc dưới - phải */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-2 hidden rotate-6 select-none text-right text-xs font-semibold italic leading-tight text-blue-800/80 xl:block"
      >
        Better
        <br />
        Learning
        <br />
        Brighter Future.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Chạy lint kiểm tra cú pháp component mới**

Chạy:
```bash
npm run lint --prefix src/frontend
```
Kỳ vọng: Không có lỗi ESLint ở file mới tạo.

---

### Task 2: Cập nhật `ServiceHeroSection.jsx`

**Files:**
- Modify: `src/frontend/src/components/discovery/ServiceHeroSection.jsx`

- [ ] **Step 1: Cập nhật imports và loại bỏ prop thừa trong `ServiceHeroSection.jsx`**

Thay thế import `Link`, `Money` cũ bằng `ServiceHeroVisual`. Xóa bỏ `sampleServices` và biến `visibleSamples`:

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import ServiceHeroVisual from './ServiceHeroVisual';
```

- [ ] **Step 2: Thay thế khối card bên phải bằng `<ServiceHeroVisual />`**

Xóa bỏ đoạn mã render `<div className="hidden lg:block">...</div>` cũ và thay bằng:

```jsx
          {/* Cột phải: Visual học viên + Floating Badges */}
          <div className="hidden lg:flex items-center justify-center">
            <ServiceHeroVisual />
          </div>
```

- [ ] **Step 3: Cập nhật PropTypes của `ServiceHeroSection.jsx`**

Xóa bỏ khai báo `sampleServices: PropTypes.array` khỏi `ServiceHeroSection.propTypes`.

- [ ] **Step 4: Chạy lint kiểm tra cú pháp**

Chạy:
```bash
npm run lint --prefix src/frontend
```
Kỳ vọng: PASS không lỗi.

---

### Task 3: Dọn dẹp prop tại `ServicesMarketplace.jsx`

**Files:**
- Modify: `src/frontend/src/pages/discovery/ServicesMarketplace.jsx`

- [ ] **Step 1: Xóa prop `sampleServices` khi gọi `<ServiceHeroSection />`**

Xóa dòng `sampleServices={sampleServices}` khỏi lời gọi `<ServiceHeroSection />` trong `ServicesMarketplace.jsx`. Nếu biến `sampleServices` không còn được dùng ở nơi nào khác trong file, loại bỏ biến đó để tránh code thừa.

- [ ] **Step 2: Chạy kiểm tra lint và build**

Chạy:
```bash
npm run lint --prefix src/frontend
npm run build --prefix src/frontend
```
Kỳ vọng: PASS 100%, bundle thành công.

---

### Task 4: Kiểm thử giao diện bằng Playwright

**Files:**
- Test trên browser tự động qua Playwright (local port 5173).

- [ ] **Step 1: Kiểm thử trên Desktop (1440x900)**
  - Truy cập `http://localhost:5173/services`.
  - Kiểm tra xem cụm "Khám phá theo nhu cầu" có còn hiển thị không (kỳ vọng: count = 0).
  - Kiểm tra hình ảnh `transparent-student-clean.png` có hiển thị không (kỳ vọng: hiển thị tốt).
  - Kiểm tra 3 thẻ badges ("500+", "4.9/5", "Bảo chứng an toàn") có hiển thị không (kỳ vọng: đủ cả 3 badges).

- [ ] **Step 2: Kiểm thử trên Mobile (390x844)**
  - Chuyển viewport sang 390x844.
  - Kiểm tra cụm `ServiceHeroVisual` có ẩn không (kỳ vọng: `isIntersecting/visible` = false hoặc offsetWidth = 0).
  - Kiểm tra thanh tìm kiếm và bộ lọc trên mobile vẫn hiển thị và hoạt động mượt mà.
