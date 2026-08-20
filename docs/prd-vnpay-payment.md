# PRD: Tích Hợp Cổng Thanh Toán VNPay (VNPay Payment Gateway Integration)

* **Tính năng:** Tích hợp cổng thanh toán trực tuyến thực tế VNPay Sandbox 2.1.0, sinh URL thanh toán có chữ ký HMAC SHA512, Return URL và Webhook IPN xử lý ngầm Server-to-Server.
* **Người dùng:** Học Viên (Student), Cổng Thanh Toán VNPay (Gateway Webhook), Hệ Thống.
* **Stack:** .NET 8 Web API, EF Core 8, PostgreSQL, HMAC SHA512 Cryptography.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Thay thế thanh toán giả lập bằng cổng thanh toán thực tế VNPay; đảm bảo tính toàn vẹn dòng tiền, chống gọi trùng lặp (Idempotency), và chống race condition khi nhận Webhook IPN.
* **Success Metrics:**
  - 100% URL thanh toán được băm bảo mật HMAC SHA512 chuẩn ASCII query string.
  - 100% request IPN được xử lý trong Atomic DB Transaction; không bao giờ xảy ra tình trạng nhân đôi số dư ví khi VNPay gọi lại IPN.
  - Phân định rõ ràng: Return URL (Read-Only) không làm thay đổi dữ liệu database.

---

## 2. User Stories & Acceptance Criteria

### US-01: Tạo URL thanh toán VNPay (Create Payment URL)
* **User Story:** Là học viên, tôi muốn nhận đường link chuyển hướng sang VNPay để thanh toán cho booking đang giữ chỗ 15 phút.
* **Acceptance Criteria:**
  - Sinh mã `MerchantReference` độc nhất vô nhị dạng `THByyMMddHHmmss{RandomHex}`.
  - Băm chữ ký `vnp_SecureHash` bằng `HMACSHA512`. Số tiền gửi sang VNPay là `TotalAmount * 100`.

### US-02: Tiếp nhận điều hướng trình duyệt (Return URL)
* **User Story:** Là học viên, sau khi thanh toán trên VNPay, tôi được chuyển hướng về website TutorHub để xem kết quả.
* **Acceptance Criteria:**
  - Endpoint `GET /api/v1/payments/vnpay/return` xác thực chữ ký SHA512 và hiển thị kết quả cho giao diện người dùng theo cơ chế **Read-Only (không mutate database)**.

### US-03: Webhook IPN xử lý ngầm (Server-to-Server Webhook)
* **User Story:** Là hệ thống, tôi muốn nhận thông báo thanh toán ngầm từ Server VNPay để cập nhật trạng thái đơn hàng và ghi có ví gia sư.
* **Acceptance Criteria:**
  - Kiểm tra chữ ký HMAC SHA512, mã `vnp_TmnCode`, đơn vị tiền `VND`, và số tiền `vnp_Amount`.
  - **Idempotency Guard:** Nếu đơn hàng đã được xác nhận trước đó (`Booking.Status != Holding`), lập tức phản hồi `{"RspCode": "02", "Message": "Order already confirmed"}`.
  - Khi thành công (`vnp_ResponseCode == "00"` và `vnp_TransactionStatus == "00"`): Chuyển `Booking = Pending`, `Transaction = Held`, và cộng đúng **`Transaction.PayoutAmount`** (đã trừ phí sàn 10%) vào `Wallet.PendingBalance`. Phản hồi `{"RspCode": "00", "Message": "Confirm Success"}`.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Tạo URL Sandbox, Return URL Read-Only, IPN Webhook Server-to-Server Atomic Transaction.
  - Snapshot tài chính cố định: `GrossAmount = CommissionAmount + PayoutAmount`.
* **Chưa có trong v1 (Dời sang v2):**
  - Tự động gọi API hoàn tiền trực tiếp VNPay Refund API qua Web Service.
  - Tích hợp thêm các cổng MoMo, ZaloPay, Stripe.

---

## 4. Data Model
* **`Transaction`:** `Id (PK, Guid)`, `BookingId (FK, Unique)`, `Amount (decimal)`, `Status (TransactionStatus enum: Held, Released, Refunded)`, `CommissionRate (decimal)`, `CommissionAmount (decimal)`, `PayoutAmount (decimal)`, `PaymentGatewayRef (string - Lưu MerchantReference và TransactionNo)`, `CreatedAt (DateTime)`, `ReleasedAt (DateTime?)`, `RefundedAt (DateTime?)`.

---

## 5. Edge Cases & Xử Lý Lỗi
* **IPN sai chữ ký hoặc bị can thiệp query param:** Trả về `{"RspCode": "97", "Message": "Invalid Checksum"}`.
* **Lệch số tiền thanh toán:** Trả về `{"RspCode": "04", "Message": "Invalid amount"}`.
* **Thanh toán lại sau thất bại:** Hệ thống sinh mã `MerchantReference` mới, không bị lỗi trùng mã trên cổng VNPay.
