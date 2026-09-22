# TutorHub — Functional Requirements

**Version:** 1.0  
**Status:** Draft for Review  
**Source:** TutorHub PRD v1.0 — Final / Business Baseline Frozen

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
→ Published
→ Unpublished
```

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

## FR-SERVICE-005 — View Service Detail

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

# 10. Custom Agreement

## FR-AGREE-001 — Create Custom Agreement

**Actor:** Tutor

System SHALL allow Tutor to create a Custom Agreement following discussion with Student.

A Custom Agreement represents a commercial agreement with customized terms.

---

## FR-AGREE-002 — Custom Agreement Lifecycle

The system SHALL support:

```text
Created
→ Accepted
→ Payment
→ Enrollment
```

The exact intermediate status model may be refined during domain design.

---

## FR-AGREE-003 — Student Accept Custom Agreement

**Actor:** Student

System SHALL allow Student to review and accept a Custom Agreement.

---

## FR-AGREE-004 — Custom Agreement Before Enrollment

System SHALL ensure that a Custom Agreement is accepted before the corresponding customized Enrollment is created.

---

# 11. Standard Service Purchase

## FR-PURCHASE-001 — Accept Standard Service

**Actor:** Student

System SHALL allow Student to accept a published Standard Service.

### Flow

```text
View Service
→ Accept (Booking created in Holding, 15-minute checkout lock)
→ Payment (Booking → Pending; escrow held)
```

### Business Rule (v1.1: Booking checkout made explicit)

- Accepting a Service creates a **Booking** in `Holding` status with `HoldingExpiresAt = now + 15 minutes`; unpaid Holding bookings expire via background job and never create an Enrollment.
- A Booking references a `ServiceId`, or a `CustomAgreementId` together with a hidden `Unpublished` Service snapshot (DEC-S8-020). Single-slot bookings outside a package are forbidden.

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
Payment Succeeded (Booking → Pending)
→ Enrollment created in Pending with fee snapshot
→ Enrollment Activated (Pending → Active) + N Sessions spawned
```

### Business Rule (v1.1)

- Both mock and VNPay IPN paths converge on Booking `Pending` (F-16: `Paid` kept for historical rows only).
- The Enrollment snapshots `PlatformFeeRate` + `FeePolicyVersion` from `PlatformSetting` at creation (DEC-S8-020); later fee changes apply to new contracts only.

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
- Attendance.
- Learning Record reference.
- Financial outcome.

---

## FR-SESSION-003 — Schedule Session

System SHALL support scheduling Sessions belonging to an Enrollment.

---

## FR-SESSION-004 — Propose Schedule Change

**Actor:** Tutor

Tutor SHALL be able to propose a Schedule change.

---

## FR-SESSION-005 — Accept Schedule Change

**Actor:** Student

If a Schedule change affects an already agreed schedule, Student SHALL accept the change.

### Business Rule

Tutor SHALL NOT unilaterally change an agreed Student schedule.

---

## FR-SESSION-006 — Reschedule Session

System SHALL record a Session reschedule event when an agreed Schedule is changed.

Affected parties SHALL be notified.

---

## FR-SESSION-007 — Cancel Session

System SHALL support Session cancellation where permitted by policy.

Cancellation SHALL produce appropriate business and financial consequences.

### Business Rule (v1.2: Escrow Release & Refund Settlement)

- A participant (Student or Tutor) may cancel a single Session only from `Unscheduled`, or from `Scheduled` with a future start time (`StartAt > now`); a non-empty reason is required (minimum 5 characters).
- Single-session cancellation unlocks and debits the Tutor's Escrow pending balance (`wallet.DebitPending(session.EarningAmount, now)`).
- System creates a corresponding `TransactionType.StudentRefund` record linked to the booking and session with `SettlementRequired = true` and status `Pending`.
- System dispatches `SessionCancelledEvent` and `RefundCreatedEvent` to the transactional outbox.
- Cancellation action is recorded into the Central Audit Log (`SESSION_CANCELLED`).
- Enrollment completion evaluation (`enrollment.EvaluateCompletion()`) is triggered; if all remaining sessions are terminal (`Completed` or `Cancelled`), the Enrollment transitions to `Completed`.

# 15. Session Delivery

## FR-SESSION-008 — Conduct Session

**Actor:** Tutor

Tutor SHALL be able to conduct the scheduled Session.

---

## FR-SESSION-009 — Session Completion

A Session SHALL reach `Completed` only after its required post-session resolution process has been satisfied.

### Flow

```text
Session Ends
→ Attendance Verification
→ Resolution
→ Session Completed
```

---

## FR-SESSION-010 — No-show as Attendance Outcome

System SHALL represent No-show as an Attendance Outcome.

### Business Rule

No-show SHALL NOT be represented as a Session Status.

---

# 16. Attendance Verification

## FR-ATT-001 — Student Attendance Verification

**Actor:** Student

System SHALL allow Student to provide attendance verification for a Session.

---

## FR-ATT-002 — Tutor Attendance Verification

**Actor:** Tutor

System SHALL allow Tutor to provide attendance verification for a Session.

---

## FR-ATT-003 — Compare Attendance Verification

System SHALL determine whether Student and Tutor attendance information matches.

### Flow

```text
Student Verification
        +
Tutor Verification
        ↓
Compare
```

---

## FR-ATT-004 — Matching Attendance

If attendance information matches:

```text
Attendance Resolved
→ Session Completed
→ Earning Eligible
```

---

## FR-ATT-005 — Attendance Conflict

If Student and Tutor provide conflicting attendance information:

```text
Attendance Conflict
→ Pending Resolution
```

### Acceptance Criteria

- Conflict is recorded.
- Session earning is not released while the conflict remains unresolved.
- Conflict can proceed to applicable resolution/dispute process.

---

## FR-ATT-006 — Verification Window

System SHALL provide a verification window after Session completion.

---

## FR-ATT-007 — Attendance Reminder

System SHALL send a reminder when required attendance verification has not been completed.

---

## FR-ATT-008 — Verification Timeout

If the verification window expires without sufficient information:

```text
Pending Resolution
```

### Business Rules

- System SHALL NOT automatically classify the Session as `Attended`.
- Earning SHALL NOT be released for the unresolved Session.

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

Earning release SHALL depend on the Session financial/attendance resolution process.

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

- Attendance unresolved.
- In Pending Resolution.
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
Request
→ Processing
→ Completed
```

or:

```text
Processing
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

# 20.1. Student Wallet

## FR-SWALLET-001 — Student Wallet Balance Model

**Actor:** Student

System SHALL maintain a dedicated internal wallet (`StudentWallet`) for each Student profile.

The system SHALL track:
- `AvailableBalance`: Eligible for 100% course booking payment and withdrawal.
- `ReservedBalance`: Funds locked during pending withdrawal requests.
- Balance Invariants: `AvailableBalance >= 0` and `ReservedBalance >= 0` enforced by database check constraint `CK_StudentWallet_NonNegativeBalances`.

---

## FR-SWALLET-002 — Automated VNPay Payment Gateway Top-Up
 
**Actor:** Student, System
 
Student SHALL be able to initiate a top-up request (`TopUpRequest`) specifying an amount (>= 10,000 VND).
 
The system SHALL generate a unique merchant transaction reference formatted with prefix `TOPUP...` and a secured payment URL targeting the VNPay Sandbox 2.1.0 payment gateway.
 
Upon user authorization and payment gateway callback/webhook verification (HMAC-SHA512), the system SHALL credit `AvailableBalance` and record an immutable `StudentWalletTransaction` (`Type: TopUpCredit`).

---

## FR-SWALLET-003 — 100% Wallet Course Booking Payment

**Actor:** Student

Student SHALL pay 100% of course booking fees from their Student Wallet `AvailableBalance`.

If `AvailableBalance < TotalAmount`, the system SHALL prevent payment execution and direct student to top up.

Payment execution SHALL be executed atomically within a database transaction with pessimistic row lock (`SELECT ... FOR UPDATE`):
- Debit `AvailableBalance`.
- Record append-only `StudentWalletTransaction` (`Type: BookingPaymentDebit`).
- Create platform holding `Transaction` (`Status: Succeeded`).
- Transition `Booking` to `Pending` and `Enrollment` to `Active`.

---

## FR-SWALLET-004 — Direct Refund to Student Wallet

**Actor:** System

All refunds arising from enrollment cancellation, session cancellation, or dispute resolution SHALL route directly and immediately into the student's `AvailableBalance`.

The system SHALL record an append-only `StudentWalletTransaction` (`Type: RefundCredit`).

Refunded funds SHALL immediately be available for enrolling in other courses or requesting bank withdrawal.

---

## FR-SWALLET-005 — Append-Only Ledger Immutability

**Actor:** System

Every financial balance change on a Student Wallet SHALL create an append-only `StudentWalletTransaction`.

Updating or deleting existing `StudentWalletTransaction` rows SHALL be strictly forbidden and blocked by EF Core guards (`AppDbContext.EnforceLedgerImmutability()`).

---

# 20.2. Student Withdrawal

## FR-SWITHDRAW-001 — Request Student Withdrawal

**Actor:** Student

Student SHALL be able to request a withdrawal from `AvailableBalance` to their designated bank account.
- Minimum withdrawal threshold: 50.000 VNĐ.
- The requested amount SHALL move from `AvailableBalance` to `ReservedBalance`.
- A `StudentWithdrawal` record SHALL be created with status `Requested`.

---

## FR-SWITHDRAW-002 — Student Withdrawal Lifecycle

**Actor:** Admin, Student

The system SHALL enforce the student withdrawal lifecycle:

```text
Requested (Available → Reserved)
→ Processing (Admin begins transfer: ProcessingStartedByAdminId)
→ Completed (Admin confirms bank transfer: Reserved deducted, ProcessedAt recorded)
```

or:

```text
Processing → Failed (Transfer unsuccessful: Reserved restored to Available, FailureReason recorded)
```

Admin SHALL NOT transition a withdrawal directly from `Requested` to `Completed` without acquiring `Processing` status first.

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

## FR-NOSHOW-001 — Record Tutor No-show

System SHALL support recording Tutor No-show as an Attendance Outcome.

### Business Rule (v1.1: no-show strikes)

- A self-recorded `Absent` outcome earns the submitter one strike. Silence is never judged.
- Strikes accumulate in a rolling 30-day window (`AbsentStrikes`, `StrikeWindowStart`, `LastAbsentAt`).
- 2+ strikes in-window with the latest under 7 days old freezes new bookings (`IsBookingBlocked`).

---

## FR-NOSHOW-002 — Tutor Earning

Tutor SHALL NOT receive earning for a Session where Tutor No-show results in the Session not being eligible for earning.

---

## FR-NOSHOW-003 — Makeup Session

System MAY support a Makeup Session where applicable under platform/service policy.

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

Student or Tutor SHALL be able to create a formal Dispute when an issue requires platform resolution.

Supported dispute categories include:

- Attendance conflict.
- Session delivery.
- Cancellation.
- Financial issue.
- Service issue.

### Business Rule (v1.1: anti-spam filing)

- `Description` of at least 20 characters is required.
- Financial resolutions require at least one uploaded evidence before Admin may resolve (dismissal without financial change exempt).

---

## FR-DISPUTE-002 — Dispute Lifecycle

System SHALL support:

```text
Issue
→ Dispute Created
→ Financial Hold where applicable
→ Admin Investigation
→ Resolution
```

---

## FR-DISPUTE-003 — Financial Hold

Where applicable, system SHALL place affected financial amounts on hold while a Dispute is unresolved.

---

## FR-DISPUTE-004 — Admin Investigation

Admin SHALL be able to review relevant evidence, including:

- Student statement.
- Tutor statement.
- Session information.
- Attendance information.
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

### Fast-track template (v1.1)

For pre-release escrow only, Admin may fast-track when exactly one side submitted `Attended`, the other stayed silent more than 3 days past the verification due date, and at least one evidence exists. Tutor-claim releases the net payout; student-claim refunds in full. Post-release disputes always use full investigation.

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
- **Event Coverage:** Email notifications are enabled for 26 domain business events plus critical identity & security operations:
  1. *Marketplace & Applications:* `TutorApplicationSubmitted`, `TutorApplicationApproved`, `TutorApplicationRejected`.
  2. *Agreements & Payments:* `CustomOfferCreated`, `CustomOfferAccepted`, `PaymentSucceeded`, `EnrollmentActivated`, `EnrollmentCancelled`.
  3. *Sessions & Bilateral Attendance:* `SessionScheduled`, `SessionRescheduled`, `SessionCancelled`, `AttendanceVerificationRequired`, `AttendanceConflictDetected`, `SessionCompleted`, `SessionReminder`, `AttendanceReminder`.
  4. *Financial & Escrow:* `EarningCreated`, `RefundCreated`, `RefundCompleted`, `RefundFailed` (alerting student of administrative offline settlement), `WithdrawalRequested`, `WithdrawalCompleted`, `WithdrawalFailed`.
  5. *Trust, Disputes & Reviews:* `ReviewCreated`, `DisputeCreated`, `DisputeResolved`, `ReportCreated`.
  6. *Identity, Authentication & Security:* `AccountVerification` (registration welcome & account verification), `PasswordChanged` (security alert on credential modification).
- **Asynchronous Outbox Queuing:** Generating a notification creates an `EmailDelivery` record with `Status = EmailDeliveryStatus.Pending` within the same database transaction.
- **Hosted Worker Delivery (`EmailDeliveryJob`):** A background hosted service periodically claims batches of pending/expired email deliveries using lease-locking (`LockedUntil`, `LockedBy`), executes delivery through `IEmailSender`, handles exponential backoff retries (up to 5 attempts), and transitions status to `Sent` or `Failed`.
- **Dual Transport Sender:**
  - *Development / Personal-first mode:* Handled by `LogOnlyEmailSender`, logging full recipient, subject, idempotency key, and body to the console for inspection without external cloud credentials.
  - *Production mode:* Handled by `SesEmailSender` integrating with Amazon Simple Email Service (SES).

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

Attendance Verification Required
→ Session

Earning
→ Wallet Transaction

Dispute Resolved
→ Dispute
```

---

## FR-NOTIF-006 — Critical Notifications

Notifications related to the following SHALL not be completely disabled and SHALL be marked `IsCritical = true`:

- **Payments & Enrollments:** `PaymentSucceeded`, `EnrollmentActivated`, `EnrollmentCancelled`.
- **Sessions:** `SessionCancelled`, `AttendanceConflictDetected`.
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

## FR-NOTIF-008 — Attendance Reminder

System SHALL send Attendance Verification reminders when required verification remains incomplete.

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

- `CustomOfferCreated`
- `CustomOfferAccepted`
- `PaymentSucceeded`
- `EnrollmentActivated`
- `EnrollmentCancelled`

---

## FR-EVENT-003 — Session Events

System SHALL support:

- `SessionScheduled`
- `SessionRescheduled`
- `SessionCancelled`
- `AttendanceVerificationRequired`
- `AttendanceConflictDetected`
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

---

## FR-EVENT-005 — Trust Events

System SHALL support:

- `ReviewCreated`
- `DisputeCreated`
- `DisputeResolved`
- `ReportCreated`
- `PlatformSettingChanged` (v1.1)
- `MessageSent` (v1.1, realtime fan-out; excluded from the 26 core financial counts)

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

## FR-CONFIG-002 — Cancellation Policy

Admin SHALL be able to configure applicable Cancellation Policy rules.

---

## FR-CONFIG-003 — Refund Rules

Admin SHALL be able to configure Refund rules.

---

## FR-CONFIG-004 — Verification Window

Admin SHALL be able to configure the Attendance Verification Window.

---

## FR-CONFIG-005 — Withdrawal Rules

Admin SHALL be able to configure Withdrawal rules.

---

## FR-CONFIG-006 — Review Window

Admin SHALL be able to configure the Review Window.

---

## FR-CONFIG-007 — Policy Versioning / Historical Integrity

Policy changes SHALL apply according to the applicable rule for new transactions.

Historical transactions SHALL NOT be retroactively changed solely because platform policy has changed.

### Status (v1.1: decided for fees)

Fee versioning is DECIDED and implemented: `PlatformSetting` + `PlatformSettingVersion` history; each Enrollment snapshots `PlatformFeeRate` + `FeePolicyVersion` at creation (DEC-S8-020). Remaining policy values (cancellation/refund/withdrawal/review rules) stay open under FR-OPEN-002/003/007.

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

# 41. Custom Service End-to-End Flow

System SHALL support:

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

# 44. Attendance Conflict Flow

System SHALL support:

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

# 45. Attendance Timeout Flow

System SHALL support:

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
- Custom Agreement.
- Payment.
- Enrollment.
- Schedule.
- Session.
- Attendance Verification.
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
- Custom Offer.
- Enrollment Management.
- Schedule.
- Session Management.
- Attendance Verification.
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
- Custom Agreement.
- Cancelled Sessions.
- Partial Enrollment.
- Refund sau khi một phần earning đã release.

---

## FR-OPEN-005 — Verification Window Duration

PRD yêu cầu Verification Window nhưng chưa đóng một giá trị cụ thể.

Cần xác định:

```text
Verification Window = ? hours/days
```

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

### Status (v1.1: versioning decided, basis open)

DECIDED: per-earning fee with `PlatformSetting` + `PlatformSettingVersion` history and per-Enrollment snapshot (`PlatformFeeRate`, `FeePolicyVersion`, non-retroactive). OPEN: percentage vs fixed, exact basis/rounding — see D-08.

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
- Channel routing: Realtime push (SignalR `/hubs/notifications`) for all events except `MessageSent` (`/hubs/chat`); Email delivery for 26 domain events and authentication security operations.
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
CUSTOM AGREEMENT
     ↓
PAYMENT
     ↓
ENROLLMENT
     ↓
SCHEDULE
     ↓
SESSION
     ↓
ATTENDANCE
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
REFUND            ATTENDANCE          TRUST & SAFETY
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
10. Flow không phá vỡ các invariant của Enrollment, Session, Attendance và Financial records.

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

## INV-003 — Attendance Conflict

```text
Attendance Conflict
→ No Earning Release
```

---

## INV-004 — Attendance Timeout

```text
Verification Timeout
→ Pending Resolution
→ No Automatic Attended
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
AGREE
   ↓
PAY
   ↓
ENROLL
   ↓
SCHEDULE
   ↓
LEARN
   ↓
VERIFY
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
   Payment   Attendance  Review
  Protection Verification
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

**Functional Requirements Status: DRAFT — Pending Review**