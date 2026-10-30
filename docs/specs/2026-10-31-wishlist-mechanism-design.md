# Cơ chế Wishlist (Yêu thích Gia sư & Dịch vụ) — Design Spec

**Ngày:** 2026-10-31  
**Trạng thái:** Design đã duyệt — Chờ review trước khi lập plan  
**Phạm vi:** Toàn bộ hệ thống (Database, Backend .NET 8 API, Frontend React/Vite)  
**Tác giả:** Brainstorming session with user  

---

## 1. Tóm tắt

Xây dựng cơ chế Wishlist (Lưu / Yêu thích) toàn diện cho TutorHub nhằm cho phép người dùng (đặc biệt là học viên) lưu trữ, theo dõi và quản lý các **Gia sư (Tutor)** và **Gói dịch vụ học tập (Service)** mà họ quan tâm.

Tính năng thay thế hoàn toàn cơ chế `useState` cục bộ tạm thời hiện nay bằng hệ thống lưu trữ đồng bộ trên cơ sở dữ liệu PostgreSQL, cung cấp bộ API RESTful chuẩn CQRS với hiệu năng cao (hỗ trợ client caching qua danh sách ID nhẹ), phản hồi giao diện tức thì (Optimistic UI update), và bổ sung màn hình quản lý chuyên biệt `/student/wishlist` theo ngôn ngữ thiết kế **Cobalt & Porcelain Editorial**.

---

## 2. Mục tiêu & Yêu cầu thành công

- **Tính toàn vẹn & Đồng bộ:** Dữ liệu yêu thích được lưu bền vững trên PostgreSQL; tự động dọn dẹp (Cascade Delete) khi Gia sư hoặc Dịch vụ liên quan bị xóa/vô hiệu hóa.
- **Trải nghiệm người dùng mượt mà:** Nút tim phản hồi ngay lập tức khi người dùng click (Optimistic UI), không có độ trễ mạng; tự động rollback và báo lỗi nếu kết nối gặp sự cố.
- **Tối ưu hóa băng thông (Hydration Performance):** Cung cấp endpoint lấy danh sách ID đã lưu siêu nhẹ (`GET /api/v1/wishlist/ids`) giúp frontend render cờ yêu thích trên mọi trang (Marketplace, Search, Catalog) mà không cần truy vấn lặp lại.
- **Trang quản lý tập trung:** Trang `/student/wishlist` trong Dashboard học viên phân chia 2 tab rõ ràng ("Gia sư đã lưu" và "Dịch vụ đã lưu"), đầy đủ các trạng thái Loading skeleton, Empty state và Error state.
- **Đồng bộ đa điểm chạm (Touchpoints):** Nút lưu hoạt động nhất quán trên cả Card danh sách lẫn trang Chi tiết gia sư (`/tutors/:id`) và Chi tiết dịch vụ (`/services/:id`).

---

## 3. Không nằm trong phạm vi (Out of Scope)

- Cho phép khách vãng lai (Guest chưa đăng nhập) lưu tạm thời qua `localStorage` (Yêu cầu bắt buộc đăng nhập để lưu).
- Chia sẻ danh sách Wishlist công khai (Public Wishlist URL).
- Phân loại danh sách yêu thích thành nhiều thư mục hoặc bộ sưu tập tùy chỉnh (Custom Collections).

---

## 4. Ngôn ngữ Thị giác & Trải nghiệm (Aesthetic Direction)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Cobalt & Porcelain Editorial** đã thiết lập trong `DESIGN.md`:

- **Bảng màu:**
  - Nền sứ sạch và sáng: `#ffffff`, `#f8fafc`.
  - Đường kẻ hairline tinh tế: `1px solid #e2e8f0` thay vì bóng đổ nặng nề.
  - Điểm nhấn Cobalt: `#1d4ed8` cho các nút hành động chính, tab đang kích hoạt, link điều hướng.
  - Sắc màu Yêu thích (Favorite Accent): Nền hoa hồng nhạt `#fff1f2`, viền `#fecdd3`, icon tim đỏ rực `#e11d48` khi ở trạng thái đã lưu (`isFavorited = true`). Trạng thái chưa lưu dùng viền hairline `#e2e8f0` và icon xám mờ `#94a3b8` (hover chuyển sắc hồng).
- **Typography & Con số:** Tiêu đề đậm nét, giá tiền và điểm đánh giá hiển thị dạng `font-variant-numeric: tabular-nums`.

---

## 5. Mô hình Dữ liệu (Backend Domain & Database Schema)

### 5.1. Entity Domain: `WishlistItem`
Tạo mới tại `src/backend/TutorHub.Domain/Entities/WishlistItem.cs`:

```csharp
namespace TutorHub.Domain.Entities;

public enum WishlistItemType
{
    Tutor = 1,
    Service = 2
}

public class WishlistItem
{
    public Guid Id { get; set; }

    // Người dùng sở hữu mục lưu
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // Loại mục lưu: Tutor hoặc Service
    public WishlistItemType ItemType { get; set; }

    // Khóa ngoại liên kết tới Gia sư (nullable)
    public Guid? TutorProfileId { get; set; }
    public TutorProfile? TutorProfile { get; set; }

    // Khóa ngoại liên kết tới Dịch vụ (nullable)
    public Guid? ServiceId { get; set; }
    public Service? Service { get; set; }

    // Thời điểm lưu
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### 5.2. Cấu hình EF Core & Ràng buộc toàn vẹn (`WishlistItemConfiguration.cs`)
- **Tên bảng:** `wishlist_items`
- **Quan hệ & Cascade Delete:**
  - `UserId` -> `Users.Id` (ON DELETE CASCADE)
  - `TutorProfileId` -> `TutorProfiles.Id` (ON DELETE CASCADE)
  - `ServiceId` -> `Services.Id` (ON DELETE CASCADE)
- **Check Constraint (Database Level):**
  ```sql
  CHECK (
      (item_type = 1 AND tutor_profile_id IS NOT NULL AND service_id IS NULL) OR
      (item_type = 2 AND service_id IS NOT NULL AND tutor_profile_id IS NULL)
  )
  ```
- **Chỉ mục Unique Index:**
  - `CREATE UNIQUE INDEX ix_wishlist_items_user_tutor ON wishlist_items(user_id, tutor_profile_id) WHERE tutor_profile_id IS NOT NULL;`
  - `CREATE UNIQUE INDEX ix_wishlist_items_user_service ON wishlist_items(user_id, service_id) WHERE service_id IS NOT NULL;`

---

## 6. Đặc tả Backend API & CQRS Architecture

Controller: `WishlistController` (`/api/v1/wishlist`), gắn thuộc tính `[Authorize]`.

### 6.1. Endpoint 1: Toggle Wishlist Item
- **Route:** `POST /api/v1/wishlist/toggle`
- **Command:** `ToggleWishlistCommand(WishlistItemType ItemType, Guid ItemId)`
- **Request Body:**
  ```json
  {
    "itemType": "Tutor",
    "itemId": "d3b07384-d113-4660-84cf-2401f7c0ce98"
  }
  ```
- **Xử lý nghiệp vụ:**
  1. Lấy `UserId` từ `ICurrentUserService`.
  2. Kiểm tra `ItemId`:
     - Nếu `ItemType == Tutor`: Kiểm tra `TutorProfile` có tồn tại và trạng thái hợp lệ. Không cho phép gia sư tự lưu chính mình (`TutorProfile.UserId != currentUserId`).
     - Nếu `ItemType == Service`: Kiểm tra `Service` có tồn tại và đang `Published`.
  3. Kiểm tra xem mục đã tồn tại trong `WishlistItems` của user chưa:
     - Nếu đã tồn tại: Xóa mục đó khỏi DB -> trả về `{ "isFavorited": false, "message": "Đã bỏ lưu" }`.
     - Nếu chưa tồn tại: Tạo mới `WishlistItem` -> trả về `{ "isFavorited": true, "message": "Đã lưu vào danh sách yêu thích" }`.

### 6.2. Endpoint 2: Get Wishlist IDs (Client Cache)
- **Route:** `GET /api/v1/wishlist/ids`
- **Query:** `GetWishlistIdsQuery()`
- **Response:** `200 OK`
  ```json
  {
    "tutorIds": ["d3b07384-d113-4660-84cf-2401f7c0ce98"],
    "serviceIds": ["a5c18492-f224-4881-91ea-3610e8d1de01"]
  }
  ```
- **Mục đích:** Truy vấn chỉ lấy danh sách ID, tốc độ thực thi < 10ms, phục vụ hiển thị icon tim đỏ trên toàn ứng dụng.

### 6.3. Endpoint 3: Get Wishlist Detailed Items (Paged)
- **Route:** `GET /api/v1/wishlist?type=Tutor&page=1&pageSize=10`
- **Query:** `GetWishlistItemsQuery(WishlistItemType Type, int PageNumber, int PageSize)`
- **Response:** `200 OK` - Danh sách phân trang (`PagedList<WishlistTutorDto>` hoặc `PagedList<WishlistServiceDto>`).
  - Sắp xếp: `CreatedAt DESC` (mục lưu mới nhất lên đầu).
  - DTO cho Tutor: Chứa đầy đủ `id`, `fullName`, `avatarUrl`, `bio`, `education`, `experienceYears`, `ratingAvg`, `totalReviews`, `isVerified`, `minPrice`, `subjects`.
  - DTO cho Service: Chứa đầy đủ `id`, `tutorProfileId`, `tutorName`, `tutorAvatar`, `title`, `price`, `totalSessions`, `sessionDurationMinutes`, `coverImageUrl`, `subjectName`.

### 6.4. Endpoint 4: Remove Wishlist Item (Direct Unsave)
- **Route:** `DELETE /api/v1/wishlist/{itemType}/{itemId}`
- **Command:** `RemoveWishlistItemCommand(WishlistItemType ItemType, Guid ItemId)`
- **Response:** `200 OK`

---

## 7. Thiết kế Frontend & Trạng thái Giao diện

### 7.1. Service & React Query Hook (`src/frontend/src/services/wishlistService.js` & `useWishlist.js`)
- `wishlistService`:
  - `getWishlistIds()`
  - `getWishlistItems(type, page, pageSize)`
  - `toggleWishlist(itemType, itemId)`
  - `removeWishlistItem(itemType, itemId)`
- `useWishlist()` hook:
  - Cache React Query key: `['wishlist', 'ids']` và `['wishlist', 'items', type, page]`.
  - Hàm `isFavorited(type, id)` trả về boolean tức thì.
  - Hàm `toggle(type, id)` thực hiện **Optimistic Update**: lập tức cập nhật query cache `['wishlist', 'ids']`; nếu server trả về lỗi sẽ tự động hoàn tác và gọi Toast cảnh báo.
  - Nếu người dùng chưa đăng nhập (`!isAuthenticated`), ngăn hành động và hiển thị toast yêu cầu đăng nhập kèm điều hướng sang `/auth/login`.

### 7.2. Các điểm chạm giao diện (UI Touchpoints)
1. **`TutorCard.jsx`:** Thay thế `useState(false)` bằng `useWishlist()`. Đọc trạng thái từ `isFavorited('Tutor', tutor.id)`. Khi bấm nút tim, gọi `toggle('Tutor', tutor.id)`.
2. **`ServiceCard.jsx`:** Tương tự, dùng `isFavorited('Service', service.id)`.
3. **`ProfileHeadline.jsx` (Trang hồ sơ gia sư):** Thêm nút "Lưu gia sư" bên cạnh nút "Chia sẻ hồ sơ" với icon tim và text động ("Lưu gia sư" / "Đã lưu").
4. **`ServiceDetail.jsx` (Trang chi tiết dịch vụ):** Thêm nút lưu dịch vụ ở hero action banner.
5. **Header Topbar:** Thêm icon trái tim dẫn đến `/student/wishlist` khi học viên đăng nhập.
6. **Sidebar học viên (`StudentLayout.jsx`):** Thêm mục menu "Đã lưu" (`/student/wishlist`) với icon `favorite`.

### 7.3. Trang Quản lý: `/student/wishlist` (`StudentWishlist.jsx`)
- Đường dẫn: `/student/wishlist`, được bảo vệ bởi `RequireAuth` và `RequireRole(['Student'])`.
- Bố cục:
  - Header trang: Tiêu đề "Danh sách đã lưu" và mô tả.
  - Tab Bar: 2 tab "Gia sư đã lưu" và "Dịch vụ đã lưu" kèm số lượng đếm trên badge.
  - Nội dung Grid: Render danh sách card tương ứng với phân trang.

### 7.4. Ma trận Trạng thái Giao diện (State Coverage Matrix)

| Trạng thái | Giao diện trên Tab Gia sư | Giao diện trên Tab Dịch vụ |
|---|---|---|
| **Loading** | Hiển thị 6 Skeleton TutorCards | Hiển thị 6 Skeleton ServiceCards |
| **Empty** | Icon tim mờ, text *"Bạn chưa lưu gia sư nào"*, nút CTA *"Khám phá gia sư"* dẫn tới `/` | Icon tim mờ, text *"Bạn chưa lưu dịch vụ nào"*, nút CTA *"Xem danh mục dịch vụ"* dẫn tới `/services` |
| **Error** | Box thông báo lỗi màu đỏ nhạt, kèm nút *"Thử lại"* gọi refetch | Box thông báo lỗi màu đỏ nhạt, kèm nút *"Thử lại"* gọi refetch |
| **Optimistic Action** | Khi bấm bỏ lưu trên card, card mờ dần hoặc ẩn đi tức thì kèm Toast *"Đã xóa khỏi danh sách đã lưu"* | Tương tự |

---

## 8. Bảo mật & Hiệu năng

- **Bảo mật:** Tất cả API Wishlist yêu cầu JWT Token hợp lệ. User chỉ có quyền xem, thêm, xóa các mục trong Wishlist của chính mình (lấy theo `UserId` từ Claims).
- **Chống gian lận / tự đánh bóng:** Gia sư không thể tự lưu hồ sơ của chính mình để tránh spam thống kê.
- **Hiệu năng cơ sở dữ liệu:**
  - Có các chỉ mục Partial Unique Index giúp kiểm tra trùng lặp và truy vấn danh sách theo `UserId` trong thời gian $O(1)$ hoặc $O(\log N)$.
  - `GET /api/v1/wishlist/ids` chỉ `SELECT tutor_profile_id, service_id` nên cực kỳ nhẹ, không join bảng.

---

## 9. Kế hoạch Kiểm thử (Verification Strategy)

- **Backend Tests:**
  - Unit tests cho `ToggleWishlistCommandHandler`: Thêm mới, xóa bỏ, kiểm tra self-favorite, kiểm tra 404 khi ID không tồn tại.
  - Unit tests cho `GetWishlistIdsQueryHandler` và `GetWishlistItemsQueryHandler`.
  - Integration tests với PostgreSQL: Kiểm tra CHECK constraint và Cascade Delete.
- **Frontend Verification:**
  - Kiểm tra tương tác nút tim trên `TutorCard` và `ServiceCard`: Bấm tim chuyển đỏ ngay lập tức, F5 trang vẫn giữ nguyên trạng thái.
  - Kiểm tra trang `/student/wishlist`: Chuyển tab mượt mà, phân trang hoạt động, hiển thị empty state khi danh sách rỗng.
  - Chạy `npm run lint` và `npm run build` đảm bảo không phát sinh lỗi biên dịch.
