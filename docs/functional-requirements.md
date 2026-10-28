# TutorHub — Functional Requirements

**Version:** 1.1<br>
**Status:** Implementation-aligned draft (2026-10-20)<br>
**Source:** TutorHub PRD v1.5 — Final / Business Baseline, synced with implementation

> **Implementation sync (2026-10-20):** Các mục dưới đây đã được đối chiếu với code hiện tại:
> Booking `Holding → Paid` (bỏ `Pending`); payment hỗ trợ Student Wallet **hoặc** VNPay trực tiếp;
> bỏ bilateral attendance/no-show strikes, thay bằng **12h grace period + student issue report**;
> scheduling notice mặc định **2 giờ**; withdrawal bắt đầu ở `Pending`; Service có thêm `Paused`;
> dispute chỉ **pre-release**, fast-track đã bị xóa. Grace period hiện **fixed 12h**, chưa configurable.
> Các mục lịch sử được đánh dấu RETIRED thay vì xóa.

---

# 1. Purpose

Tài liệu này chuyển các Product Requirements trong PRD của TutorHub thành các **Functional Requirements** có thể dùng làm baseline cho:

- System design.
- API design.
- Database/domain design.
- Frontend feature implementation.
- Integration design.
- Test case và acceptance testing.

Functional Requirements mô tả **hệ thống phải làm gì**.

Các yêu cầu về technology stack, architecture, performance implementation hoặc infrastructure không thuộc phạm vi tài liệu này trừ khi PRD yêu cầu trực tiếp.

---

# 2. Actors

| Actor | Description |
|---|---|
| Student | Người tìm kiếm, mua và sử dụng tutoring service |
| Tutor | Người cung cấp tutoring service |
| Admin | Người quản trị và governance platform |
| System | Các process tự động của TutorHub |

---

# 3. Authentication & Account

## FR-AUTH-001 — User Registration

**Actor:** Student / Tutor

System SHALL allow a user to create an account.

### Main Flow

```text
Enter registration information
        ↓
Validate information
        ↓
Create User
        ↓
Account becomes Active
```

### Acceptance Criteria

- System validates required registration information.
- System rejects invalid registration data.
- System prevents creation of duplicate account according to account identity rules.
- Successfully registered user can authenticate.
- Account status is initially `Active` unless another account state is required by the registration flow.

---

## FR-AUTH-002 — User Authentication

**Actor:** Student / Tutor / Admin

System SHALL allow registered users to authenticate.

### Acceptance Criteria

- Valid credentials result in authenticated session.
- Invalid credentials are rejected.
- Authenticated user can access functionality permitted for their role.
- User cannot access functionality requiring another role.

---

## FR-AUTH-003 — Account Status

System SHALL maintain account status:

```text
Active
Suspended
Banned
```

### Business Rules

- `Active` users may use functionality permitted by their role.
- `Suspended` users are restricted according to platform rules.
- `Banned` users cannot continue normal platform activities.
- Admin can change account status through User Management.

---

# 4. Tutor Application & Approval

## FR-TUTOR-001 — Submit Tutor Application

**Actor:** User

System SHALL allow a user to apply to become a Tutor.

### Main Flow

```text
User applies for Tutor role
        ↓
Create Tutor Application
        ↓
Status = Pending
```

### Acceptance Criteria

- Application is created with `Pending` status.
- Application becomes visible to Admin.
- Applicant cannot publish Tutor Services while application is not approved.

---

## FR-TUTOR-002 — Review Tutor Application

**Actor:** Admin

System SHALL allow Admin to review pending Tutor applications.

### Main Flow

```text
Pending Application
        ↓
Admin Review
     ↙       ↘
Approve     Reject
```

### Acceptance Criteria

- Admin can view pending applications.
- Admin can approve an application.
- Admin can reject an application.
- Rejection requires a reason.
- Approved application changes Tutor status to approved.
- Rejected application stores the rejection reason.
- Tutor cannot publish marketplace Services unless approved.

---

## FR-TUTOR-003 — Resubmit Tutor Application

**Actor:** Tutor

System SHALL support Tutor application resubmission when permitted by platform policy.

### Acceptance Criteria

- Resubmission is allowed only when policy permits.
- A new review cycle is created.
- Application returns to `Pending`.

---

# 5. Tutor Profile

## FR-TUTOR-004 — Manage Tutor Profile

**Actor:** Tutor

System SHALL allow an approved Tutor to create and manage their Tutor Profile.

Tutor Profile SHALL support information necessary for Student evaluation, including:

- Profile information.
- Teaching background.
- Experience.
- Qualifications.
- Teaching information/style.
- Services.
- Reviews.

### Acceptance Criteria

- Tutor can create/update permitted profile information.
- Student can view published Tutor Profile information.
- Tutor profile information is associated with the Tutor account.

---

## FR-TUTOR-005 — View Tutor Profile

**Actor:** Student

System SHALL allow Student to view a Tutor Profile.

### Acceptance Criteria

Student can view relevant information including:

- Tutor information.
- Teaching background.
- Experience.
- Qualifications.
- Teaching information.
- Services.
- Reviews.

---

# 6. Service Management

## FR-SERVICE-001 — Create Service

**Actor:** Approved Tutor

System SHALL allow an approved Tutor to create a Service.

A Service SHALL contain sufficient information for Student evaluation, including:

- Service description.
- Learning scope.
- Expected outcome.
- Number of Sessions.
- Session duration.
- Price.
- Schedule information.
- Trial Lesson information where applicable.

### Service Lifecycle

```text
Draft
→ Published ⇄ Paused
→ Unpublished
```

`Paused` = tạm ẩn khỏi marketplace nhưng có thể resume về `Published`; `Unpublished` = ẩn hẳn.

---

## FR-SERVICE-002 — Validate Service

System SHALL validate Service information before publication.

### Acceptance Criteria

- Required Service information must be valid.
- Invalid Service cannot be published.
- Tutor must correct validation errors before publication.

---

## FR-SERVICE-003 — Publish Service

**Actor:** Approved Tutor

System SHALL allow an approved Tutor to publish a valid Service.

### Business Rules

- Only approved Tutors can publish Services.
- Admin does not manually approve every Service.
- A Service must pass platform validation before publication.

---

## FR-SERVICE-004 — Unpublish Service

**Actor:** Tutor / Admin where applicable

System SHALL support Service unpublishing.

### Acceptance Criteria

- Tutor can unpublish their Service according to applicable rules.
- Admin can unpublish a violating Service.
- Admin intervention must not silently modify the Tutor's Service content.
- If correction is required, Admin can require the Tutor to correct the content.

---

## FR-SERVICE-005 — Pause / Resume Service

**Actor:** Approved Tutor

System SHALL allow the owning Tutor to pause a `Published` Service and resume a `Paused` Service.

### Business Rules

- Only `Published` → `Paused` and `Paused` → `Published` transitions are allowed.
- A paused Service is hidden from the marketplace but its existing Enrollments/Sessions are unaffected.
- Commercial terms remain frozen for existing Enrollments.

---

## FR-SERVICE-006 — View Service Detail

**Actor:** Student

System SHALL allow Student to view Service details.

Student SHALL be able to understand:

- What the Tutor provides.
- Learning scope.
- Expected outcome.
- Number of Sessions.
- Session duration.
- Price.
- Schedule information.
- Applicable conditions.
- Trial Lesson where available.

---

# 7. Marketplace Discovery

## FR-MARKET-001 — Browse Marketplace

**Actor:** Student

System SHALL allow Student to discover:

- Tutors.
- Services.

---

## FR-MARKET-002 — Search Tutor

**Actor:** Student

System SHALL allow Student to search for Tutors.

---

## FR-MARKET-003 — Search Service

**Actor:** Student

System SHALL allow Student to search for Services.

---

## FR-MARKET-004 — Filter Marketplace

**Actor:** Student

System SHALL allow Student to filter marketplace results using supported marketplace criteria.

### Constraint

The exact marketplace criteria are not defined by the current PRD and SHALL be specified separately before implementation.

---

# 8. Trial Lesson

## FR-TRIAL-001 — Create Trial Lesson

**Actor:** Tutor

System SHALL allow Tutor to provide a public Trial Lesson associated with their offering.

---

## FR-TRIAL-002 — View Trial Lesson

**Actor:** Student

System SHALL allow Student to view a published Trial Lesson before making a purchase decision.

---

## FR-TRIAL-003 — Trial Lesson Does Not Create Commercial Transaction

A Trial Lesson SHALL NOT:

- Create Enrollment.
- Create Trial Session.
- Create Payment.
- Create Tutor earning.

### Acceptance Criteria

Viewing a Trial Lesson does not modify commercial or learning lifecycle state.

---

# 9. Messaging

## FR-MSG-001 — Student-Tutor Conversation

**Actor:** Student / Tutor

System SHALL allow Student and Tutor to communicate through messaging.

Messaging may be used to:

- Ask about Services.
- Clarify requirements.
- Discuss Custom Service.
- Coordinate learning.

---

## FR-MSG-002 — Create Conversation

System SHALL allow a Student and Tutor to establish a conversation.

### Constraint

Conversation SHALL NOT automatically create:

- Enrollment.
- Payment.
- Session.

---

## FR-MSG-003 — Send Message

**Actor:** Student / Tutor

System SHALL allow participants to send messages within a conversation.

---

## FR-MSG-004 — File/Link Sharing

System SHALL support sharing relevant files and links within a conversation.

### Constraint

MVP does not require advanced communication capabilities.

---

## FR-MSG-005 — Communication Scope

MVP SHALL NOT include:

- Voice calling.
- Video calling.
- Group chat.
- Advanced communication system.

---

## FR-MSG-006 — Bypass Prevention

System SHALL prevent or discourage intentional use of messaging to bypass platform transactions according to platform policy.

### Constraint

The exact detection/enforcement mechanism is not defined in the PRD and requires separate specification.

---

## FR-MSG-007 — Admin Conversation Access

**Actor:** Admin

System SHALL allow Admin to access relevant conversation context when necessary for:

- Dispute.
- Report.
- Trust & Safety.
- Investigation.

Admin access SHALL be limited to legitimate operational purposes.

---

# 10. Custom Agreement — REMOVED (v1.3)

> Custom Agreement đã bị xóa hẳn khỏi sản phẩm theo quyết định owner.
> Mọi giao dịch chỉ đi qua Standard Service (Service-based, ServiceId bắt buộc).
> Các FR-AGREE-001 → 004 trước đây được giữ lại dưới dạng lịch sử và KHÔNG còn hiệu lực.

## FR-AGREE-001 — Create Custom Agreement (RETIRED)

**Actor:** Tutor — RETIRED, không implement.

## FR-AGREE-002 — Custom Agreement Lifecycle (RETIRED)

RETIRED — không còn state machine Proposed/Accepted/Rejected/Cancelled/Expired.

## FR-AGREE-003 — Student Accept Custom Agreement (RETIRED)

RETIRED.

## FR-AGREE-004 — Custom Agreement Before Enrollment (RETIRED)

RETIRED — Enrollment chỉ được tạo từ Booking có `ServiceId`.

---

# 11. Standard Service Purchase

## FR-PURCHASE-001 — Accept Standard Service

**Actor:** Student

System SHALL allow Student to accept a published Standard Service.

### Flow

```text
View Service
→ Accept (Booking created in Holding, 15-minute checkout lock)
→ Payment (Booking → Paid; escrow held)
```

### Business Rule (v1.5: synced with code)

- Accepting a Service creates a **Booking** in `Holding` status with `HoldingExpiresAt = now + 15 minutes`; unpaid Holding bookings expire via background job (`Expired`) and never create an Enrollment.
- Successful payment moves Booking to **`Paid`**. Booking `Pending` no longer exists.
- A Booking references a required `ServiceId` (Service-only, Custom Agreement removed v1.3). Single-slot bookings outside a package are forbidden.

---

## FR-PURCHASE-002 — Purchase Price Snapshot

When Student accepts a Service and payment succeeds, system SHALL establish the Enrollment price.

### Business Rule

Changes to the Service price after Enrollment creation SHALL NOT modify the existing Enrollment price.

---

# 12. Payment

## FR-PAY-001 — Create Enrollment Payment

**Actor:** Student

System SHALL allow Student to pay for an Enrollment through TutorHub.

---

## FR-PAY-002 — Platform Payment

All transactions originating from TutorHub SHALL be processed through TutorHub according to platform payment rules.

### Business Rule

Student and Tutor SHALL NOT intentionally bypass TutorHub payment for transactions originating from TutorHub.

---

## FR-PAY-003 — Successful Payment

After successful payment:

```text
Payment Succeeded (Booking → Paid)
→ Enrollment created in Pending with fee snapshot
→ Enrollment Activated (Pending → Active) + N Sessions spawned
```

### Business Rule (v1.5)

- Cả Student Wallet và VNPay IPN đều converge về Booking `Paid`; không còn trạng thái Booking `Pending`.
- Wallet payment ghi `Transaction` escrow ở trạng thái `Held`; VNPay đi qua gateway rồi IPN xác nhận.
- At activation, the Enrollment snapshots `PlatformFeeRate` from application configuration. The current schema has no `FeePolicyVersion` or `PlatformSetting`; changing configuration affects future activations only.

### Acceptance Criteria

- Successful payment is recorded.
- Payment is associated with the Enrollment.
- Enrollment becomes `Active` when all activation conditions are satisfied.
- Student and Tutor receive appropriate system notifications.

---

## FR-PAY-004 — Failed Payment

If payment fails:

- Payment SHALL NOT be treated as successful.
- Enrollment SHALL NOT be activated solely because of the failed payment.
- The failed payment outcome SHALL be recorded where required for financial traceability.

---

# 13. Enrollment

## FR-ENR-001 — Create Enrollment

System SHALL create an Enrollment after successful acceptance and payment.

### Lifecycle

```text
Pending
→ Active
→ Completed
```

or:

```text
Pending / Active
→ Cancelled
```

---

## FR-ENR-002 — Enrollment Represents Learning Commitment

An Enrollment SHALL represent the learning commitment between Student and Tutor for the purchased Service.

---

## FR-ENR-003 — Enrollment Price Immutability

System SHALL preserve the agreed Enrollment price.

### Acceptance Criteria

Changing the original Service price does not change the price of an existing Enrollment.

---

## FR-ENR-004 — View Enrollment

**Actor:** Student / Tutor

System SHALL allow relevant participants to view their Enrollment information.

Information SHALL include relevant:

- Service information.
- Price.
- Sessions.
- Schedule.
- Learning progress.
- Financial status.
- Enrollment status.

---

## FR-ENR-005 — Complete Enrollment

System SHALL mark an Enrollment as `Completed` when all Service obligations have been completed normally.

---

## FR-ENR-006 — Cancel Enrollment

System SHALL support Enrollment cancellation according to applicable cancellation rules.

Cancellation SHALL:

- Change Enrollment state appropriately.
- Determine financial consequence.
- Stop affected future obligations where applicable.
- Trigger refund where applicable.
- Notify affected users.
- Create an audit trail.

---

# 14. Session Management

## FR-SESSION-001 — Generate Sessions

After Enrollment becomes Active, system SHALL determine Sessions belonging to the Enrollment based on:

- Enrollment terms.
- Service terms.
- Schedule.

---

## FR-SESSION-002 — Session Information

A Session SHALL contain or reference:

- Schedule.
- Grace period (`GracePeriodStartedAt`, `GracePeriodEndsAt`) and issue-report/dispute reference.
- Learning Record content.
- Financial outcome (`SessionPrice`, `IsPayoutReleased`).

---

## FR-SESSION-003 — Schedule Session (Tutor-Direct, v1.3)

**Actor:** Tutor

System SHALL support tutor-direct scheduling of Sessions belonging to an `Active` Enrollment — single (`POST /sessions/{id}/schedule`) and atomic batch (`POST /sessions/schedule-batch`, max 50 items, all-or-nothing).

### Business Rules (v1.3: scheduling simplification 2026-09-26)

- Only the session's Tutor may schedule; a Student attempting to schedule receives `403 Forbidden`.
- Every new `StartAt` must satisfy `StartAt >= now + Scheduling:MinimumNoticeHours` (**default 2h**) via `SessionSchedulePolicy`.
- New time must not overlap the Tutor's other `Scheduled` sessions (intra-batch overlaps included).
- `Unscheduled` → `Schedule()`; `Scheduled` → direct `Reschedule()` (no ticket, see FR-SESSION-004/005 superseded below).
- There is no availability-slot membership check (`AvailabilitySlot` subsystem removed).

---

## FR-SESSION-004 — Direct Schedule Change (Supersedes Propose Flow, v1.3)

**Actor:** Tutor

Tutor changes the Schedule directly; the new time takes effect immediately.

> Supersedes the former propose/accept ticket flow (`SessionRescheduleRequest` removed 2026-09-26). No Student acceptance step exists anywhere.

---

## FR-SESSION-005 — No Student Acceptance Step (Superseded, v1.3)

Superseded by FR-SESSION-004. There is no accept/reject step: the Tutor's reschedule is effective on save and the Student is notified read-only.

---

## FR-SESSION-006 — Reschedule Session

System SHALL record a Session reschedule event when the Tutor changes an agreed Schedule.

Affected parties SHALL be notified (`SessionRescheduled` event; schedule takes effect immediately, no acceptance gate).

---

## FR-SESSION-007 — Cancel Session

System SHALL support Session cancellation where permitted by policy.

Cancellation SHALL produce appropriate business and financial consequences.

### Business Rule (v1.3: Escrow Release & Direct Student-Wallet Refund)

- A participant (Student or Tutor) may cancel a single Session only from `Unscheduled`, or from `Scheduled` with a future start time (`StartAt > now`); a non-empty reason is required (minimum 5 characters).
- Cancelling a `Scheduled` session additionally requires minimum notice (`StartAt >= now + Scheduling:MinimumNoticeHours`, **default 2h**; `Unscheduled` needs no notice).
- Single-session cancellation unlocks and debits the Tutor's Escrow pending balance (`wallet.DebitPending(session.SessionPrice, now)`).
- System credits the refund directly into the Student's Wallet `AvailableBalance` (`StudentWalletTransaction` type `RefundCredit`) and records a `TransactionType.StudentRefund` with `SettlementRequired = false` and status `Succeeded` (immediate settlement, no gateway wait).
- System dispatches `SessionCancelledEvent`, `RefundCreatedEvent`, and `RefundCompletedEvent` to the transactional outbox.
- Cancellation action is recorded into the Central Audit Log (`SESSION_CANCELLED`).
- Enrollment completion evaluation (`enrollment.EvaluateCompletion()`) is triggered; the Enrollment transitions to `Completed` only when **all** sessions are resolved (`Completed` or `Cancelled`) **and at least one** session was actually `Completed`. An all-cancelled Enrollment stays `Active` and must be terminated through cancellation.

# 15. Session Delivery

## FR-SESSION-008 — Conduct Session

**Actor:** Tutor

Tutor SHALL be able to conduct the scheduled Session.

---

## FR-SESSION-009 — Session Completion via Grace Period

A Session SHALL reach `Completed` after the 12h grace period expires without an active issue report, or after
Admin resolves the dispute with a financial decision (`StudentWinsFullRefund` / `StudentWinsPartialRefund` /
`TutorWinsReleaseEarning`).

> **Current-behavior note:** `DismissedNoFinancialChange` dismisses the dispute but does not call
> `session.CompleteByAdmin(...)`, so the Session remains `AwaitingPayout` with `HasIssueReport = true`. This is a
> known implementation gap, not the intended completion rule.

### Flow

```text
Session Ends
→ Start 12h Grace Period (Scheduled → AwaitingPayout)
→ No issue report
→ AutoComplete
→ Session Completed + Payout Released
```

---

## FR-SESSION-010 — No-show Handling

No-show is **not** an implemented attendance outcome or Session status.

### Business Rule

- If the Tutor does not deliver the session, the Student reports an issue during the 12h grace period.
- Admin resolves the dispute (refund, partial refund, tutor wins, or dismissal).
- The legacy no-show strikes flow is not implemented.

---

# 16. Grace Period & Issue Report (replaces Attendance Verification)

> **RETIRED:** Toàn bộ FR-ATT-001 → FR-ATT-008 cũ (bilateral attendance verification, attendance conflict, verification window, attendance reminder) đã bị bỏ. Phần dưới là requirements hiện hành.

## FR-GRACE-001 — Start Grace Period

**Actor:** System

When a `Scheduled` Session's `EndAt <= now`, the system SHALL transition it to `AwaitingPayout` and set:

- `GracePeriodStartedAt = now`
- `GracePeriodEndsAt = now + 12h`

### Business Rules

- The job is idempotent: a session with an existing `GracePeriodStartedAt` is skipped.
- `GracePeriodStartedEvent` is emitted to notify the Student.

---

## FR-GRACE-002 — Student Issue Report

**Actor:** Student

During the grace period, the owning Student SHALL be able to report an issue for the Session.

### Business Rules

- Only the Student of the Enrollment may report.
- Session must be `AwaitingPayout`, `IsPayoutReleased = false`, and `GracePeriodEndsAt > now`.
- Exactly one active issue/dispute per Session.
- Reporting freezes payout and creates a Dispute.
- `SessionIssueReportedEvent` is emitted.

> Legacy generic dispute creation may also be available to Student/Tutor, but the normal post-session path is the student issue report during grace.

---

## FR-GRACE-003 — Auto-complete and Payout Release

**Actor:** System

When the grace period expires with no active issue report, the system SHALL:

```text
Session AwaitingPayout
→ Session Completed
→ IsPayoutReleased = true
→ Debit TutorWallet.Pending (gross)
→ Credit TutorWallet.Available (net)
→ Transaction SessionPayoutCredit (Released)
→ SessionCompletedEvent
```

### Business Rules

- Payout uses the Enrollment snapshot fee rate.
- `Available = gross − platform fee`.
- The operation is idempotent (`IsPayoutReleased` guard).
- Once released, the session cannot be disputed and no clawback occurs.

---

## FR-GRACE-004 — Grace Period Duration (fixed 12h)

The current implementation SHALL use a **12-hour** grace period.

### Business Rule

- `AutoPayoutJob` hardcodes `TimeSpan.FromHours(12)`; there is no Admin setting read by the job.
- Admin configuration is **deferred / not implemented** (`FR-CONFIG-004`).
- If configuration is added later, it must apply only to new grace periods; existing sessions keep their recorded `GracePeriodEndsAt`.

---

# 17. Learning Record

## FR-LEARN-001 — Create Learning Record

**Actor:** Tutor

Tutor SHALL be able to create a Learning Record for a delivered Session.

---

## FR-LEARN-002 — View Learning Record

**Actor:** Student

Student SHALL be able to view Learning Records associated with their learning.

---

## FR-LEARN-003 — Learning Record Ownership

Student SHALL NOT directly modify Tutor-created Learning Records.

---

## FR-LEARN-004 — Learning Record Independence

Learning Record SHALL NOT determine whether Tutor earnings are released.

Earning release SHALL depend on the Session grace period / dispute resolution process.

---

# 18. Earnings

## FR-EARN-001 — Allocate Enrollment Value to Sessions

System SHALL allocate the Enrollment price across Sessions.

### Business Rule

```text
Sum(Session Values)
=
Total Enrollment Price
```

---

## FR-EARN-002 — Rounding

When Session allocation produces a rounding remainder, the remainder SHALL be assigned to the final Session.

Example:

```text
1,000,000 / 3

Session 1 = 333,333
Session 2 = 333,333
Session 3 = 333,334
```

---

## FR-EARN-003 — Session Earning Creation

When a Session becomes eligible for earning release:

```text
Session Completed
→ Calculate Earning
→ Apply Platform Fee
→ Tutor Balance
```

---

## FR-EARN-004 — Earning Release Protection

System SHALL NOT release Tutor earning for a Session that is:

- Still inside the 12h grace period (`AwaitingPayout`).
- Subject to an active issue report / dispute.
- Subject to an applicable financial hold.

---

# 19. Tutor Balance

## FR-WALLET-001 — Track Tutor Earnings

System SHALL maintain Tutor financial balances.

At minimum, the system SHALL distinguish:

- Pending earnings.
- Available balance.

---

## FR-WALLET-002 — Pending Earnings

Earnings not yet eligible for withdrawal SHALL remain Pending.

---

## FR-WALLET-003 — Available Balance

Only Available Balance SHALL be eligible for withdrawal.

---

## FR-WALLET-004 — Financial Traceability

System SHALL maintain traceable records for:

```text
Payment
→ Holding
→ Session Allocation
→ Earning
→ Platform Fee
→ Balance
→ Withdrawal
```

---

# 20. Withdrawal

## FR-WITHDRAW-001 — Request Withdrawal

**Actor:** Tutor

Tutor SHALL be able to request withdrawal from Available Balance.

---

## FR-WITHDRAW-002 — Validate Withdrawal

System SHALL verify that the requested amount is eligible for withdrawal.

### Business Rule

Pending earnings cannot be withdrawn.

---

## FR-WITHDRAW-003 — Withdrawal Lifecycle

System SHALL support:

```text
Pending
→ Processing
→ Completed
```

or:

```text
Pending / Processing
→ Failed
```

---

## FR-WITHDRAW-004 — Failed Withdrawal

If a withdrawal fails:

- Withdrawal SHALL be marked `Failed`.
- Financial amount SHALL be handled according to financial policy.
- Tutor Balance SHALL NOT be silently modified.
- Any financial correction SHALL be represented by an explicit financial record.

---

## FR-WITHDRAW-005 — Withdrawal History

Tutor SHALL be able to view withdrawal history.

---

# 20.1. Student Wallet (Unified User Wallet Architecture)

## FR-SWALLET-001 — Student Wallet Balance Model

**Actor:** Student

System SHALL maintain a unified internal wallet (`Wallet`) for each User profile (1:1 User-Wallet relationship).

The system SHALL track:
- `AvailableBalance`: Eligible for course booking payment and withdrawal.
- `WithdrawingBalance`: Funds locked during pending withdrawal requests (aliased as `ReservedBalance` for legacy frontend compatibility).
- `PendingBalance`: Escrow balance awaiting auto-payout release for tutors.
- Balance Invariants: `AvailableBalance >= 0`, `WithdrawingBalance >= 0`, and `PendingBalance >= 0` enforced by database check constraint `CK_Wallet_NonNegativeBalances`.

---

## FR-SWALLET-002 — Automated VNPay Payment Gateway Top-Up
 
**Actor:** Student, System
 
Student SHALL be able to initiate a top-up request (`TopUpRequest`) specifying an amount (>= 10,000 VND).
 
The system SHALL generate a unique merchant transaction reference formatted with prefix `TOPUP...` and a secured payment URL targeting the VNPay Sandbox 2.1.0 payment gateway.
 
Upon user authorization and payment gateway callback/webhook verification (HMAC-SHA512), the system SHALL credit `AvailableBalance` and record an immutable `WalletTransaction` (`Type: TopUpCredit`). The request status becomes `Confirmed` (not `Approved`).

Admin MAY also confirm a pending `TopUpRequest` manually; that path credits the same ledger type and transitions `Pending → Confirmed`.

---

## FR-SWALLET-003 — Course Booking Payment (Wallet or VNPay)

**Actor:** Student

Student SHALL be able to pay course booking fees using either:

- Student Wallet `AvailableBalance`; or
- VNPay direct payment.

Wallet payment is the primary path but is **not mandatory**. If the wallet balance is insufficient, the system SHALL prevent the wallet payment and direct the student to top up or choose VNPay.

Wallet payment SHALL be executed atomically within a database transaction with pessimistic row lock (`SELECT ... FOR UPDATE`):
- Debit `AvailableBalance`.
- Record append-only `WalletTransaction` (`Type: CoursePaymentDebit`).
- Create/update platform escrow `Transaction` (`Status: Held`).
- Transition `Booking` to **`Paid`** and `Enrollment` to `Active`.

VNPay direct payment SHALL converge on the same `Booking.Paid` + `Enrollment.Active` outcome after a verified IPN.

---

## FR-SWALLET-004 — Direct Refund to Student Wallet

**Actor:** System

All refunds arising from enrollment cancellation, session cancellation, or dispute resolution SHALL route directly and immediately into the student's `AvailableBalance`.

The system SHALL record an append-only `WalletTransaction` (`Type: RefundCredit`).

Refunded funds SHALL immediately be available for enrolling in other courses or requesting bank withdrawal.

---

## FR-SWALLET-005 — Append-Only Ledger Immutability

**Actor:** System

Every financial balance change on a Wallet SHALL create an append-only `WalletTransaction`.

Updating or deleting existing `WalletTransaction` rows SHALL be strictly forbidden and blocked by EF Core guards (`AppDbContext.EnforceLedgerImmutability()`).

---

# 20.2. Student Withdrawal

## FR-SWITHDRAW-001 — Request Student Withdrawal

**Actor:** Student

Student SHALL be able to request a withdrawal from `AvailableBalance` to their designated bank account.
- Minimum withdrawal threshold: 50.000 VNĐ.
- The requested amount SHALL move from `AvailableBalance` to `ReservedBalance`.
- A `StudentWithdrawal` record SHALL be created with status `Pending`.

---

## FR-SWITHDRAW-002 — Student Withdrawal Lifecycle

**Actor:** Admin, Student

The system SHALL enforce the student withdrawal lifecycle:

```text
Pending (Available → Reserved)
→ Processing (Admin begins transfer: ProcessingStartedByAdminId)
→ Completed (Admin confirms bank transfer: Reserved deducted, ProcessedAt recorded)
```

or:

```text
Pending / Processing → Failed (Transfer unsuccessful: Reserved restored to Available, FailureReason recorded)
```

Admin SHALL NOT transition a withdrawal directly from `Pending` to `Completed` without acquiring `Processing` status first.

---

# 21. Cancellation

## FR-CANCEL-001 — Student Cancellation Request

**Actor:** Student

Student SHALL be able to request cancellation according to Cancellation Policy.

---

## FR-CANCEL-002 — Apply Cancellation Policy

System SHALL determine cancellation consequences based on applicable:

- Cancellation timing.
- Session status.
- Service policy.
- Platform rules.

---

## FR-CANCEL-003 — Cancellation Financial Consequence

System SHALL determine whether cancellation results in:

- No refund.
- Partial refund.
- Full refund.
- Other applicable financial adjustment.

The exact policy matrix SHALL be defined separately.

---

## FR-CANCEL-004 — Cancellation Processing

Cancellation SHALL:

```text
Cancellation Request
→ Apply Policy
→ Determine Financial Consequence
→ Cancel Enrollment / Session
→ Refund where applicable
→ Notify affected parties
→ Audit
```

---

# 22. Tutor Cannot Continue

## FR-CONTINUE-001 — Report Tutor Cannot Continue

System SHALL support processing when a Tutor cannot continue an Enrollment.

---

## FR-CONTINUE-002 — Cancel Enrollment

When Tutor cannot continue:

```text
Enrollment
→ Cancelled
```

---

## FR-CONTINUE-003 — Refund Unused Portion

System SHALL calculate and refund the applicable unused portion of the Enrollment.

---

## FR-CONTINUE-004 — Stop Future Sessions

Future Sessions belonging to the cancelled Enrollment SHALL no longer be delivered as normal Sessions.

---

## FR-CONTINUE-005 — No Automatic Tutor Transfer

System SHALL NOT automatically transfer the Student to another Tutor.

Student may return to the marketplace and find another Tutor independently.

---

# 23. Tutor No-show

## FR-NOSHOW-001 — Record Tutor No-show (RETIRED)

**RETIRED (v1.5):** Attendance outcome and no-show strike flow are not implemented.

Current behavior:

- Student reports the issue during the 12h grace period.
- Admin resolves the dispute as refund / partial refund / tutor wins / dismissal.
- No `AbsentStrikes`, `StrikeWindowStart`, `LastAbsentAt`, or `IsBookingBlocked` logic exists.

---

## FR-NOSHOW-002 — Tutor Earning

Tutor SHALL NOT receive earning for a Session where Tutor No-show results in the Session not being eligible for earning.

---

## FR-NOSHOW-003 — Makeup Session (OUT OF SCOPE)

No Makeup Session entity/flow is implemented. Any makeup arrangement is outside the system; the affected session is handled via cancellation or dispute resolution.

The exact Makeup Session workflow is not sufficiently specified in the current PRD and requires further functional definition before implementation.

---

# 24. Refund

## FR-REFUND-001 — Refund Trigger

System SHALL support refunds triggered by:

- Cancellation Policy.
- Tutor cannot continue.
- Dispute resolution.
- Platform/payment issue.

---

## FR-REFUND-002 — Create Refund

Every refund SHALL create a financial record containing at minimum:

- Refund amount.
- Reason.
- Related transaction.

---

## FR-REFUND-003 — Refund Completion

System SHALL track refund processing and completion where supported by the payment flow.

---

## FR-REFUND-004 — Refund Audit

Every refund SHALL have an associated audit trail.

---

# 25. Dispute

## FR-DISPUTE-001 — Create Dispute

Student SHALL be able to create a formal Dispute within the 12-hour grace period of a session (pre-release only).

A session past its grace window without a report is deemed accepted and can no longer be disputed.

Supported dispute categories include:

- Session delivery / buổi học không diễn ra như cam kết.
- Chất lượng hoặc nội dung buổi học.
- Financial issue.
- Service issue.

Cancellation is not a dispute category: a cancelled Session is no longer `AwaitingPayout`, and cancellation/refund is handled by its own flow.

### Business Rule (v1.1 anti-spam; v1.4/v1.5 12h-grace rule)

- `Description` từ 20 đến 2000 ký tự.
- Financial resolutions require at least one uploaded evidence before Admin may resolve (dismissal without financial change exempt).
- Only sessions in `AwaitingPayout` status with `IsPayoutReleased = false` and an unexpired grace window may be disputed. `Completed` (released) sessions are rejected.
- One active dispute per Session.

---

## FR-DISPUTE-002 — Dispute Lifecycle

System SHALL support:

```text
Issue (within 12h grace)
→ Dispute Created
→ Escrow Payout Frozen
→ Admin Investigation
→ Resolution
```

---

## FR-DISPUTE-003 — Financial Hold

While a pre-release Dispute is unresolved, the affected session earning stays locked in Pending escrow and is not released to the Tutor. No Tutor Available balance is held (v1.4: post-release balance holds removed — released sessions cannot be disputed). The grace-period auto-payout job skips sessions with an active issue report.

---

## FR-DISPUTE-004 — Admin Investigation

Admin SHALL be able to review relevant evidence, including:

- Student statement.
- Tutor statement.
- Session information and grace/issue-report timestamps.
- Conversation context.
- Evidence.
- Financial records.

---

## FR-DISPUTE-005 — Dispute Resolution

Admin SHALL be able to resolve a Dispute using one of the supported outcomes:

- Student wins.
- Tutor wins.
- Partial adjustment.
- No action.

### Fast-track — REMOVED (v1.4/v1.5)

The fast-track template no longer exists. All pre-release disputes are resolved through the standard `AdminResolveDispute` flow with one of the supported outcomes. Post-release disputes and clawbacks are also removed.

---

## FR-DISPUTE-006 — Financial Resolution

A Dispute resolution SHALL trigger the applicable financial consequence, such as:

- Release funds.
- Refund Student.
- Partial adjustment.
- Other explicit financial adjustment.

---

## FR-DISPUTE-007 — Dispute Notification

Affected parties SHALL be notified after Dispute resolution.

---

## FR-DISPUTE-008 — Review Is Not Dispute

System SHALL keep Review and Dispute as separate mechanisms.

Chat or Review SHALL NOT substitute for a formal Dispute.

---

# 26. Reviews & Ratings

## FR-REVIEW-001 — Review Eligibility

Student SHALL be allowed to create a Review only when the Enrollment satisfies the applicable Review Policy.

At minimum, the PRD establishes that review occurs after Enrollment ends.

---

## FR-REVIEW-002 — Create Review

**Actor:** Student

Student SHALL be able to submit:

- Rating.
- Written review.

---

## FR-REVIEW-003 — Review Uniqueness

A single Enrollment SHALL NOT create unlimited Reviews.

The exact cardinality rule SHALL be finalized during detailed domain specification.

---

## FR-REVIEW-004 — Tutor Reply

**Actor:** Tutor

Tutor SHALL be able to reply to a Review.

---

## FR-REVIEW-005 — Publish Review

Reviews SHALL be published through the normal platform flow unless moderation rules require intervention.

---

## FR-REVIEW-006 — Report Review

User SHALL be able to report a Review that potentially violates platform policy.

---

## FR-REVIEW-007 — Moderate Review

**Actor:** Admin

Admin SHALL be able to remove a reported Review when it violates policy.

### Business Rules

- Removal requires a reason.
- Admin does not silently rewrite the Review.

---

# 27. Trust & Safety

## FR-TRUST-001 — Report User

Student and Tutor SHALL be able to report another user.

---

## FR-TRUST-002 — Block User

Student and Tutor SHALL be able to block another user.

---

## FR-TRUST-003 — Admin Investigation

Admin SHALL be able to investigate Trust & Safety reports.

---

## FR-TRUST-004 — Enforcement

Admin SHALL be able to take applicable enforcement actions:

- Dismiss.
- Warn.
- Suspend.
- Ban.
- Remove violating content.
- Remove violating Service.

---

# 28. Notifications

## FR-NOTIF-001 — Create Notification from Business Event

System SHALL generate Notifications from applicable Business Events.

Conceptually:

```text
Business Event
→ Business Consequences
→ Notification
```

Notification SHALL NOT determine or modify business state.

---

## FR-NOTIF-002 — In-app Notifications

MVP SHALL provide in-app notifications.

---

## FR-NOTIF-003 — Email Notifications

System SHALL provide asynchronous email notifications for all applicable business and security events via `NotificationDeliveryPolicy`.

### Delivery Architecture & Policy
- **Event Coverage:** Email notifications are enabled for the domain business events plus critical identity & security operations:
  1. *Marketplace & Applications:* `TutorApplicationSubmitted`, `TutorApplicationApproved`, `TutorApplicationRejected`.
  2. *Enrollment & Payments:* `PaymentSucceeded`, `EnrollmentActivated`, `EnrollmentCancelled`.
  3. *Sessions & Grace Period:* `SessionScheduled`, `SessionRescheduled`, `SessionCancelled`, `GracePeriodStarted`, `SessionIssueReported`, `SessionCompleted`.
  4. *Financial & Escrow:* `EarningCreated`, `RefundCreated`, `RefundCompleted`, `RefundFailed` (alerting student of administrative offline settlement), `WithdrawalRequested`, `WithdrawalCompleted`, `WithdrawalFailed`.
  5. *Trust, Disputes & Reviews:* `ReviewCreated`, `DisputeCreated`, `DisputeResolved`, `ReportCreated`, `ReportResolved`.
  6. *Identity, Authentication & Security:* `AccountVerification` (registration welcome & account verification), `PasswordChanged` (security alert on credential modification).
- **Direct Dispatch with Background Retry Fallback:** Generating a notification creates an `EmailDelivery` record and dispatches email immediately via `IEmailSender`. Upon success, status transitions immediately to `Sent`.
- **Background Fallback (`EmailDeliveryJob`):** If immediate dispatch fails, status remains `Pending` and a background hosted service periodically claims batches of pending/expired email deliveries using lease-locking (`LockedUntil`, `LockedBy`), executes delivery through `IEmailSender`, handles exponential backoff retries (up to 5 attempts), and transitions status to `Sent` or `Failed`.
- **Dual Transport Sender:**
  - *Development / Personal-first mode:* Handled by `LogOnlyEmailSender`, logging full recipient, subject, idempotency key, and body to the console for inspection without external cloud credentials.
  - *Production mode:* Handled by `MailKitEmailSender` integrating with MailKit SMTP (Gmail, custom SMTP, etc.).

---

## FR-NOTIF-004 — Notification Center

User SHALL be able to:

- View notifications.
- Mark a notification as read.
- Mark all notifications as read.

---

## FR-NOTIF-005 — Notification Deep Link

Relevant notifications SHALL link the user to the associated context.

Examples:

```text
Payment Successful
→ Payment / Enrollment

Session Issue Reported
→ Session / Dispute

Earning
→ Wallet Transaction

Dispute Resolved
→ Dispute
```

---

## FR-NOTIF-006 — Critical Notifications

Notifications related to the following SHALL not be completely disabled and SHALL be marked `IsCritical = true`:

- **Payments & Enrollments:** `PaymentSucceeded`, `EnrollmentActivated`, `EnrollmentCancelled`.
- **Sessions:** `SessionCancelled`, `SessionIssueReported`.
- **Refunds:** `RefundCreated`, `RefundCompleted`, `RefundFailed`.
- **Withdrawals:** `WithdrawalRequested`, `WithdrawalCompleted`, `WithdrawalFailed`.
- **Disputes:** `DisputeCreated`, `DisputeResolved`.
- **Identity & Security:** `AccountVerification`, `PasswordChanged`.

---

## FR-NOTIF-007 — Session Reminder

System SHALL send a Session reminder before the scheduled Session.

### MVP Rule

Default reminder:

```text
24 hours before Session
```

---

## FR-NOTIF-008 — Grace Period Notification

System SHALL notify the Student when a Session enters `AwaitingPayout` and the 12h grace period starts.

The notification SHALL include the grace deadline and a deep link to report an issue. No attendance reminder exists.

---

# 29. Business Events

System SHALL support business events for important state transitions.

## FR-EVENT-001 — Marketplace Events

System SHALL support events including:

- `TutorApplicationSubmitted`
- `TutorApplicationApproved`
- `TutorApplicationRejected`

---

## FR-EVENT-002 — Enrollment Events

System SHALL support:

- `PaymentSucceeded`
- `EnrollmentActivated`
- `EnrollmentCancelled`

---

## FR-EVENT-003 — Session Events

System SHALL support:

- `SessionScheduled`
- `SessionRescheduled`
- `SessionCancelled`
- `GracePeriodStarted`
- `SessionIssueReported`
- `SessionCompleted`

---

## FR-EVENT-004 — Financial Events

System SHALL support:

- `EarningCreated`
- `RefundCreated`
- `RefundCompleted`
- `RefundFailed` (v1.1)
- `WithdrawalRequested`
- `WithdrawalCompleted`
- `WithdrawalFailed`
- `StudentTopUpRequested`
- `StudentTopUpConfirmed`
- `StudentTopUpRejected`
- `StudentWalletPaymentSucceeded`
- `StudentWithdrawalRequested`
- `StudentWithdrawalCompleted`
- `StudentWithdrawalFailed`

---

## FR-EVENT-005 — Trust Events

System SHALL support:

- `ReviewCreated`
- `DisputeCreated`
- `DisputeResolved`
- `ReportCreated`
- `PlatformSettingChanged` was a v1.1 proposal and is not emitted by the current implementation.

---

# 30. Admin User Management

## FR-ADMIN-001 — View User

**Actor:** Admin

Admin SHALL be able to view user information required for platform operations.

---

## FR-ADMIN-002 — Suspend User

Admin SHALL be able to suspend a user.

---

## FR-ADMIN-003 — Reactivate User

Admin SHALL be able to reactivate a suspended user.

---

## FR-ADMIN-004 — Ban User

Admin SHALL be able to ban a user.

---

# 31. Admin Service Governance

## FR-ADMIN-005 — Moderate Service

Admin SHALL be able to:

- Unpublish violating Service.
- Remove violating content.
- Require Tutor correction.

---

## FR-ADMIN-006 — No Silent Service Editing

Admin SHALL NOT silently edit Tutor-owned Service content on behalf of the Tutor.

---

# 32. Admin Enrollment Oversight

## FR-ADMIN-007 — View Enrollment

Admin SHALL have read visibility into Enrollment information.

---

## FR-ADMIN-008 — Exceptional Enrollment Intervention

Admin SHALL be able to intervene in Enrollment only for exceptional situations, including:

- Fraud.
- Serious safety issue.
- Tutor banned.
- Platform error.
- Dispute resolution.

---

# 33. Administrative Cancellation

## FR-ADMIN-009 — Cancel Enrollment Administratively

Admin SHALL be able to cancel an Enrollment in exceptional cases.

### Business Rules

- Cancellation reason is mandatory.
- Financial consequences must be explicitly determined.
- Affected parties must be notified.
- Administrative action must be audited.

---

# 34. Admin Refund Operations

## FR-ADMIN-010 — Process Refund

Admin SHALL be able to process refunds where platform policy permits.

Every refund SHALL contain:

- Amount.
- Reason.
- Related transaction.
- Audit record.

---

# 35. Admin Withdrawal Operations

## FR-ADMIN-011 — Withdrawal Management & Governance

Admin SHALL be able to manage, monitor, and transition Tutor withdrawal requests via a dedicated administrative dashboard (`/admin/withdrawals`).

### API Endpoints & Capabilities
1. `GET /api/v1/admin/withdrawals`: Paginated listing of withdrawal requests with status filtering (`Pending`, `Processing`, `Completed`, `Failed`).
2. `GET /api/v1/admin/withdrawals/{id}`: Detailed view of a single withdrawal request including bank account details, tutor identity, and timestamps.
3. `POST /api/v1/admin/withdrawals/{id}/process`: Transition status from `Pending` to `Processing` when the payout operation has been claimed.
4. `POST /api/v1/admin/withdrawals/{id}/complete`: Mark withdrawal as `Completed` upon bank confirmation, emitting `WithdrawalCompletedEvent` and logging an audit record.
5. `POST /api/v1/admin/withdrawals/{id}/fail`: Mark withdrawal as `Failed` with a mandatory failure reason.

### Business Rules & Safeguards
- **Balance Protection:** When a withdrawal is marked `Failed`, the system securely returns the held funds back to the Tutor's `AvailableBalance` (`wallet.RefundFailedWithdrawal(...)`).
- **Audit Logging:** Every administrative transition (`Process`, `Complete`, `Fail`) records an immutable entry into the Central Audit Log.
- **Notification & Email Dispatch:** Events `WithdrawalCompletedEvent` and `WithdrawalFailedEvent` automatically notify the Tutor in-app and via email.

---

## FR-ADMIN-012 — Protect Tutor Balance

Admin SHALL NOT arbitrarily modify Tutor Balance.

Any financial correction SHALL be represented as an explicit financial adjustment record.

---

# 36. Admin Dispute Operations

## FR-ADMIN-013 — Investigate Dispute

Admin SHALL be able to inspect all relevant information necessary for dispute investigation.

---

## FR-ADMIN-014 — Resolve Dispute

Admin SHALL be able to resolve a Dispute according to supported resolution outcomes.

---

# 37. Platform Configuration

## FR-CONFIG-001 — Platform Fee

Admin SHALL be able to configure the platform fee.

---

## FR-CONFIG-002 — Cancellation Policy (DEFERRED — plumbing only)

**Current implementation:** cancellation rules are hardcoded in `CancelSessionCommandHandler` /
`SessionSchedulePolicy`; the `CancellationPolicy` setting key is an opaque JSON placeholder and is not read.

**Deferred requirement:** if Admin configuration is added, it must apply only to new transactions.

---

## FR-CONFIG-003 — Refund Rules (DEFERRED — plumbing only)

**Current implementation:** refund behavior is hardcoded in the enrollment/session cancellation and dispute
handlers; the `RefundRules` setting key is an opaque JSON placeholder and is not read.

**Deferred requirement:** if Admin configuration is added, it must apply only to new transactions.

---

## FR-CONFIG-004 — Grace Period Duration (DEFERRED — not implemented)

**Current implementation:** the grace period is **fixed at 12 hours** in `AutoPayoutJob`
(`TimeSpan.FromHours(12)`). There is no Admin setting read by the job.

**Deferred requirement:** if Admin configuration is added later, it must apply only to new grace periods;
existing sessions keep their recorded `GracePeriodEndsAt`. The legacy `VerificationWindowHours` key is unused
and must not be treated as the grace-period setting.

---

## FR-CONFIG-005 — Withdrawal Rules (DEFERRED — plumbing only)

**Current implementation:** the 50,000 VND minimum, `AvailableBalance` limit, and status transitions are
hardcoded in the withdrawal handlers; the `WithdrawalRules` setting key is an opaque JSON placeholder and is
not read.

**Deferred requirement:** if Admin configuration is added, it must apply only to new transactions.

---

## FR-CONFIG-006 — Review Window

Admin SHALL be able to configure the Review Window.

---

## FR-CONFIG-007 — Policy Versioning / Historical Integrity

Policy changes SHALL apply according to the applicable rule for new transactions.

Historical transactions SHALL NOT be retroactively changed solely because platform policy has changed.

### Status (current implementation; v1.1 decision superseded)

The v1.1 fee-versioning decision specified `PlatformSetting` + `PlatformSettingVersion` history and a per-Enrollment `FeePolicyVersion`. Migration `RemovePlatformSettingsAndVersions` removed those tables and the version field. The current implementation snapshots only `PlatformFeeRate` from application configuration at Enrollment activation. Remaining policy questions should be checked against the current handlers rather than treated as unimplemented from this historical decision.

---

# 38. Audit Log

## FR-AUDIT-001 — Audit Administrative Actions

System SHALL create Audit Logs for important Admin actions.

---

## FR-AUDIT-002 — Audit Information

Audit information SHALL identify:

```text
Who?
What?
Why?
When?
What was affected?
```

---

## FR-AUDIT-003 — Financial Auditability

Financial corrections SHALL be represented as explicit financial records.

System SHALL NOT silently rewrite or delete historical financial transactions.

---

# 39. Financial Integrity

## FR-FIN-001 — Immutable Financial History

Historical financial transactions SHALL not be silently modified or deleted.

---

## FR-FIN-002 — Explicit Financial Adjustment

When a financial correction is required, system SHALL create an explicit adjustment record containing an appropriate reason.

---

## FR-FIN-003 — Enrollment Total Integrity

System SHALL guarantee:

```text
Total Enrollment Price
=
Sum of Session Allocations
```

including rounding remainder handling.

---

## FR-FIN-004 — Money Movement Traceability

Every relevant money movement SHALL be traceable through:

```text
Payment
→ Holding
→ Session Allocation
→ Earning
→ Fee
→ Balance
→ Withdrawal
```

or through an explicit Refund / Adjustment path.

---

# 40. Standard Service End-to-End Flow

System SHALL support:

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
12h Grace Period
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

# 41. Custom Service End-to-End Flow — REMOVED (v1.3)

> Đã xóa hẳn. Chỉ còn Standard Service flow.

---

# 42. Cancellation Flow

System SHALL support:

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

# 43. Tutor Cannot Continue Flow

System SHALL support:

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

The system SHALL NOT automatically assign a replacement Tutor.

---

# 44. Grace Period & Issue Report Flow

System SHALL support:

```text
Session Ends
      ↓
Grace Period 12h
      ↓
Student reports issue?
   ┌──┴──┐
  No    Yes
   │      │
   ▼      ▼
Auto-   Payout Frozen
complete     ↓
   │      Dispute
   ▼      ↓
Payout  Admin Resolution
Released
```

---

# 45. Grace Period Timeout Flow

System SHALL support:

```text
Session Ends
      ↓
12h Grace Period
      ↓
Issue reported?
   ┌────┴────┐
  No        Yes
   │          │
   ▼          ▼
Auto-     Dispute
complete  (pre-release)
   ↓
Payout Released
```

---

# 46. Dispute Flow

System SHALL support:

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

# 47. MVP Functional Scope

## Student

The MVP SHALL support:

- Account.
- Marketplace discovery.
- Tutor Profile.
- Service discovery.
- Trial Lesson.
- Messaging.
- Payment.
- Enrollment.
- Schedule.
- Session.
- 12h grace period & issue reporting.
- Learning Record viewing.
- Cancellation.
- Refund.
- Dispute.
- Review.
- Notifications.

## Tutor

The MVP SHALL support:

- Tutor Application.
- Tutor Approval.
- Tutor Profile.
- Service.
- Trial Lesson.
- Messaging.
- Enrollment Management.
- Schedule.
- Session Management.
- Issue/dispute response.
- Learning Record.
- Earnings.
- Balance.
- Withdrawal.
- Review Response.

## Admin

The MVP SHALL support:

- Tutor Approval.
- User Management.
- Service Moderation.
- Enrollment Oversight.
- Refund.
- Withdrawal Operations.
- Dispute.
- Report.
- Review Moderation.
- Platform Configuration.
- Audit.

---

# 48. Explicit Functional Exclusions

The following SHALL NOT be implemented as MVP functional requirements:

- Automatic Tutor matching.
- Automatic Tutor replacement.
- Voice calling.
- Video calling.
- Group tutoring.
- Complex subscription billing.
- Native mobile applications.
- SMS notification.
- Advanced AI Tutor matching.
- Automated fraud scoring.
- Automated dispute resolution.
- Multi-level Admin RBAC.
- Advanced marketing automation.
- Complex notification automation.
- Full CMS.
- Advanced Tutor ranking algorithm.

---

# 49. Requirements Requiring Further Specification

Các điểm dưới đây **đã xuất hiện trong PRD nhưng chưa đủ chi tiết để trở thành implementation-ready requirements**. Chúng không được tự ý quyết định trong FR này.

## FR-OPEN-001 — Marketplace Filter Criteria

PRD yêu cầu filtering nhưng chưa định nghĩa chính xác các filter.

Cần xác định:

- Filter nào?
- Data source?
- Single-select / multi-select?
- Sorting có thuộc discovery không?

---

## FR-OPEN-002 — Cancellation Policy Matrix

PRD yêu cầu policy dựa trên:

- Timing.
- Session status.
- Service policy.
- Platform rules.

Cần xác định chính xác từng trường hợp và financial consequence.

---

## FR-OPEN-003 — Refund Calculation

Cần xác định công thức:

```text
Refund Amount
=
?
```

đặc biệt với:

- Đã completed Session.
- Pending Session.
- Cancelled Session.
- Platform fee.
- Tutor earning đã release.
- Dispute adjustment.

---

## FR-OPEN-004 — Session Allocation Formula

PRD xác định tổng Session Allocation phải bằng Enrollment Price và remainder vào Session cuối.

Cần xác định thêm cách xử lý:

- Different Session durations.
- Cancelled Sessions.
- Partial Enrollment.
- Refund sau khi một phần earning đã release.

---

## FR-OPEN-005 — Grace Period Duration (RESOLVED)

**Resolved (v1.5):** the verification window is replaced by the post-session grace period.

```text
Grace Period = 12 hours (fixed in current implementation)
```

`AutoPayoutJob` hardcodes 12 hours. Admin configuration is **deferred / not implemented** (see
`FR-CONFIG-004`); the legacy `VerificationWindowHours` key is not read. If configuration is added, existing
sessions must keep their recorded `GracePeriodEndsAt`.

---

## FR-OPEN-006 — Review Window

PRD yêu cầu Review Window có thể cấu hình nhưng chưa định nghĩa default value.

---

## FR-OPEN-007 — Withdrawal Rules

Cần xác định:

- Minimum withdrawal amount.
- Processing time.
- Supported payout method.
- Withdrawal fee.
- Failure handling.
- Frequency/limits.

---

## FR-OPEN-008 — Platform Fee

Cần xác định:

- Fee percentage/fixed amount.
- Fee calculation basis.
- Whether fee applies per earning or enrollment.
- Rounding rule.
- Policy version applied to transaction.

### Status (current implementation; historical questions above)

The v1.1 versioned-setting design was superseded. Current code snapshots the percentage `PlatformFeeRate` on Enrollment activation and computes fee per released earning with `PlatformFeeCalculator.SplitGross`. The historical questions above remain as decision history, not a description of the current schema.

---

## FR-OPEN-009 — Makeup Session

PRD đề cập Makeup Session trong trường hợp Tutor No-show nhưng chưa định nghĩa đầy đủ lifecycle.

Cần xác định:

- Who creates it?
- Who proposes it?
- Student acceptance?
- Relation to original Session?
- Financial allocation?
- Maximum number of makeup attempts?
- Cancellation behavior?

---

## FR-OPEN-010 — Notification Delivery Rules (Resolved in v1.2)

Resolved and enforced via `NotificationDeliveryPolicy` and `EmailDeliveryJob`:
- Channel routing: Realtime push (SignalR `/hubs/notifications`) for business events; Chat messages dispatched directly via `/hubs/chat`; Email delivery for core domain events and authentication security operations.
- Retry behavior: Exponential backoff with up to 5 attempts managed through `EmailDeliveryJob` lease locking (60s).
- Failure handling: Unsuccessful deliveries after 5 attempts are marked `EmailDeliveryStatus.Failed` for observability.
- Critical notifications: Explicit set of 14 event types marked `IsCritical = true` that cannot be suppressed.

---

## FR-OPEN-011 — Report Categories

Report được yêu cầu nhưng chưa định nghĩa đầy đủ:

- Report types.
- Required evidence.
- Report lifecycle.
- Resolution SLA.
- Reporter visibility.

---

## FR-OPEN-012 — Block Behavior

PRD yêu cầu Block nhưng chưa định nghĩa:

- Whether existing conversations remain visible.
- Whether new messages are prevented.
- Whether marketplace visibility changes.
- Whether existing Enrollment is affected.

---

## FR-OPEN-013 — Account Registration & Credential Lifecycle (Resolved in v1.2)

Resolved and implemented in Authentication slice:
- Authentication: JWT access token (15-min lifetime) + sliding refresh token rotation.
- Password policy: Minimum 8 characters, hashed with BCrypt (`workFactor = 11`). Plaintext passwords are never stored or logged.
- Account verification: Registration dispatches critical in-app notification and queues welcome & verification email (`AccountVerification`).
- Password change: Verifies current password hash, revokes all unexpired active refresh tokens, updates password hash, creates critical security notification, and dispatches urgent security alert email (`PasswordChanged`).

---

# 50. Functional Requirement Baseline

Functional baseline của TutorHub MVP được tổng hợp thành các capability chính:

```text
AUTHENTICATION
     ↓
TUTOR APPLICATION
     ↓
TUTOR PROFILE
     ↓
SERVICE
     ↓
MARKETPLACE
     ↓
TRIAL LESSON
     ↓
MESSAGING
     ↓
PAYMENT
     ↓
ENROLLMENT
     ↓
SCHEDULE
     ↓
SESSION
     ↓
GRACE PERIOD
     ↓
LEARNING RECORD
     ↓
EARNING
     ↓
BALANCE
     ↓
WITHDRAWAL
     ↓
REVIEW
```

Với các cross-cutting capabilities:

```text
              ┌───────────────┐
              │ NOTIFICATION  │
              └───────────────┘
                      │
 ┌────────────────────┼────────────────────┐
 │                    │                    │
 ▼                    ▼                    ▼
PAYMENT             SESSION             DISPUTE
 │                    │                    │
 ▼                    ▼                    ▼
REFUND            GRACE/DISPUTE       TRUST & SAFETY
 │                    │                    │
 └────────────────────┼────────────────────┘
                      ▼
                 ADMIN GOVERNANCE
                      │
                      ▼
                  AUDIT LOG
```

---

# 51. Functional Definition of Done

Một functional flow được xem là hoàn thành khi:

1. Actor có thể thực hiện action hợp lệ.
2. System validate business conditions.
3. System tạo/cập nhật đúng business state.
4. Financial consequence được xác định nếu có.
5. Related users nhận notification khi cần.
6. Business event được phát sinh khi applicable.
7. Historical information được bảo toàn.
8. Administrative intervention được audit khi applicable.
9. Invalid operation bị reject với business reason phù hợp.
10. Flow không phá vỡ các invariant của Enrollment, Session, Grace Period/Dispute và Financial records.

---

# 52. Core Functional Invariants

## INV-001 — Service Price

```text
Service Price Change
≠
Existing Enrollment Price Change
```

---

## INV-002 — Enrollment Allocation

```text
Σ Session Allocation
=
Enrollment Total Price
```

---

## INV-003 — Grace Period

```text
Session AwaitingPayout
→ Earning not withdrawable
→ Auto-release only after GracePeriodEndsAt
```

---

## INV-004 — Active Issue Report / Dispute

```text
Active Issue Report or Dispute
→ Payout Frozen
→ No Auto-complete
→ No Earning Release
```

---

## INV-005 — Pending Earnings

```text
Pending Earnings
→ Cannot Withdraw
```

---

## INV-006 — Financial History

```text
Historical Transaction
→ Cannot be silently rewritten/deleted
```

---

## INV-007 — Financial Correction

```text
Correction
→ Explicit Adjustment
→ Reason
→ Audit
```

---

## INV-008 — Tutor Cannot Continue

```text
Tutor Cannot Continue
→ Cancel Enrollment
→ Refund Unused Portion
→ Stop Future Sessions
→ No Automatic Tutor Transfer
```

---

## INV-009 — Trial Lesson

```text
Trial Lesson
→ No Enrollment
→ No Payment
→ No Earning
```

---

## INV-010 — Messaging

```text
Message
≠
Enrollment
≠
Payment
≠
Session
```

---

## INV-011 — Admin Governance

```text
Normal Flow
→ User-driven

Exceptional Flow
→ Admin intervention
→ Audit
```

---

# 53. Final Functional Product Loop

TutorHub MVP SHALL support the complete functional loop:

```text
DISCOVER
   ↓
EVALUATE
   ↓
COMMUNICATE
   ↓
PAY
   ↓
ENROLL
   ↓
SCHEDULE
   ↓
LEARN
   ↓
GRACE / ACCEPT
   ↓
EARN
   ↓
COMPLETE
   ↓
REVIEW
```

Protected by:

```text
              TRUST
                │
      ┌─────────┼─────────┐
      ↓         ↓         ↓
   Payment   12h Grace  Review
  Protection  /Dispute
      │         │         │
      └─────────┼─────────┘
                ↓
        Refund / Dispute
                ↓
        Trust & Safety
                ↓
        Admin Governance
                ↓
             Audit
```

---

# 54. Master Data Governance & Soft Delete Pattern

## FR-MD-001 — Master Data Soft Deletion
Admin SHALL be able to soft-delete Master Data entities (`Category`, `Subject`) and Course Offerings (`Service`).
- Physical deletion (Hard Delete) is strictly prohibited across master data and services.
- Soft-deleted entities are marked directly on the table with `IsDeleted = true`, `DeletedAt = DateTime.UtcNow`, and `DeletedByUserId = AdminId`.
- EF Core Global Query Filter (`e => !e.IsDeleted`) automatically excludes soft-deleted items from discovery, tutor selection, and normal active queries.
- Deleting a Category is restricted if active (non-deleted) child Subjects exist.
- Deleting a Subject is restricted if referenced by tutors or active bookings (`Holding` / `Paid`).

## FR-MD-002 — Trash Inspection and Restoration
Admin SHALL be able to inspect soft-deleted entities in Trash and restore them:
- `GET /api/v1/admin/categories/trash` and `POST /api/v1/admin/categories/{id}/restore`.
- `GET /api/v1/admin/subjects/trash` and `POST /api/v1/admin/subjects/{id}/restore`.
- Restoring an entity resets `IsDeleted = false` and clears deletion audit fields.
- Restoring a Subject is blocked if its parent Category is currently deleted (must restore Category first).
- Restoring is blocked if an active entity with the same name already exists in that scope.

## FR-MD-003 — Financial Ledger Non-Deletability
All ledger tables (`Transaction`, `Wallet`, `WalletTransaction`, `Withdrawal`, `TopUpRequest`, `AuditLog`) are strictly immutable and append-only. Any attempt to delete records from these entities (hard or soft) SHALL be rejected with `InvalidOperationException`.

---

**Functional Requirements Status: DRAFT v1.2 — implementation-aligned with Soft Delete Pattern (2026-10-26).**
