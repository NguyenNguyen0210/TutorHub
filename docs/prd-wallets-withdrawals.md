# PRD: Ví Tiền & Rút Tiền Gia Sư (Wallets & Withdrawals Management)

* **Tính năng:** Quản lý ví tiền của Gia sư (số dư khả dụng, số dư đang giữ), tạo yêu cầu rút tiền về ngân hàng và quy trình Admin phê duyệt.
* **Người dùng:** Gia Sư (Tutor), Quản Trị Viên (Admin).
* **Stack:** .NET 8 Web API, EF Core 8, PostgreSQL, Pessimistic Row Locking.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Đảm bảo tiền học phí được giữ an toàn trong suốt thời gian học (`PendingBalance`), chỉ cho phép rút tiền sau khi buổi học hoàn thành (`AvailableBalance`), và ngăn chặn rút tiền vượt mức (Overdraft / Double-spending).
* **Success Metrics:**
  - 100% yêu cầu rút tiền được khóa số dư khả dụng ngay khi tạo yêu cầu.
  - 0% trường hợp số dư ví bị âm hoặc rút vượt số dư khả dụng (`AvailableBalance < 0`).
  - Hỗ trợ hoàn tiền tự động về lại ví khả dụng nếu Admin từ chối yêu cầu rút tiền.

---

## 2. User Stories & Acceptance Criteria

### US-01: Xem số dư ví (Get Wallet Balance)
* **User Story:** Là gia sư, tôi muốn theo dõi minh bạch số dư đang chờ giải ngân và số dư có thể rút về tài khoản ngân hàng.
* **Acceptance Criteria:**
  - Trả về `PendingBalance` (tiền từ các booking `Pending`/`Confirmed` chưa hoàn thành) và `AvailableBalance` (tiền từ các buổi học `Completed`).

### US-02: Tạo yêu cầu rút tiền (Create Withdrawal Request)
* **User Story:** Là gia sư, tôi muốn gửi yêu cầu rút tiền về tài khoản ngân hàng của mình.
* **Acceptance Criteria:**
  - Kiểm tra `Amount <= AvailableBalance` và `Amount >= 50,000 VND`.
  - Khóa số dư khả dụng ngay lập tức: `AvailableBalance -= Amount` (bảo vệ bằng Row-level lock `SELECT FOR UPDATE`).
  - Tạo bản ghi `Withdrawal` ở trạng thái `Pending`.

### US-03: Admin xét duyệt rút tiền (Approve / Reject Withdrawal)
* **User Story:** Là Admin, tôi muốn duyệt chi tiền cho gia sư hoặc từ chối nếu thông tin tài khoản ngân hàng không hợp lệ.
* **Acceptance Criteria:**
  - Khi duyệt (`Approve`): `Status = Approved`, ghi nhận `ProcessedAt` và `ProcessedByAdminId`.
  - Khi từ chối (`Reject`): `Status = Rejected`, tự động hoàn trả số tiền rút lại vào `AvailableBalance` của ví gia sư.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Xem số dư ví, tạo yêu cầu rút tiền, xem lịch sử rút tiền của gia sư.
  - Admin duyệt/từ chối yêu cầu rút tiền có lý do.
* **Chưa có trong v1 (Dời sang v2):**
  - Tự động chuyển tiền liên ngân hàng qua Open Banking API (VietQR Napas 24/7).

---

## 4. Data Model
* **`Wallet`:** `Id (PK, Guid)`, `TutorProfileId (FK, Unique)`, `PendingBalance (decimal)`, `AvailableBalance (decimal)`, `UpdatedAt (DateTime)`.
* **`Withdrawal`:** `Id (PK, Guid)`, `WalletId (FK)`, `Amount (decimal)`, `BankName (string)`, `AccountNumber (string)`, `AccountHolderName (string)`, `Note (string?)`, `Status (WithdrawalStatus enum: Pending, Approved, Rejected)`, `RejectionReason (string?)`, `ProcessedByAdminId (Guid?)`, `ProcessedAt (DateTime?)`, `CreatedAt (DateTime)`.

---

## 5. Edge Cases & Concurrency
* **Rút tiền đồng thời (Double-Spending):** Gia sư gửi đồng thời 2 request rút tiền cùng lúc ➔ Áp dụng `SELECT FOR UPDATE` trên bảng `Wallets` để tuần tự hóa các giao dịch rút tiền, đảm bảo số dư không bị trừ vượt mức.
