# PRD: Quản Lý Gia Sư & Lịch Rảnh (Tutors & Availability Management)

* **Tính năng:** Hồ sơ chuyên môn gia sư, danh mục môn dạy, cấu hình lịch rảnh tuần và công cụ tìm kiếm gia sư công khai.
* **Người dùng:** Gia Sư (Tutor), Học Viên (Student), Khách vãng lai (Public).
* **Stack:** .NET 8 Web API, EF Core 8, PostgreSQL, FluentValidation.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Học viên cần tìm kiếm gia sư phù hợp theo môn học, vị trí địa lý, mức giá và khung giờ rảnh; Gia sư cần công cụ chủ động quản lý môn dạy, giá dạy theo môn, và thời gian biểu trong tuần.
* **Success Metrics:**
  - Thời gian phản hồi tìm kiếm gia sư có bộ lọc phức tạp < 150ms.
  - 100% gia sư hiển thị ở danh sách công khai phải có trạng thái `Verified` và tài khoản `IsActive = true`.

---

## 2. User Stories & Acceptance Criteria

### US-01: Cập nhật hồ sơ chuyên môn & Môn dạy
* **User Story:** Là gia sư, tôi muốn cập nhật Bio, kinh nghiệm, học vấn, giá mặc định và danh sách môn dạy kèm giá riêng từng môn.
* **Acceptance Criteria:**
  - Gia sư có thể override mức học phí theo từng môn học (`overridePrice`).
  - Địa chỉ và tọa độ (`Latitude`, `Longitude`) được cập nhật khi dạy hình thức `Offline` hoặc `Both`.

### US-02: Cấu hình lịch rảnh trong tuần (Availability Slots)
* **User Story:** Là gia sư, tôi muốn thiết lập các khung giờ rảnh cố định trong tuần theo từng thứ.
* **Acceptance Criteria:**
  - `DayOfWeek` (Chủ nhật = 0, Thứ hai = 1...).
  - `StartTime < EndTime`, không bị trùng lặp các khung giờ trong cùng một ngày.

### US-03: Tìm kiếm gia sư công khai (Search & Filter)
* **User Story:** Là học viên, tôi muốn tìm kiếm gia sư theo môn học, khoảng giá, địa điểm, hình thức dạy (Online/Offline) và đánh giá.
* **Acceptance Criteria:**
  - Hỗ trợ sắp xếp theo: `price_asc`, `price_desc`, `rating_desc`, `experience_desc`.
  - Phân trang chuẩn mực `PageNumber`, `PageSize (1-100)`.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Quản lý hồ sơ gia sư cá nhân (`GET/PUT /tutors/me`).
  - Quản lý môn dạy kèm giá riêng (`PUT /tutors/me/subjects`).
  - Quản lý khung giờ rảnh (`PUT /tutors/me/availabilities`).
  - Tìm kiếm & xem chi tiết hồ sơ công khai kèm đánh giá (`GET /tutors`, `GET /tutors/{id}`).
* **Chưa có trong v1 (Dời sang v2):**
  - Chặn lịch theo ngày cụ thể ngoài lịch tuần (Blocked Dates calendar).
  - Tìm kiếm theo bán kính Geo-distance PostGIS chuyên sâu.

---

## 4. Data Model
* **`TutorProfile`:** `Id (PK, Guid)`, `UserId (FK, Unique)`, `Bio (string)`, `Education (string)`, `ExperienceYears (int)`, `HourlyRate (decimal)`, `TeachingMode (enum: Online, Offline, Both)`, `Address (string?)`, `Latitude/Longitude (double?)`, `Status (TutorProfileStatus enum: Draft, PendingReview, Verified, Rejected, Suspended)`, `RatingAvg (decimal)`, `TotalReviews (int)`.
* **`TutorSubject`:** `TutorProfileId (FK)`, `SubjectId (FK)`, `OverridePrice (decimal?)`, `IsActive (bool)`. Unique `(TutorProfileId, SubjectId)`.
* **`AvailabilitySlot`:** `Id (PK, Guid)`, `TutorProfileId (FK)`, `DayOfWeek (DayOfWeek enum)`, `StartTime (TimeOnly)`, `EndTime (TimeOnly)`, `IsActive (bool)`.

---

## 5. Edge Cases & Xử Lý Lỗi
* **Khung giờ không hợp lệ:** `StartTime >= EndTime` ➔ Trả về `400 Bad Request`.
* **Gia sư chưa được duyệt:** Gia sư có status `PendingReview`/`Rejected`/`Suspended` sẽ bị loại khỏi kết quả tìm kiếm công khai.
