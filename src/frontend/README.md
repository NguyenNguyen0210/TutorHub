# TutorHub Frontend Client

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.20-1890FF?style=flat&logo=antdesign)](https://ant.design/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

Giao diện người dùng Web dành cho học viên, gia sư và quản trị viên của nền tảng **TutorHub**, được xây dựng bằng React 18, Vite, Ant Design 5, TailwindCSS và kết nối trực tiếp với Backend .NET 8 Web API.

---

## 🚀 Công Nghệ & Thư Viện Sử Dụng

* **Core Runtime & Build Tool:** React 18.3, Vite 5.4
* **UI Components & Styling:** Ant Design 5.20, `@ant-design/icons`, TailwindCSS 3.4
* **State Management & Server State:** Zustand 4.5, TanStack React Query 5.56
* **Routing:** React Router DOM 6.26
* **HTTP Client & Realtime:** Axios 1.7 (Interceptors gắn JWT Bearer và Refresh Token Rotation), `@microsoft/signalr` 8.0 (`/hubs/chat`, `/hubs/notifications`)
* **Utilities:** Day.js 1.11, clsx, tailwind-merge

---

## 🛠️ Hướng Dẫn Khởi Chạy (Getting Started)

### 1. Cài đặt dependencies
```bash
cd src/frontend
npm install
```

### 2. Khởi chạy máy chủ phát triển (Dev Server)
```bash
npm run dev
```
Giao diện mặc định chạy tại: `http://localhost:5173`

### 3. Build & Kiểm tra mã nguồn (Production Build & Lint)
```bash
# Kiểm tra lỗi lint
npm run lint

# Tự động sửa lỗi lint có thể
npm run lint:fix

# Biên dịch sản phẩm production
npm run build
```

---

## 🔌 Cấu Hình Kết Nối API

* **API Endpoints:**
  * Local .NET Development: `http://localhost:5129/api/v1`
  * Docker Container Environment: `http://localhost:8080/api/v1`
* **Realtime SignalR Hubs:**
  * Trò chuyện 1-1: `/hubs/chat`
  * Thông báo tức thời: `/hubs/notifications`
