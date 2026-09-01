# TutorHub — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Final / Business Baseline Frozen
**Product:** TutorHub
**Document Type:** Product Requirements Document

---

# 1. Product Definition

## 1.1. Product Overview

TutorHub là một marketplace kết nối **Student** với **Tutor**, cho phép Student tìm kiếm, đánh giá và lựa chọn dịch vụ học tập phù hợp từ Tutor.

Khác với mô hình "đặt từng buổi học", TutorHub tập trung vào **service/package-based learning**:

> Tutor cung cấp một dịch vụ học tập với phạm vi, giá, số lượng session và điều kiện rõ ràng. Student lựa chọn dịch vụ, thỏa thuận với Tutor nếu cần custom, thanh toán thông qua TutorHub và sau đó tham gia các Session thuộc Enrollment.

TutorHub đóng vai trò trung gian đảm bảo:

* Discovery.
* Communication.
* Agreement.
* Payment protection.
* Session tracking.
* Attendance verification.
* Tutor earnings.
* Refund.
* Review.
* Dispute resolution.
* Trust & Safety.

---

## 1.2. Problem Statement

Student hiện gặp khó khăn trong việc:

* Tìm Tutor phù hợp.
* Hiểu Tutor cung cấp dịch vụ gì.
* So sánh các lựa chọn.
* Biết trước phạm vi và chi phí học tập.
* Trao đổi và custom dịch vụ.
* Quản lý lịch học.
* Theo dõi lịch sử học.
* Đảm bảo quyền lợi khi Tutor không thể tiếp tục.
* Có cơ chế xử lý khi xảy ra tranh chấp.

Tutor gặp khó khăn trong việc:

* Present dịch vụ học tập.
* Tìm Student.
* Quản lý Enrollment.
* Quản lý Session.
* Xác nhận việc Student thực sự tham gia.
* Theo dõi earnings.
* Nhận payment một cách có hệ thống.
* Xây dựng reputation.

TutorHub giải quyết vấn đề bằng cách cung cấp một **end-to-end tutoring marketplace**.

---

# 2. Product Goals

## 2.1. Primary Goals

TutorHub phải cho phép:

1. Student discover Tutor và Service.
2. Student xem Trial Lesson trước khi quyết định.
3. Student trao đổi với Tutor.
4. Student mua Standard Service hoặc Custom Agreement.
5. Student thanh toán thông qua platform.
6. Enrollment được quản lý xuyên suốt lifecycle.
7. Sessions được tạo và quản lý theo Enrollment.
8. Student và Tutor cùng verify Attendance.
9. Tutor nhận earning sau khi Session được xác nhận.
10. Student có thể review experience.
11. Có cơ chế Cancellation, Refund và Dispute.
12. Admin có thể govern marketplace và xử lý exceptional cases.

---

# 3. Actors

TutorHub có ba actor chính.

## 3.1. Student

Student có thể:

* Browse marketplace.
* Search/filter Tutor và Service.
* View Tutor profile.
* View Service.
* View Trial Lesson.
* Message Tutor.
* Accept Standard Service.
* Request/customize service.
* Accept Custom Agreement.
* Make payment.
* Manage Enrollment.
* View Schedule.
* Participate in Session.
* Verify Attendance.
* View Learning Record.
* Cancel Enrollment theo policy.
* Request/participate in Dispute.
* Leave Review.
* Report/Block Tutor.

---

## 3.2. Tutor

Tutor phải đăng ký Tutor role và chờ Admin approval.

Tutor có thể sau khi được approve:

* Manage Tutor Profile.
* Create Service.
* Publish Service.
* Provide Trial Lesson.
* Receive Student inquiries.
* Message Student.
* Create Custom Offer.
* Manage Enrollment.
* Propose/manage Schedule.
* Conduct Sessions.
* Verify Attendance.
* Create Learning Record.
* Receive Session Earnings.
* Withdraw available balance.
* Reply to Reviews.
* Report/Block users.

---

## 3.3. Admin

Admin chịu trách nhiệm:

* Tutor approval.
* User management.
* Marketplace governance.
* Service moderation.
* Enrollment oversight.
* Refund management.
* Withdrawal oversight.
* Dispute resolution.
* Report & Trust/Safety.
* Review moderation.
* Platform configuration.
* Audit.

Admin không tham gia trực tiếp vào việc dạy học.

---

# 4. Student Journey

## 4.1. Discovery

Student có thể:

* Search Tutor.
* Search Service.
* Filter theo các marketplace criteria.
* Xem Tutor Profile.
* Xem Service details.
* Xem Trial Lesson.

Student có thể đánh giá:

* Tutor profile.
* Experience.
* Teaching information.
* Service scope.
* Price.
* Number of Sessions.
* Schedule information.
* Trial Lesson.

---

## 4.2. Trial Lesson

Tutor có thể public Trial Lesson để Student xem trước.

Trial Lesson:

* Không phải Trial Session.
* Không tạo Enrollment.
* Không tạo Payment.
* Không tạo earning.

Mục đích của Trial Lesson là giúp Student đánh giá:

> "Tutor này có phù hợp với mình không?"

---

## 4.3. Decision

Sau khi xem Service/Trial Lesson, Student có hai hướng:

### Standard Service

Student chấp nhận dịch vụ được Tutor đưa ra.

```text
View Service
→ Accept
→ Pay
```

### Custom Service

Student muốn thay đổi điều kiện.

```text
View Service
→ Message Tutor
→ Discuss
→ Custom Agreement
→ Accept
→ Pay
```

---

# 5. Tutor Journey

## 5.1. Tutor Registration

User đăng ký Tutor role.

Status:

```text
Pending
```

Admin review application.

```text
Pending
├── Approved
└── Rejected
```

Tutor chỉ được cung cấp Service trên marketplace sau khi được approve.

---

## 5.2. Service Creation

Tutor tạo Service bao gồm các thông tin cần thiết để Student hiểu:

* Service description.
* Learning scope.
* Expected outcome.
* Number of Sessions.
* Session duration.
* Price.
* Schedule information.
* Trial Lesson.

Service có thể được publish sau khi pass platform validation.

Admin không cần manually approve từng Service.

---

## 5.3. Student Interaction

Tutor có thể:

* Receive inquiries.
* Chat với Student.
* Answer questions.
* Create Custom Offer khi Student yêu cầu.

---

## 5.4. Enrollment

Sau khi Student accept và payment thành công:

```text
Service
→ Enrollment
→ Active
```

Tutor bắt đầu thực hiện Service.

---

## 5.5. Session Delivery

Tutor:

* Dạy Session.
* Theo dõi nội dung học.
* Verify Attendance.
* Tạo Learning Record.

---

## 5.6. Earnings

Sau khi Session được xác nhận hoàn thành:

```text
Session Completed
→ Session Earning
→ Tutor Balance
```

Tutor có thể withdraw available balance theo platform policy.

---

# 6. Admin Journey

Admin operational flow:

```text
Application
→ Review
→ Decision
→ Governance
→ Intervention when necessary
→ Audit
```

Admin chủ yếu xử lý:

* Pending Tutor applications.
* Reports.
* Disputes.
* Financial exceptions.
* Trust & Safety issues.
* Marketplace violations.
* Withdrawal issues.

Admin không cần can thiệp vào các flow bình thường.

---

# 7. Core Business Rules

## 7.1. Platform Payment

Các giao dịch phát sinh từ TutorHub phải đi qua TutorHub.

Student và Tutor không được cố ý bypass platform payment cho transaction bắt nguồn từ TutorHub.

---

## 7.2. Service-based Learning

TutorHub bán **Service**, không bán từng Session độc lập.

Enrollment đại diện cho một learning commitment giữa Student và Tutor.

---

## 7.3. Enrollment Pricing

Giá của Enrollment được xác định khi Student accept và payment thành công.

Thay đổi giá Service sau đó không ảnh hưởng Enrollment hiện tại.

---

## 7.4. Session Value

Enrollment có:

```text
Total Enrollment Price
```

Giá trị được phân bổ cho các Session.

Tổng giá trị Session phải luôn bằng Total Enrollment Price.

Nếu phát sinh rounding:

> Remainder được phân bổ vào Session cuối.

---

## 7.5. Earnings

Tutor không nhận toàn bộ Enrollment money ngay lập tức.

Platform giữ tiền và release earnings theo Session.

```text
Enrollment Payment
→ Platform Holding
→ Session Completed
→ Tutor Earning
→ Tutor Balance
```

---

## 7.6. Attendance

Attendance được xác nhận bởi cả:

* Student.
* Tutor.

No-show là **Attendance Outcome**, không phải Session Status.

---

## 7.7. Financial Integrity

Historical financial transactions không được silently modified hoặc deleted.

Financial correction phải được tạo thành explicit adjustment và có reason + audit.

---

# 8. Cancellation, Refund & Dispute Policy

## 8.1. Student Cancellation

Student có thể cancel theo Cancellation Policy.

Financial consequence phụ thuộc:

* Timing.
* Session status.
* Service policy.
* Applicable platform rules.

---

## 8.2. Tutor Cannot Continue

Nếu Tutor không thể tiếp tục Service:

```text
Enrollment
→ Cancelled
→ Refund unused portion
```

TutorHub **không tự động transfer Student sang Tutor khác**.

Student có thể tự tìm Tutor mới thông qua marketplace.

---

## 8.3. Tutor No-show

Nếu Tutor không xuất hiện:

* Tutor không nhận earning cho Session đó.
* Session được xử lý theo attendance/cancellation policy.
* Makeup Session có thể được sử dụng nếu applicable.

Nếu Tutor không thể tiếp tục toàn bộ Service:

> Enrollment được xử lý theo Tutor Cannot Continue policy.

---

## 8.4. Dispute

Dispute có thể phát sinh từ:

* Attendance conflict.
* Session delivery.
* Cancellation.
* Financial issue.
* Service issue.
* Trust & Safety issue.

Flow:

```text
Issue
→ Dispute
→ Financial Hold where applicable
→ Admin Investigation
→ Resolution
```

---

## 8.5. Refund

Refund có thể được trigger bởi:

* Cancellation policy.
* Tutor cannot continue.
* Dispute resolution.
* Platform/payment issue.

Refund phải có financial record và audit trail.

---

# 9. Domain Concepts & Lifecycle

## 9.1. Service

Service là offering của Tutor.

```text
Draft
→ Published
→ Unpublished
```

---

## 9.2. Custom Agreement

Custom Agreement là commercial agreement riêng giữa Student và Tutor.

Nó được tạo sau quá trình trao đổi và trước Enrollment.

```text
Chat
→ Custom Agreement
→ Accept
→ Payment
→ Enrollment
```

---

## 9.3. Enrollment

Lifecycle:

```text
Pending
→ Active
→ Completed
```

hoặc:

```text
Pending / Active
→ Cancelled
```

`Completed` nghĩa là Service lifecycle kết thúc bình thường.

`Cancelled` nghĩa là Service lifecycle bị terminate trước thời hạn.

---

## 9.4. Session

Session đại diện cho một lần delivery của Service.

Session có lifecycle riêng và chứa:

* Schedule.
* Attendance.
* Learning Record reference.
* Financial outcome.

No-show không phải Session status.

---

## 9.5. Learning Record

Learning Record là educational record riêng.

Tutor tạo Learning Record.

Student có quyền xem nhưng không trực tiếp sửa.

Learning Record không quyết định việc release earning.

---

## 9.6. Attendance

Attendance được xác nhận bởi Student và Tutor.

Possible outcomes:

* Attended.
* No-show.
* Other applicable attendance outcomes.

Nếu hai bên không thống nhất:

> Attendance Conflict.

---

# 10. Marketplace & Discovery

## 10.1. Marketplace

Student có thể khám phá:

* Tutors.
* Services.

Discovery dựa trên các thông tin mà Tutor cung cấp.

---

## 10.2. Tutor Profile

Tutor Profile giúp Student đánh giá:

* Identity/profile information.
* Teaching background.
* Experience.
* Qualifications.
* Teaching style/information.
* Reviews.
* Services.

---

## 10.3. Service Detail

Service phải giúp Student hiểu:

* Tutor cung cấp gì.
* Học cái gì.
* Học trong bao lâu.
* Có bao nhiêu Session.
* Giá bao nhiêu.
* Điều kiện như thế nào.

---

## 10.4. Trial Lesson

Trial Lesson có thể public và được Student xem trước.

Trial Lesson không tạo Trial Enrollment hoặc Trial Session.

---

# 11. Learning & Session Management

## 11.1. Session Generation

Sau khi Enrollment Active, các Session thuộc Service được xác định dựa trên Enrollment terms và Schedule.

---

## 11.2. Schedule

Tutor có thể đề xuất thay đổi Schedule.

Nếu thay đổi ảnh hưởng lịch đã thỏa thuận:

> Student phải accept.

Tutor không được tự ý thay đổi Schedule của Student.

---

## 11.3. Session Completion

Sau khi Session diễn ra:

```text
Session
→ Attendance Verification
→ Resolution
→ Session Completed
```

Nếu Attendance conflict:

```text
Attendance Conflict
→ Pending Resolution
```

---

## 11.4. Verification Window

Sau Session, Student và Tutor có một verification window.

System gửi reminder nếu cần.

Nếu hết window mà chưa đủ thông tin:

```text
Pending Resolution
```

Không tự động coi là Attended.

Earning chưa được release cho Session chưa được resolution.

---

## 11.5. Learning Record

Tutor ghi nhận thông tin học tập sau Session.

Student có thể xem Learning Record để theo dõi quá trình học.

---

# 12. Financial & Payment Flow

## 12.1. Payment

Student thanh toán cho Enrollment.

```text
Student
→ Payment
→ Platform Holding
→ Enrollment Active
```

---

## 12.2. Platform Holding

Platform giữ tiền trong thời gian Service được delivery.

Mục đích:

* Protect Student.
* Protect Tutor.
* Enable Refund.
* Enable Dispute resolution.
* Control Session-based earnings.

---

## 12.3. Session Earning

Ví dụ:

```text
Enrollment:
3,000,000đ
20 Sessions

Base Session Value:
150,000đ
```

Sau khi Session đủ điều kiện release:

```text
Session Completed
→ Calculate earning
→ Apply platform fee
→ Tutor Balance
```

---

## 12.4. Rounding

Ví dụ:

```text
1,000,000đ / 3

Session 1 = 333,333đ
Session 2 = 333,333đ
Session 3 = 333,334đ
```

Tổng luôn bằng:

```text
1,000,000đ
```

---

## 12.5. Tutor Balance

Tutor có:

* Pending earnings.
* Available balance.
* Withdrawal history.

Chỉ Available Balance mới có thể withdraw.

---

## 12.6. Withdrawal

Flow:

```text
Request
→ Processing
→ Completed
```

hoặc:

```text
Processing
→ Failed
```

Nếu failed, amount được xử lý theo financial policy.

---

# 13. Review, Rating, Dispute & Trust

## 13.1. Review Eligibility

Student có thể review sau khi Enrollment kết thúc theo điều kiện review policy.

Review đại diện cho experience với Service/Tutor.

---

## 13.2. Review

Student có thể:

* Rating.
* Written review.

Một Enrollment không tạo vô hạn reviews.

---

## 13.3. Tutor Response

Tutor có thể reply Review.

---

## 13.4. Review Moderation

Review được publish theo normal flow.

Admin chỉ can thiệp khi:

* Review bị report.
* Vi phạm policy.
* Vi phạm trust/safety rules.

Admin có thể remove review với reason.

---

## 13.5. Dispute

Dispute là formal resolution mechanism.

Không sử dụng Review hoặc Chat như substitute cho Dispute.

---

## 13.6. Trust & Safety

User có thể:

* Report.
* Block.

Admin có thể:

* Investigate.
* Warn.
* Suspend.
* Ban.
* Remove violating content/service.

---

# 14. Messaging & Communication

## 14.1. Student ↔ Tutor Messaging

Student và Tutor có thể chat để:

* Hỏi về Service.
* Làm rõ yêu cầu.
* Discuss Custom Service.
* Coordinate learning.

---

## 14.2. Conversation Boundary

Chat không tự động:

* Create Enrollment.
* Create Payment.
* Create Session.

Chat chỉ là communication layer.

---

## 14.3. Custom Agreement

Custom Agreement được tạo từ kết quả trao đổi.

```text
Conversation
→ Custom Agreement
→ Acceptance
→ Payment
```

---

## 14.4. File Sharing

Conversation có thể hỗ trợ sharing relevant files/links.

---

## 14.5. Bypass Prevention

Student/Tutor không được cố ý sử dụng messaging để bypass platform transaction.

---

## 14.6. Admin Access

Admin chỉ access conversation context khi cần cho:

* Dispute.
* Report.
* Trust & Safety.
* Investigation.

---

## 14.7. MVP Communication Scope

MVP không bao gồm:

* Voice call.
* Video call.
* Group chat.
* Advanced communication system.

---

# 15. Notifications & System Events

## 15.1. Principle

System Event và Notification là hai concept khác nhau.

```text
Business Event
→ Business Consequences
→ Notification
```

Notification không quyết định business state.

---

## 15.2. Core System Events

Các event chính gồm:

### Marketplace

* TutorApplicationSubmitted.
* TutorApplicationApproved.
* TutorApplicationRejected.

### Enrollment

* CustomOfferCreated.
* CustomOfferAccepted.
* PaymentSucceeded.
* EnrollmentActivated.
* EnrollmentCancelled.

### Session

* SessionScheduled.
* SessionRescheduled.
* SessionCancelled.
* AttendanceVerificationRequired.
* AttendanceConflictDetected.
* SessionCompleted.

### Finance

* EarningCreated.
* RefundCreated.
* RefundCompleted.
* WithdrawalRequested.
* WithdrawalCompleted.
* WithdrawalFailed.

### Trust

* ReviewCreated.
* DisputeCreated.
* DisputeResolved.
* ReportCreated.

---

## 15.3. Notification Channels

MVP:

* In-app notification.
* Email.

Không yêu cầu SMS.

---

## 15.4. Notification Center

User có thể:

* View notifications.
* Mark as read.
* Mark all as read.

---

## 15.5. Deep Linking

Notification phải dẫn user đến context liên quan.

Ví dụ:

```text
Payment Successful
→ Payment / Enrollment

Attendance Verification Required
→ Session

You earned 150,000đ
→ Wallet Transaction

Dispute Resolved
→ Dispute
```

---

## 15.6. Critical Notifications

Các notification quan trọng về:

* Payment.
* Refund.
* Withdrawal.
* Dispute.
* Security.

không thể bị tắt hoàn toàn.

---

## 15.7. Session Reminder

System gửi reminder trước Session.

MVP đề xuất:

> 24 hours before Session.

---

## 15.8. Attendance Reminder

Nếu Attendance Verification chưa hoàn tất:

> System gửi reminder.

Nếu hết verification window:

```text
Pending Resolution
```

---

# 16. Admin Operations & Platform Governance

## 16.1. User Management

Admin có thể:

* View User.
* Suspend User.
* Reactivate User.
* Ban User.

Account statuses:

```text
Active
Suspended
Banned
```

---

## 16.2. Tutor Approval

Admin review Tutor application.

```text
Pending
├── Approved
└── Rejected
```

Rejection phải có reason.

Tutor có thể resubmit nếu policy cho phép.

---

## 16.3. Service Moderation

Admin không manually approve mọi Service.

Admin có thể:

* Unpublish Service.
* Remove violating content.
* Require Tutor correction.

Admin không silently edit Service content thay cho Tutor.

---

## 16.4. Enrollment Oversight

Admin có read visibility vào Enrollment.

Admin chỉ can thiệp trong exceptional situations.

---

## 16.5. Administrative Cancellation

Admin có thể cancel Enrollment trong exceptional cases:

* Fraud.
* Serious safety issue.
* Tutor banned.
* Platform error.
* Dispute resolution.

Reason bắt buộc.

Financial consequences phải được xử lý rõ ràng.

---

## 16.6. Refund Management

Admin có thể xử lý refund khi policy cho phép.

Mọi refund phải có:

* Amount.
* Reason.
* Related transaction.
* Audit record.

---

## 16.7. Withdrawal Management

Admin có thể xử lý operational issues liên quan đến withdrawal.

Admin không được tùy ý sửa Tutor Balance.

Financial adjustment phải được tạo thành explicit record.

---

## 16.8. Dispute Resolution

Admin review:

* Student statement.
* Tutor statement.
* Session information.
* Attendance.
* Conversation context.
* Evidence.
* Financial records.

Resolution có thể:

* Student wins.
* Tutor wins.
* Partial adjustment.
* No action.

---

## 16.9. Report & Trust/Safety

Admin xử lý Reports và có thể:

* Dismiss.
* Warn.
* Suspend.
* Ban.
* Remove violating content.

---

## 16.10. Review Moderation

Admin có thể remove reported review nếu vi phạm policy.

Reason bắt buộc.

---

## 16.11. Platform Configuration

Admin có thể configure:

* Platform fee.
* Cancellation policy.
* Refund rules.
* Verification window.
* Withdrawal rules.
* Review window.

Policy changes áp dụng cho transactions mới theo rule tương ứng.

Historical transactions không bị thay đổi retroactively.

---

## 16.12. Audit Log

Các Admin actions quan trọng phải được audit.

Audit phải xác định được:

```text
Who?
What?
Why?
When?
What was affected?
```

---

# 17. Business Lifecycle Overview

## 17.1. Standard Service Flow

```text
Tutor Approved
    ↓
Create Service
    ↓
Publish Service
    ↓
Student Discovers
    ↓
View Trial Lesson
    ↓
Accept Service
    ↓
Payment
    ↓
Enrollment Active
    ↓
Schedule
    ↓
Sessions
    ↓
Attendance Verification
    ↓
Session Completed
    ↓
Earning Released
    ↓
Tutor Balance
    ↓
All Service Obligations Completed
    ↓
Enrollment Completed
    ↓
Review
```

---

# 18. Custom Service Flow

```text
Student discovers Service
        ↓
Trial Lesson / Service Review
        ↓
Chat
        ↓
Custom Discussion
        ↓
Custom Agreement
        ↓
Student Accepts
        ↓
Payment
        ↓
Enrollment
        ↓
Sessions
        ↓
Attendance
        ↓
Earnings
        ↓
Completion
        ↓
Review
```

---

# 19. Cancellation Flow

```text
Cancellation Request
        ↓
Apply Cancellation Policy
        ↓
Determine Financial Consequence
        ↓
Cancel Enrollment / Session
        ↓
Refund where applicable
        ↓
Notify affected parties
        ↓
Audit
```

---

# 20. Tutor Cannot Continue Flow

```text
Tutor Cannot Continue
        ↓
Enrollment Cancelled
        ↓
Calculate Unused Portion
        ↓
Refund Student
        ↓
Stop Future Sessions
        ↓
Notify Student + Tutor
        ↓
Audit
```

Không có automatic Tutor transfer.

Student có thể quay lại marketplace để tìm Tutor mới.

---

# 21. Attendance Conflict Flow

```text
Session Ends
      ↓
Student Verification
      +
Tutor Verification
      ↓
Do they match?
   ┌──┴──┐
  Yes    No
   │      │
   ▼      ▼
Completed Conflict
   │      │
   ▼      ▼
Earning  Dispute/
Release  Resolution
```

---

# 22. Attendance Timeout Flow

```text
Session Ends
      ↓
Verification Window
      ↓
Reminder
      ↓
Verification Complete?
   ┌────┴────┐
  Yes        No
   │          │
   ▼          ▼
Resolve   Pending Resolution
              ↓
          No Earning Release
```

---

# 23. Dispute Flow

```text
Issue
 ↓
Dispute Created
 ↓
Financial Hold if applicable
 ↓
Admin Investigation
 ↓
Resolution
 ├── Student Wins
 ├── Tutor Wins
 ├── Partial Adjustment
 └── No Action
 ↓
Financial Resolution
 ↓
Notify Parties
 ↓
Audit
```

---

# 24. Financial Lifecycle

```text
Student Payment
       ↓
Platform Holding
       ↓
Enrollment Active
       ↓
Session Delivery
       ↓
Attendance Resolution
       ↓
Session Completed
       ↓
Session Earning
       ↓
Platform Fee
       ↓
Tutor Balance
       ↓
Withdrawal
```

Refund path:

```text
Platform Holding
       ↓
Refund
       ↓
Student
```

Dispute path:

```text
Session Earning
       ↓
Financial Hold
       ↓
Admin Resolution
       ↓
Release / Refund / Adjustment
```

---

# 25. Non-Functional Product Principles

Các nguyên tắc này ở cấp product, không phải implementation requirements.

## 25.1. Transparency

Student và Tutor phải hiểu:

* Họ đang mua gì.
* Họ đang trả bao nhiêu.
* Session nào đã hoàn thành.
* Tutor đã earning bao nhiêu.
* Refund bao nhiêu.
* Vì sao một dispute được resolution theo một kết quả.

---

## 25.2. Financial Traceability

Mọi money movement phải có thể giải thích được:

```text
Payment
→ Holding
→ Session Allocation
→ Earning
→ Fee
→ Balance
→ Withdrawal
```

---

## 25.3. Immutable History

Lịch sử quan trọng không bị silently rewritten.

Correction được thể hiện bằng adjustment/new record.

---

## 25.4. User Control

Student tự quyết định:

* Tutor nào.
* Service nào.
* Có accept hay không.
* Có custom hay không.
* Có tiếp tục hay cancel theo policy.

Tutor tự quyết định:

* Service cung cấp.
* Schedule đề xuất.
* Custom terms.
* Việc nhận Student.

Admin chỉ can thiệp khi cần governance.

---

# 26. MVP Scope

## Included

### Student

* Account.
* Marketplace discovery.
* Tutor profile.
* Service discovery.
* Trial Lesson.
* Messaging.
* Custom Agreement.
* Payment.
* Enrollment.
* Schedule.
* Session.
* Attendance verification.
* Learning Record viewing.
* Cancellation.
* Refund.
* Dispute.
* Review.
* Notification.

### Tutor

* Tutor application.
* Tutor approval.
* Profile.
* Service.
* Trial Lesson.
* Messaging.
* Custom Offer.
* Enrollment management.
* Schedule.
* Session management.
* Attendance verification.
* Learning Record.
* Earnings.
* Balance.
* Withdrawal.
* Review response.

### Admin

* Tutor approval.
* User management.
* Service moderation.
* Enrollment oversight.
* Refund.
* Withdrawal operations.
* Dispute.
* Report.
* Review moderation.
* Platform configuration.
* Audit.

---

# 27. Explicitly Out of Scope for MVP

* Automatic Tutor matching.
* Automatic Tutor replacement.
* Voice calling.
* Video calling.
* Group tutoring.
* Complex subscription billing.
* Native mobile applications.
* SMS notification.
* Advanced AI Tutor matching.
* Automated fraud scoring.
* Automated dispute resolution.
* Multi-level Admin RBAC.
* Advanced marketing automation.
* Complex notification automation.
* Full CMS.
* Advanced Tutor ranking algorithm.

---

# 28. Success Criteria

TutorHub MVP được xem là đạt product goals khi:

### Student

Có thể hoàn thành:

```text
Discover
→ Evaluate
→ Communicate
→ Purchase
→ Learn
→ Verify
→ Review
```

một cách rõ ràng.

### Tutor

Có thể hoàn thành:

```text
Apply
→ Get Approved
→ Publish
→ Acquire Student
→ Deliver Service
→ Earn
→ Withdraw
```

### Platform

Có thể:

```text
Protect Payment
→ Track Sessions
→ Resolve Conflicts
→ Handle Refund
→ Handle Dispute
→ Govern Marketplace
```

mà không cần Admin can thiệp vào các flow bình thường.

---

# 29. Final Product Principle

TutorHub không đơn giản là:

> "Website tìm gia sư."

và cũng không đơn giản là:

> "Website bán khóa học."

TutorHub là:

> **A service-based tutoring marketplace where students discover tutors, purchase learning services, communicate and customize arrangements, learn through structured sessions, verify attendance together, and pay tutors progressively as sessions are successfully delivered.**

Core product loop:

```text
DISCOVER
   ↓
EVALUATE
   ↓
COMMUNICATE
   ↓
AGREE
   ↓
PAY
   ↓
LEARN
   ↓
VERIFY
   ↓
EARN
   ↓
REVIEW
```

Với lớp bảo vệ xuyên suốt:

```text
       TRUST
        │
        ├── Payment Protection
        ├── Attendance Verification
        ├── Refund
        ├── Dispute
        ├── Review
        ├── Report
        └── Admin Governance
```

**PRD Status: FINAL — Business Baseline Frozen.**
