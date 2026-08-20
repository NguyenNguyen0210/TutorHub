# PRD: Đặt Lịch Học & Đánh Giá (Bookings & Reviews Lifecycle)

* **Tính năng:** Quy trình đặt lịch giữ chỗ 15 phút, thanh toán, gia sư duyệt lịch, hoàn thành buổi học, chính sách hủy hoàn tiền và đánh giá sau buổi học.
* **Người dùng:** Học Viên (Student), Gia Sư (Tutor), Hệ Thống (System Background Worker).
* **Stack:** .NET 8 Web API, EF Core 8, PostgreSQL, BackgroundService.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Tránh xung đột trùng lịch (Double Booking/Slot Conflict), bảo đảm quyền lợi tài chính cho cả hai bên khi hủy lớp, và lưu vết đánh giá thực tế từ người học.
* **Success Metrics:**
  - 0% trường hợp đặt trùng slot cùng 1 khung giờ của cùng 1 gia sư.
  - 100% booking quá hạn 15 phút không thanh toán được background service tự động giải phóng slot.
  - Đánh giá chỉ được tạo bởi học viên đã hoàn thành buổi học (`Status = Completed`).

---

## 2. User Stories & Acceptance Criteria

### US-01: Tạo đặt lịch giữ chỗ 15 phút (Create Booking)
* **User Story:** Là học viên, tôi muốn đặt một khung giờ học với gia sư và giữ chỗ trong 15 phút để tiến hành thanh toán.
* **Acceptance Criteria:**
  - Kiểm tra khung giờ nằm trong lịch rảnh của gia sư và không bị trùng với booking đang active khác.
  - Khởi tạo Booking ở trạng thái `Holding` với `HoldingExpiresAt = Now + 15 minutes`.

### US-02: Xác nhận & Hoàn thành buổi học (Confirm & Complete)
* **User Story:** Là gia sư, tôi muốn xác nhận nhận lớp; và khi dạy xong, một trong hai bên xác nhận hoàn thành để giải ngân tiền.
* **Acceptance Criteria:**
  - Gia sư có 24 giờ để xác nhận (`Pending ➔ Confirmed`) hoặc từ chối (`Rejected ➔ Cancelled` hoàn tiền 100%).
  - Khi hoàn thành (`Completed`), hệ thống chuyển tiền từ `PendingBalance` sang `AvailableBalance` của ví gia sư.

### US-03: Chính sách hủy buổi học (Cancellation Policy)
* **User Story:** Là người dùng, tôi muốn hủy lịch học khi có việc đột xuất theo chính sách hoàn tiền công bằng.
* **Acceptance Criteria:**
  - Gia sư hủy hoặc Hệ thống hủy ➔ Hoàn tiền 100% cho học viên.
  - Học viên hủy trước 24h ➔ Hoàn tiền 100%.
  - Học viên hủy trong vòng 24h trước buổi học ➔ Hoàn tiền 50%, chuyển 50% tiền phạt cho gia sư.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Vòng đời đầy đủ: `Holding` ➔ `Pending` ➔ `Confirmed` ➔ `Completed` / `Cancelled`.
  - Background Service quét hủy tự động holding quá 15 phút và pending quá 24 giờ.
  - Đánh giá Rating 1-5 sao và cập nhật điểm trung bình `RatingAvg` gia sư.
* **Chưa có trong v1 (Dời sang v2):**
  - Đặt lịch định kỳ theo tháng (Recurring Monthly Subscriptions).
  - Tích hợp phòng học trực tuyến (Zoom / Google Meet SDK).

---

## 4. Data Model
* **`Booking`:** `Id (PK, Guid)`, `StudentProfileId (FK)`, `TutorProfileId (FK)`, `SubjectId (FK)`, `StartAt (DateTime)`, `EndAt (DateTime)`, `HourlyRate (decimal)`, `TotalAmount (decimal)`, `Status (BookingStatus enum: Holding, Pending, Confirmed, Completed, Cancelled, Expired)`, `HoldingExpiresAt (DateTime?)`, `ConfirmedAt (DateTime?)`, `CompletedAt (DateTime?)`, `CancelledAt (DateTime?)`, `CancelledBy (CancelledBy enum?)`, `CancellationReason (string?)`, `CreatedAt (DateTime)`.
* **`Review`:** `Id (PK, Guid)`, `BookingId (FK)`, `StudentProfileId (FK)`, `TutorProfileId (FK)`, `Rating (int 1-5)`, `Comment (string?)`, `CreatedAt (DateTime)`.

---

## 5. Edge Cases & Concurrency
* **Đặt lịch đồng thời (Race Condition):** Hai học viên cùng bấm đặt trùng 1 khung giờ ➔ Áp dụng kiểm tra xung đột trong Database Transaction và trả `409 Conflict` cho request đến sau.
