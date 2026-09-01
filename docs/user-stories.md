# TutorHub — User Stories

**Version:** 1.0  
**Status:** Draft for Review  
**Source:** TutorHub PRD v1.0 + Functional Requirements v1.0

---

# 1. User Story Structure

Mỗi User Story được biểu diễn theo format:

> **As a [Actor], I want [Action], so that [Business Value].**

Mỗi story có Acceptance Criteria nhằm xác định điều kiện để story được xem là hoàn thành.

---

# EPIC 01 — Authentication & Account

## US-AUTH-001 — Register Account

**Actor:** Student / Tutor

> As a Student or Tutor, I want to create a TutorHub account, so that I can use the platform according to my role.

**Related FR:** FR-AUTH-001

### Acceptance Criteria

- User can provide required registration information.
- System validates registration information.
- Invalid registration information is rejected.
- Duplicate account creation is prevented according to account identity rules.
- Successfully registered user can authenticate.
- Account is initially `Active` unless another state is required by the registration flow.

---

## US-AUTH-002 — Authenticate

**Actor:** Student / Tutor / Admin

> As a registered user, I want to authenticate to TutorHub, so that I can access functionality available to my role.

**Related FR:** FR-AUTH-002

### Acceptance Criteria

- Valid credentials result in an authenticated session.
- Invalid credentials are rejected.
- Authenticated users can access permitted functionality.
- Users cannot access functionality requiring another role.

---

## US-AUTH-003 — Manage Account Status

**Actor:** Admin

> As an Admin, I want to manage user account status, so that I can control access when operational or trust/safety issues occur.

**Related FR:** FR-AUTH-003, FR-ADMIN-002, FR-ADMIN-003, FR-ADMIN-004

### Acceptance Criteria

- Admin can view user status.
- Admin can suspend an Active user.
- Admin can reactivate a Suspended user.
- Admin can ban a user.
- Account statuses include `Active`, `Suspended`, and `Banned`.
- Status changes follow applicable platform rules.

---

# EPIC 02 — Tutor Application

## US-TUTOR-001 — Apply to Become Tutor

**Actor:** User

> As a User, I want to apply to become a Tutor, so that I can provide tutoring services on the marketplace.

**Related FR:** FR-TUTOR-001

### Acceptance Criteria

- User can submit a Tutor application.
- Application is created with `Pending` status.
- Application becomes visible to Admin.
- Applicant cannot publish Services while the application is not approved.

---

## US-TUTOR-002 — Review Tutor Application

**Actor:** Admin

> As an Admin, I want to review Tutor applications, so that only approved Tutors can provide Services on the marketplace.

**Related FR:** FR-TUTOR-002

### Acceptance Criteria

- Admin can view pending applications.
- Admin can approve an application.
- Admin can reject an application.
- Rejection requires a reason.
- Approved application changes Tutor approval status appropriately.
- Rejected application stores the rejection reason.
- Unapproved Tutor cannot publish Services.

---

## US-TUTOR-003 — Resubmit Tutor Application

**Actor:** Tutor

> As a rejected Tutor applicant, I want to resubmit my application when permitted, so that I can have another opportunity to become an approved Tutor.

**Related FR:** FR-TUTOR-003

### Acceptance Criteria

- Resubmission is allowed only when platform policy permits.
- A new review cycle is created.
- Application returns to `Pending`.

---

# EPIC 03 — Tutor Profile

## US-TUTOR-004 — Manage Tutor Profile

**Actor:** Tutor

> As an approved Tutor, I want to manage my Tutor Profile, so that Students can understand my teaching background and qualifications.

**Related FR:** FR-TUTOR-004

### Acceptance Criteria

- Tutor can create permitted profile information.
- Tutor can update permitted profile information.
- Profile is associated with the Tutor account.
- Student can view published profile information.

---

## US-TUTOR-005 — View Tutor Profile

**Actor:** Student

> As a Student, I want to view a Tutor Profile, so that I can evaluate whether the Tutor is suitable for me.

**Related FR:** FR-TUTOR-005

### Acceptance Criteria

Student can view relevant:

- Tutor information.
- Teaching background.
- Experience.
- Qualifications.
- Teaching information/style.
- Services.
- Reviews.

---

# EPIC 04 — Service Management

## US-SERVICE-001 — Create Service

**Actor:** Approved Tutor

> As an approved Tutor, I want to create a tutoring Service, so that I can offer a defined learning package to Students.

**Related FR:** FR-SERVICE-001

### Acceptance Criteria

Tutor can define:

- Service description.
- Learning scope.
- Expected outcome.
- Number of Sessions.
- Session duration.
- Price.
- Schedule information.
- Trial Lesson information where applicable.

New Service starts in `Draft`.

---

## US-SERVICE-002 — Validate Service

**Actor:** Tutor / System

> As a Tutor, I want my Service to be validated before publication, so that Students only see Services containing valid required information.

**Related FR:** FR-SERVICE-002

### Acceptance Criteria

- Required Service information is validated.
- Invalid Service cannot be published.
- Validation errors are returned to the Tutor.
- Tutor can correct validation errors before publishing.

---

## US-SERVICE-003 — Publish Service

**Actor:** Approved Tutor

> As an approved Tutor, I want to publish a valid Service, so that Students can discover and purchase it.

**Related FR:** FR-SERVICE-003

### Acceptance Criteria

- Only approved Tutors can publish Services.
- Service must pass platform validation.
- Published Service becomes available through applicable marketplace discovery.
- Admin does not manually approve every Service.

---

## US-SERVICE-004 — Unpublish Service

**Actor:** Tutor

> As a Tutor, I want to unpublish my Service, so that I can stop offering it to new Students.

**Related FR:** FR-SERVICE-004

### Acceptance Criteria

- Tutor can unpublish their Service according to applicable rules.
- Service changes from `Published` to `Unpublished`.
- Existing Enrollment is not silently modified solely because the Service is unpublished.

---

## US-SERVICE-005 — Moderate Service

**Actor:** Admin

> As an Admin, I want to unpublish or require correction of violating Services, so that the marketplace remains compliant with platform policies.

**Related FR:** FR-SERVICE-004, FR-ADMIN-005, FR-ADMIN-006

### Acceptance Criteria

- Admin can unpublish a violating Service.
- Admin can remove violating content where applicable.
- Admin can require Tutor correction.
- Admin does not silently edit Tutor-owned Service content.
- Administrative intervention is auditable where applicable.

---

## US-SERVICE-006 — View Service Detail

**Actor:** Student

> As a Student, I want to view complete Service details, so that I can understand what I will receive before purchasing.

**Related FR:** FR-SERVICE-005

### Acceptance Criteria

Student can understand:

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

# EPIC 05 — Marketplace Discovery

## US-MARKET-001 — Browse Marketplace

**Actor:** Student

> As a Student, I want to browse Tutors and Services, so that I can discover suitable learning options.

**Related FR:** FR-MARKET-001

### Acceptance Criteria

- Student can browse Tutors.
- Student can browse Services.
- Only discoverable marketplace content is presented according to platform rules.

---

## US-MARKET-002 — Search Tutors

**Actor:** Student

> As a Student, I want to search for Tutors, so that I can find Tutors relevant to my learning needs.

**Related FR:** FR-MARKET-002

### Acceptance Criteria

- Student can submit a Tutor search.
- System returns matching Tutors according to supported search behavior.

---

## US-MARKET-003 — Search Services

**Actor:** Student

> As a Student, I want to search for Services, so that I can find suitable tutoring offerings.

**Related FR:** FR-MARKET-003

### Acceptance Criteria

- Student can search Services.
- System returns matching Services according to supported search behavior.

---

## US-MARKET-004 — Filter Marketplace

**Actor:** Student

> As a Student, I want to filter marketplace results, so that I can narrow down Tutors or Services that match my requirements.

**Related FR:** FR-MARKET-004

### Acceptance Criteria

- Student can use supported marketplace filters.
- System applies selected filters to marketplace results.
- Exact filter criteria remain subject to separate marketplace specification.

---

# EPIC 06 — Trial Lesson

## US-TRIAL-001 — Provide Trial Lesson

**Actor:** Tutor

> As a Tutor, I want to provide a public Trial Lesson, so that potential Students can evaluate my teaching before purchasing.

**Related FR:** FR-TRIAL-001

### Acceptance Criteria

- Tutor can provide a Trial Lesson associated with the offering.
- Trial Lesson can be publicly available according to applicable rules.

---

## US-TRIAL-002 — View Trial Lesson

**Actor:** Student

> As a Student, I want to view a Tutor's Trial Lesson, so that I can evaluate whether the Tutor is suitable before purchasing.

**Related FR:** FR-TRIAL-002

### Acceptance Criteria

- Student can view a published Trial Lesson.
- Viewing the Trial Lesson does not create an Enrollment.
- Viewing the Trial Lesson does not create a Payment.
- Viewing the Trial Lesson does not create Tutor earnings.

---

# EPIC 07 — Messaging & Communication

## US-MSG-001 — Start Conversation

**Actor:** Student / Tutor

> As a Student or Tutor, I want to establish a conversation with the other party, so that we can discuss tutoring requirements before or during learning.

**Related FR:** FR-MSG-001, FR-MSG-002

### Acceptance Criteria

- Student and Tutor can establish a conversation.
- Conversation is associated with the participants.
- Creating a conversation does not create an Enrollment.
- Creating a conversation does not create a Payment.
- Creating a conversation does not create a Session.

---

## US-MSG-002 — Send Message

**Actor:** Student / Tutor

> As a Student or Tutor, I want to send messages in a conversation, so that I can communicate with the other participant.

**Related FR:** FR-MSG-003

### Acceptance Criteria

- Conversation participants can send messages.
- Messages are associated with the correct conversation.
- Only authorized participants can access the conversation.

---

## US-MSG-003 — Share Files and Links

**Actor:** Student / Tutor

> As a Student or Tutor, I want to share relevant files and links, so that I can exchange learning or Service-related information.

**Related FR:** FR-MSG-004

### Acceptance Criteria

- Participants can share supported files.
- Participants can share relevant links.
- Shared content belongs to the conversation context.
- Advanced communication capabilities are not required for MVP.

---

## US-MSG-004 — Prevent Transaction Bypass

**Actor:** Student / Tutor / System

> As a TutorHub user, I want the platform to discourage transaction bypass through messaging, so that marketplace transactions remain protected by TutorHub.

**Related FR:** FR-MSG-006, PRD Core Business Rules

### Acceptance Criteria

- System applies the platform's defined bypass-prevention mechanism when specified.
- Intentional bypass behavior is handled according to platform policy.
- Exact detection/enforcement mechanism remains subject to separate specification.

---

## US-MSG-005 — Access Conversation for Investigation

**Actor:** Admin

> As an Admin, I want to access relevant conversation context when investigating an issue, so that I can make informed operational decisions.

**Related FR:** FR-MSG-007

### Acceptance Criteria

Admin can access relevant conversation context when necessary for:

- Dispute.
- Report.
- Trust & Safety.
- Investigation.

Access is limited to legitimate operational purposes.

---

# EPIC 08 — Custom Agreement

## US-AGREE-001 — Create Custom Agreement

**Actor:** Tutor

> As a Tutor, I want to create a Custom Agreement after discussing requirements with a Student, so that we can formalize customized commercial terms.

**Related FR:** FR-AGREE-001

### Acceptance Criteria

- Tutor can create a Custom Agreement following discussion.
- Agreement represents customized commercial terms.
- Agreement exists before the customized Enrollment.

---

## US-AGREE-002 — Review Custom Agreement

**Actor:** Student

> As a Student, I want to review a Custom Agreement before accepting it, so that I understand the customized terms I am agreeing to.

**Related FR:** FR-AGREE-003

### Acceptance Criteria

- Student can view the Custom Agreement.
- Student can review its applicable terms.
- Student can accept the Agreement.

---

## US-AGREE-003 — Accept Custom Agreement

**Actor:** Student

> As a Student, I want to accept a Custom Agreement, so that I can proceed with payment and enrollment.

**Related FR:** FR-AGREE-003, FR-AGREE-004

### Acceptance Criteria

- Student can accept the Agreement.
- Accepted Agreement can proceed to payment.
- Customized Enrollment cannot be created without the required Agreement acceptance.

---

# EPIC 09 — Standard Service Purchase

## US-PURCHASE-001 — Accept Standard Service

**Actor:** Student

> As a Student, I want to accept a published Standard Service, so that I can proceed to payment and start my learning commitment.

**Related FR:** FR-PURCHASE-001

### Acceptance Criteria

Flow is:

```text
View Service
→ Accept
→ Payment
```

---

## US-PURCHASE-002 — Preserve Enrollment Price

**Actor:** Student / System

> As a Student, I want my agreed Enrollment price to remain unchanged after purchase, so that later Service price changes do not affect my existing commitment.

**Related FR:** FR-PURCHASE-002, FR-ENR-003

### Acceptance Criteria

- Enrollment price is established when acceptance/payment conditions are satisfied.
- Existing Enrollment stores the agreed price.
- Later Service price changes do not modify the existing Enrollment price.

---

# EPIC 10 — Payment

## US-PAY-001 — Pay for Enrollment

**Actor:** Student

> As a Student, I want to pay for my Enrollment through TutorHub, so that my purchase is protected by the platform.

**Related FR:** FR-PAY-001, FR-PAY-002

### Acceptance Criteria

- Student can initiate payment for an Enrollment.
- Payment is processed through TutorHub.
- Payment is associated with the relevant Enrollment.
- Transactions originating from TutorHub are not intentionally routed outside the platform.

---

## US-PAY-002 — Activate Enrollment After Successful Payment

**Actor:** System

> As the system, I want to activate an Enrollment after successful payment, so that the learning lifecycle can begin.

**Related FR:** FR-PAY-003, FR-ENR-001

### Acceptance Criteria

- Successful payment is recorded.
- Payment is associated with the Enrollment.
- Enrollment becomes `Active` when activation conditions are satisfied.
- Relevant users receive notifications.
- `PaymentSucceeded` and `EnrollmentActivated` events are generated where applicable.

---

## US-PAY-003 — Handle Failed Payment

**Actor:** System

> As the system, I want to reject failed payments and prevent activation, so that unsuccessful transactions cannot create a paid Enrollment.

**Related FR:** FR-PAY-004

### Acceptance Criteria

- Failed payment is not treated as successful.
- Enrollment is not activated solely because of a failed payment.
- Failed payment outcome is recorded where required for financial traceability.

---

# EPIC 11 — Enrollment

## US-ENR-001 — Create Enrollment

**Actor:** System

> As the system, I want to create an Enrollment after the required acceptance and payment conditions are satisfied, so that the Student-Tutor learning commitment can be managed.

**Related FR:** FR-ENR-001, FR-ENR-002

### Acceptance Criteria

- Enrollment is created after the required purchase flow.
- Enrollment represents the learning commitment between Student and Tutor.
- Enrollment follows the lifecycle:

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

## US-ENR-002 — View Enrollment

**Actor:** Student / Tutor

> As a Student or Tutor, I want to view my Enrollment information, so that I can understand the current state and progress of the learning commitment.

**Related FR:** FR-ENR-004

### Acceptance Criteria

Relevant participants can view:

- Service information.
- Price.
- Sessions.
- Schedule.
- Learning progress.
- Financial status.
- Enrollment status.

---

## US-ENR-003 — Complete Enrollment

**Actor:** System

> As the system, I want to mark an Enrollment as Completed after all Service obligations are fulfilled, so that the learning lifecycle has a clear endpoint.

**Related FR:** FR-ENR-005

### Acceptance Criteria

- Enrollment becomes `Completed` only after normal Service obligations are completed.
- Completion represents normal lifecycle termination rather than cancellation.

---

## US-ENR-004 — Cancel Enrollment

**Actor:** Student / System

> As a Student, I want to cancel my Enrollment according to the applicable policy, so that I can terminate the learning commitment when permitted.

**Related FR:** FR-ENR-006, FR-CANCEL-001 through FR-CANCEL-004

### Acceptance Criteria

- Cancellation request is processed according to Cancellation Policy.
- Financial consequence is determined.
- Affected future obligations are stopped where applicable.
- Refund is created where applicable.
- Affected users are notified.
- Audit trail is created.

---

# EPIC 12 — Schedule & Session Management

## US-SESSION-001 — Generate Enrollment Sessions

**Actor:** System

> As the system, I want to determine Sessions for an Active Enrollment, so that the Service can be delivered according to its agreed terms and schedule.

**Related FR:** FR-SESSION-001

### Acceptance Criteria

Sessions are determined based on:

- Enrollment terms.
- Service terms.
- Schedule.

---

## US-SESSION-002 — View Session Information

**Actor:** Student / Tutor

> As a Student or Tutor, I want to view Session information, so that I know when the Session occurs and can track its learning and financial outcome.

**Related FR:** FR-SESSION-002

### Acceptance Criteria

Session contains or references:

- Schedule.
- Attendance.
- Learning Record.
- Financial outcome.

---

## US-SESSION-003 — Schedule Sessions

**Actor:** Tutor / System

> As a Tutor, I want Sessions to have an agreed schedule, so that both Student and Tutor know when learning will take place.

**Related FR:** FR-SESSION-003

### Acceptance Criteria

- Sessions belonging to an Enrollment can be scheduled.
- Schedule belongs to the Enrollment/Session context.

---

## US-SESSION-004 — Propose Schedule Change

**Actor:** Tutor

> As a Tutor, I want to propose a schedule change, so that I can coordinate a different learning time when necessary.

**Related FR:** FR-SESSION-004

### Acceptance Criteria

- Tutor can propose a Schedule change.
- Proposed change is communicated to the Student.
- Existing agreed schedule is not silently changed.

---

## US-SESSION-005 — Accept Schedule Change

**Actor:** Student

> As a Student, I want to accept or reject a proposed schedule change, so that my agreed learning schedule remains under my control.

**Related FR:** FR-SESSION-005

### Acceptance Criteria

- Student can review the proposed change.
- Student acceptance is required when the agreed schedule is affected.
- Tutor cannot unilaterally change an agreed Student schedule.

---

## US-SESSION-006 — Record Reschedule

**Actor:** System

> As the system, I want to record Session rescheduling, so that the agreed schedule history remains traceable.

**Related FR:** FR-SESSION-006

### Acceptance Criteria

- Reschedule event is recorded.
- Affected parties are notified.
- Relevant Session schedule is updated only after required acceptance.

---

## US-SESSION-007 — Cancel Session

**Actor:** Student / Tutor / Admin where applicable

> As an authorized user, I want a Session to be cancellable when permitted by policy, so that exceptional scheduling situations can be handled correctly.

**Related FR:** FR-SESSION-007

### Acceptance Criteria

- Session cancellation is allowed only under applicable rules.
- Business consequences are determined.
- Financial consequences are determined where applicable.
- Affected users are notified.
- Session cancellation is recorded.

---

## US-SESSION-008 — Conduct Session

**Actor:** Tutor

> As a Tutor, I want to conduct a scheduled Session, so that I can deliver the learning Service purchased by the Student.

**Related FR:** FR-SESSION-008

### Acceptance Criteria

- Tutor can access scheduled Sessions belonging to their Enrollment.
- Session delivery can proceed according to the agreed schedule.

---

## US-SESSION-009 — Complete Session After Resolution

**Actor:** System

> As the system, I want to complete a Session only after the required post-session resolution process, so that financial release is based on a resolved Session outcome.

**Related FR:** FR-SESSION-009

### Acceptance Criteria

```text
Session Ends
→ Attendance Verification
→ Resolution
→ Session Completed
```

- Session is not considered Completed before required resolution.
- Earning eligibility follows the resolved Session outcome.

---

# EPIC 13 — Attendance Verification

## US-ATT-001 — Verify Attendance as Student

**Actor:** Student

> As a Student, I want to verify my attendance for a Session, so that the platform has my confirmation of what happened during the Session.

**Related FR:** FR-ATT-001

### Acceptance Criteria

- Student can submit attendance verification.
- Verification is associated with the correct Session.

---

## US-ATT-002 — Verify Attendance as Tutor

**Actor:** Tutor

> As a Tutor, I want to verify attendance for a Session, so that the platform has my confirmation of what happened during the Session.

**Related FR:** FR-ATT-002

### Acceptance Criteria

- Tutor can submit attendance verification.
- Verification is associated with the correct Session.

---

## US-ATT-003 — Resolve Matching Attendance

**Actor:** System

> As the system, I want to compare Student and Tutor attendance verification, so that matching attendance can resolve the Session outcome.

**Related FR:** FR-ATT-003, FR-ATT-004

### Acceptance Criteria

- System compares Student and Tutor verification.
- Matching information results in Attendance Resolution.
- Resolved Session becomes eligible for completion.
- Session becomes eligible for earning according to the applicable rules.

---

## US-ATT-004 — Handle Attendance Conflict

**Actor:** Student / Tutor / Admin

> As a Student or Tutor, I want conflicting attendance information to be formally identified, so that the disagreement can be resolved rather than silently assigning an outcome.

**Related FR:** FR-ATT-005

### Acceptance Criteria

- Conflict is recorded as `Attendance Conflict`.
- Session enters `Pending Resolution`.
- Tutor earning is not released while conflict remains unresolved.
- Conflict can proceed to applicable resolution/dispute process.

---

## US-ATT-005 — Verify Attendance Within Window

**Actor:** Student / Tutor

> As a Student or Tutor, I want a defined verification window after a Session, so that I have an opportunity to confirm attendance.

**Related FR:** FR-ATT-006

### Acceptance Criteria

- Verification window begins after Session completion/delivery according to the defined flow.
- Participants can submit verification during the window.
- Exact duration remains subject to separate specification.

---

## US-ATT-006 — Receive Attendance Reminder

**Actor:** Student / Tutor

> As a Student or Tutor, I want to receive a reminder when attendance verification is incomplete, so that I do not accidentally miss the verification process.

**Related FR:** FR-ATT-007, FR-ATT-008

### Acceptance Criteria

- Reminder is sent when required verification remains incomplete.
- If the window expires without sufficient information, Session enters `Pending Resolution`.
- System does not automatically classify the Session as `Attended`.
- Earning is not released for the unresolved Session.

---

## US-ATT-007 — Record No-show as Attendance Outcome

**Actor:** System

> As the system, I want to record No-show as an Attendance Outcome, so that attendance information remains separate from Session lifecycle status.

**Related FR:** FR-SESSION-010, FR-NOSHOW-001

### Acceptance Criteria

- `No-show` is represented as an Attendance Outcome.
- `No-show` is not represented as a Session Status.

---

# EPIC 14 — Learning Records

## US-LEARN-001 — Create Learning Record

**Actor:** Tutor

> As a Tutor, I want to create a Learning Record after a delivered Session, so that the Student can track what was learned.

**Related FR:** FR-LEARN-001

### Acceptance Criteria

- Tutor can create a Learning Record for a delivered Session.
- Record is associated with the appropriate learning context.

---

## US-LEARN-002 — View Learning Record

**Actor:** Student

> As a Student, I want to view my Learning Records, so that I can track my learning progress.

**Related FR:** FR-LEARN-002

### Acceptance Criteria

- Student can view Learning Records associated with their learning.
- Student can access records relevant to their Enrollment/Sessions.

---

## US-LEARN-003 — Protect Learning Record Ownership

**Actor:** Student / System

> As a Student, I want Tutor-created Learning Records to remain controlled by the Tutor, so that educational records cannot be directly modified by me.

**Related FR:** FR-LEARN-003

### Acceptance Criteria

- Student can view Learning Records.
- Student cannot directly modify Tutor-created Learning Records.

---

# EPIC 15 — Earnings & Financial Allocation

## US-EARN-001 — Allocate Enrollment Price to Sessions

**Actor:** System

> As the system, I want to allocate the Enrollment price across Sessions, so that Tutor earnings can be released progressively as Sessions are completed.

**Related FR:** FR-EARN-001

### Acceptance Criteria

```text
Σ Session Allocation
=
Total Enrollment Price
```

- Every Enrollment amount is fully allocated.
- Allocation respects the agreed Enrollment price.

---

## US-EARN-002 — Handle Rounding

**Actor:** System

> As the system, I want to handle allocation rounding consistently, so that Session allocations always reconcile exactly to the Enrollment price.

**Related FR:** FR-EARN-002

### Acceptance Criteria

Example:

```text
1,000,000 / 3

Session 1 = 333,333
Session 2 = 333,333
Session 3 = 333,334
```

- Remainder is assigned to the final Session.
- Total allocation equals the Enrollment price.

---

## US-EARN-003 — Create Session Earning

**Actor:** System

> As the system, I want to create Tutor earnings when a Session becomes eligible, so that Tutor compensation reflects successfully delivered Sessions.

**Related FR:** FR-EARN-003

### Acceptance Criteria

```text
Session Completed
→ Calculate Earning
→ Apply Platform Fee
→ Tutor Balance
```

- Earning is calculated from the Session allocation.
- Applicable platform fee is applied.
- Result is reflected in Tutor financial balance.

---

## US-EARN-004 — Protect Unresolved Earnings

**Actor:** System

> As the system, I want to prevent earning release for unresolved Sessions, so that financial outcomes are not finalized before attendance or dispute resolution.

**Related FR:** FR-EARN-004

### Acceptance Criteria

Earning is not released when the Session is:

- Attendance unresolved.
- `Pending Resolution`.
- Subject to an applicable financial hold.

---

# EPIC 16 — Tutor Balance & Withdrawal

## US-WALLET-001 — View Tutor Balance

**Actor:** Tutor

> As a Tutor, I want to view my financial balance, so that I can understand how much I have earned and how much I can withdraw.

**Related FR:** FR-WALLET-001, FR-WALLET-002, FR-WALLET-003

### Acceptance Criteria

Tutor can distinguish:

- Pending earnings.
- Available balance.

Only Available Balance is withdrawable.

---

## US-WALLET-002 — Track Financial History

**Actor:** Tutor

> As a Tutor, I want my earnings and financial movements to be traceable, so that I can understand how my balance was calculated.

**Related FR:** FR-WALLET-004, FR-FIN-004

### Acceptance Criteria

Financial flow can be traced through:

```text
Payment
→ Holding
→ Session Allocation
→ Earning
→ Platform Fee
→ Balance
→ Withdrawal
```

or an explicit Refund/Adjustment path.

---

## US-WITHDRAW-001 — Request Withdrawal

**Actor:** Tutor

> As a Tutor, I want to request withdrawal from my Available Balance, so that I can receive my earned money.

**Related FR:** FR-WITHDRAW-001

### Acceptance Criteria

- Tutor can request withdrawal.
- Requested amount is taken from eligible Available Balance according to withdrawal rules.
- Pending earnings cannot be withdrawn.

---

## US-WITHDRAW-002 — Validate Withdrawal

**Actor:** System

> As the system, I want to validate withdrawal requests, so that Tutors cannot withdraw funds that are not eligible.

**Related FR:** FR-WITHDRAW-002

### Acceptance Criteria

- Requested amount is validated.
- Pending earnings are rejected as withdrawal source.
- Only eligible Available Balance can be withdrawn.

---

## US-WITHDRAW-003 — Process Withdrawal

**Actor:** System

> As the system, I want to track withdrawal processing, so that Tutors can know the outcome of their withdrawal requests.

**Related FR:** FR-WITHDRAW-003

### Acceptance Criteria

Supported lifecycle:

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

## US-WITHDRAW-004 — Handle Failed Withdrawal

**Actor:** System / Admin

> As the system, I want failed withdrawals to be explicitly recorded, so that financial balances are not silently changed.

**Related FR:** FR-WITHDRAW-004

### Acceptance Criteria

- Failed withdrawal is marked `Failed`.
- Financial amount is handled according to policy.
- Tutor Balance is not silently modified.
- Financial corrections use explicit financial records.

---

## US-WITHDRAW-005 — View Withdrawal History

**Actor:** Tutor

> As a Tutor, I want to view my withdrawal history, so that I can track previous withdrawal requests and their outcomes.

**Related FR:** FR-WITHDRAW-005

### Acceptance Criteria

- Tutor can view withdrawal records.
- Withdrawal status is visible.
- Historical withdrawal information remains traceable.

---

# EPIC 17 — Cancellation

## US-CANCEL-001 — Request Cancellation

**Actor:** Student

> As a Student, I want to request cancellation of an Enrollment, so that I can terminate it when permitted by the Cancellation Policy.

**Related FR:** FR-CANCEL-001

### Acceptance Criteria

- Student can request cancellation.
- Request is evaluated against applicable policy.

---

## US-CANCEL-002 — Apply Cancellation Policy

**Actor:** System

> As the system, I want to evaluate cancellation requests against the applicable policy, so that financial consequences are determined consistently.

**Related FR:** FR-CANCEL-002

### Acceptance Criteria

Evaluation considers applicable:

- Cancellation timing.
- Session status.
- Service policy.
- Platform rules.

---

## US-CANCEL-003 — Determine Cancellation Financial Consequence

**Actor:** System

> As the system, I want to determine the financial consequence of cancellation, so that the correct refund or adjustment can be applied.

**Related FR:** FR-CANCEL-003

### Acceptance Criteria

System can determine applicable outcome:

- No refund.
- Partial refund.
- Full refund.
- Other applicable financial adjustment.

Exact policy matrix remains subject to separate specification.

---

# EPIC 18 — Tutor Cannot Continue

## US-CONTINUE-001 — Process Tutor Cannot Continue

**Actor:** Tutor / System

> As a Tutor, I want the platform to process the situation when I cannot continue an Enrollment, so that the Student's unused learning commitment is handled fairly.

**Related FR:** FR-CONTINUE-001 through FR-CONTINUE-005

### Acceptance Criteria

```text
Tutor Cannot Continue
→ Enrollment Cancelled
→ Calculate Unused Portion
→ Refund Student
→ Stop Future Sessions
→ Notify Student + Tutor
→ Audit
```

- Enrollment becomes `Cancelled`.
- Applicable unused portion is refunded.
- Future Sessions are stopped.
- Student and Tutor are notified.
- Audit record is created.
- System does not automatically transfer Student to another Tutor.

---

# EPIC 19 — Tutor No-show & Makeup Session

## US-NOSHOW-001 — Record Tutor No-show

**Actor:** System

> As the system, I want to record a Tutor No-show as an Attendance Outcome, so that the Session outcome accurately reflects Tutor attendance.

**Related FR:** FR-NOSHOW-001

### Acceptance Criteria

- Tutor No-show is recorded as an Attendance Outcome.
- It does not become a Session Status.

---

## US-NOSHOW-002 — Prevent Earning for Tutor No-show

**Actor:** System

> As the system, I want to prevent Tutor earnings for an ineligible Tutor No-show Session, so that Tutor compensation reflects actual eligible delivery.

**Related FR:** FR-NOSHOW-002

### Acceptance Criteria

- Tutor does not receive earning when Tutor No-show makes the Session ineligible.
- Financial result is recorded according to applicable rules.

---

## US-NOSHOW-003 — Handle Makeup Session

**Actor:** Student / Tutor / System

> As a Student and Tutor, I want an applicable Tutor No-show Session to support a Makeup Session when permitted, so that missed learning can potentially be recovered.

**Related FR:** FR-NOSHOW-003

### Acceptance Criteria

- Makeup Session can be supported where applicable.
- Exact workflow remains subject to separate functional specification.
- MVP implementation must not invent rules that are not defined in the current PRD/FR.

---

# EPIC 20 — Refund

## US-REFUND-001 — Trigger Refund

**Actor:** System / Admin

> As the system, I want to support refunds triggered by applicable business events, so that Student funds can be returned when the platform rules require it.

**Related FR:** FR-REFUND-001

### Acceptance Criteria

Refund can be triggered by:

- Cancellation Policy.
- Tutor cannot continue.
- Dispute resolution.
- Platform/payment issue.

---

## US-REFUND-002 — Create Refund Record

**Actor:** System

> As the system, I want every refund to have an explicit financial record, so that refunded money remains traceable.

**Related FR:** FR-REFUND-002

### Acceptance Criteria

Every refund records:

- Amount.
- Reason.
- Related transaction.

---

## US-REFUND-003 — Track Refund Completion

**Actor:** Student / System

> As a Student, I want refund processing to have a clear status, so that I know whether my refund has been completed.

**Related FR:** FR-REFUND-003

### Acceptance Criteria

- Refund processing can be tracked where supported.
- Completion is recorded.
- Refund history remains traceable.

---

# EPIC 21 — Dispute

## US-DISPUTE-001 — Create Dispute

**Actor:** Student / Tutor

> As a Student or Tutor, I want to create a formal Dispute when an issue requires platform intervention, so that the issue can be investigated and resolved.

**Related FR:** FR-DISPUTE-001

### Acceptance Criteria

Supported categories include:

- Attendance conflict.
- Session delivery.
- Cancellation.
- Financial issue.
- Service issue.
- Trust & Safety issue.

---

## US-DISPUTE-002 — Place Financial Hold

**Actor:** System

> As the system, I want to place applicable funds on hold during an unresolved Dispute, so that disputed money is not prematurely released.

**Related FR:** FR-DISPUTE-003

### Acceptance Criteria

- Applicable financial amount is placed on hold.
- Held amount is not released until the relevant resolution.
- Hold is associated with the Dispute.

---

## US-DISPUTE-003 — Investigate Dispute

**Actor:** Admin

> As an Admin, I want to review all relevant evidence for a Dispute, so that I can make a fair resolution.

**Related FR:** FR-DISPUTE-004, FR-ADMIN-013

### Acceptance Criteria

Admin can review relevant:

- Student statement.
- Tutor statement.
- Session information.
- Attendance information.
- Conversation context.
- Evidence.
- Financial records.

---

## US-DISPUTE-004 — Resolve Dispute

**Actor:** Admin

> As an Admin, I want to resolve a Dispute using defined outcomes, so that the issue has an explicit platform decision.

**Related FR:** FR-DISPUTE-005, FR-ADMIN-014

### Acceptance Criteria

Supported outcomes:

- Student wins.
- Tutor wins.
- Partial adjustment.
- No action.

---

## US-DISPUTE-005 — Apply Dispute Financial Resolution

**Actor:** System

> As the system, I want to apply the financial consequence of a Dispute resolution, so that money is distributed according to the Admin's decision.

**Related FR:** FR-DISPUTE-006

### Acceptance Criteria

Resolution may result in:

- Release funds.
- Refund Student.
- Partial adjustment.
- Other explicit financial adjustment.

All corrections remain financially traceable.

---

## US-DISPUTE-006 — Notify Dispute Resolution

**Actor:** Student / Tutor

> As a Student or Tutor involved in a Dispute, I want to be notified when the Dispute is resolved, so that I know the outcome.

**Related FR:** FR-DISPUTE-007

### Acceptance Criteria

- Affected parties receive notification.
- Notification links to the relevant Dispute context where applicable.

---

# EPIC 22 — Reviews & Ratings

## US-REVIEW-001 — Become Eligible to Review

**Actor:** Student / System

> As a Student, I want to know when my Enrollment becomes eligible for review, so that I can provide feedback after my learning experience.

**Related FR:** FR-REVIEW-001

### Acceptance Criteria

- Review eligibility is evaluated according to Review Policy.
- Review becomes available after Enrollment ends according to the applicable policy.

---

## US-REVIEW-002 — Create Review

**Actor:** Student

> As a Student, I want to rate and review my experience, so that I can provide feedback about the Tutor and Service.

**Related FR:** FR-REVIEW-002

### Acceptance Criteria

Student can submit:

- Rating.
- Written review.

Review is associated with the relevant Enrollment.

---

## US-REVIEW-003 — Prevent Unlimited Reviews

**Actor:** System

> As the system, I want to enforce Review uniqueness rules, so that one Enrollment cannot generate unlimited Reviews.

**Related FR:** FR-REVIEW-003

### Acceptance Criteria

- System prevents unlimited Reviews from the same Enrollment.
- Exact cardinality rule remains subject to detailed domain specification.

---

## US-REVIEW-004 — Reply to Review

**Actor:** Tutor

> As a Tutor, I want to reply to a Student's Review, so that I can respond to feedback about my Service.

**Related FR:** FR-REVIEW-004

### Acceptance Criteria

- Tutor can reply to an applicable Review.
- Reply is associated with the Review.
- Tutor cannot reply as another user.

---

## US-REVIEW-005 — Report Review

**Actor:** User

> As a User, I want to report a Review that violates platform policy, so that Admin can investigate inappropriate content.

**Related FR:** FR-REVIEW-006

### Acceptance Criteria

- User can report a Review.
- Report is associated with the Review.
- Report enters the Trust & Safety/Admin workflow.

---

## US-REVIEW-006 — Moderate Review

**Actor:** Admin

> As an Admin, I want to remove a reported Review when it violates policy, so that marketplace content remains trustworthy.

**Related FR:** FR-REVIEW-007

### Acceptance Criteria

- Admin can remove a violating reported Review.
- Removal requires a reason.
- Admin does not silently rewrite the Review.

---

# EPIC 23 — Trust & Safety

## US-TRUST-001 — Report User

**Actor:** Student / Tutor

> As a Student or Tutor, I want to report another user, so that potentially harmful or policy-violating behavior can be investigated.

**Related FR:** FR-TRUST-001

### Acceptance Criteria

- User can create a report against another user.
- Report is available to Admin for investigation.

---

## US-TRUST-002 — Block User

**Actor:** Student / Tutor

> As a Student or Tutor, I want to block another user, so that I can control unwanted interactions.

**Related FR:** FR-TRUST-002

### Acceptance Criteria

- User can block another user.
- Block behavior follows the separately defined platform policy.

---

## US-TRUST-003 — Investigate Trust & Safety Report

**Actor:** Admin

> As an Admin, I want to investigate Trust & Safety reports, so that I can protect users and the marketplace.

**Related FR:** FR-TRUST-003

### Acceptance Criteria

Admin can inspect relevant information required for investigation.

---

## US-TRUST-004 — Enforce Trust & Safety Policy

**Actor:** Admin

> As an Admin, I want to apply enforcement actions to violating users or content, so that the marketplace remains safe.

**Related FR:** FR-TRUST-004

### Acceptance Criteria

Admin can take applicable actions:

- Dismiss.
- Warn.
- Suspend.
- Ban.
- Remove violating content.
- Remove violating Service.

---

# EPIC 24 — Notifications

## US-NOTIF-001 — Receive Business Event Notification

**Actor:** Student / Tutor / Admin

> As a platform user, I want to receive notifications about relevant business events, so that I remain informed about important changes affecting me.

**Related FR:** FR-NOTIF-001

### Acceptance Criteria

- Applicable Business Events can generate Notifications.
- Notification does not determine business state.
- Business state changes independently from notification delivery.

---

## US-NOTIF-002 — Receive In-app Notification

**Actor:** User

> As a User, I want to receive in-app notifications, so that I can see important platform updates inside TutorHub.

**Related FR:** FR-NOTIF-002

---

## US-NOTIF-003 — Receive Email Notification

**Actor:** User

> As a User, I want to receive email notifications for applicable events, so that I can stay informed outside the platform.

**Related FR:** FR-NOTIF-003

---

## US-NOTIF-004 — Manage Notification Center

**Actor:** User

> As a User, I want to view and manage my notifications, so that I can keep track of unread and previously viewed events.

**Related FR:** FR-NOTIF-004

### Acceptance Criteria

User can:

- View notifications.
- Mark a notification as read.
- Mark all notifications as read.

---

## US-NOTIF-005 — Navigate from Notification to Context

**Actor:** User

> As a User, I want a notification to take me directly to the relevant context, so that I can quickly act on the event.

**Related FR:** FR-NOTIF-005

### Examples

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

## US-NOTIF-006 — Receive Critical Notifications

**Actor:** User

> As a User, I want critical financial, dispute, and security notifications to remain active, so that I cannot accidentally miss important platform events.

**Related FR:** FR-NOTIF-006

### Acceptance Criteria

Critical notifications related to:

- Payment.
- Refund.
- Withdrawal.
- Dispute.
- Security.

cannot be completely disabled.

---

## US-NOTIF-007 — Receive Session Reminder

**Actor:** Student / Tutor

> As a Student or Tutor, I want to receive a reminder before a Session, so that I can prepare for the scheduled learning activity.

**Related FR:** FR-NOTIF-007

### Acceptance Criteria

- Reminder is sent before the Session.
- MVP default reminder is 24 hours before the Session.

---

## US-NOTIF-008 — Receive Attendance Reminder

**Actor:** Student / Tutor

> As a Student or Tutor, I want to receive a reminder when Attendance Verification is incomplete, so that I can complete the required verification.

**Related FR:** FR-NOTIF-008

---

# EPIC 25 — Business Events

## US-EVENT-001 — Publish Marketplace Events

**Actor:** System

> As the system, I want important Tutor application events to be represented as Business Events, so that downstream business processes and notifications can react consistently.

**Related FR:** FR-EVENT-001

### Supported Events

```text
TutorApplicationSubmitted
TutorApplicationApproved
TutorApplicationRejected
```

---

## US-EVENT-002 — Publish Enrollment Events

**Actor:** System

> As the system, I want important Enrollment events to be represented as Business Events, so that the platform can maintain a consistent event-driven business flow.

**Related FR:** FR-EVENT-002

### Supported Events

```text
CustomOfferCreated
CustomOfferAccepted
PaymentSucceeded
EnrollmentActivated
EnrollmentCancelled
```

---

## US-EVENT-003 — Publish Session Events

**Actor:** System

> As the system, I want important Session events to be represented as Business Events, so that relevant business consequences and notifications can be triggered.

**Related FR:** FR-EVENT-003

### Supported Events

```text
SessionScheduled
SessionRescheduled
SessionCancelled
AttendanceVerificationRequired
AttendanceConflictDetected
SessionCompleted
```

---

## US-EVENT-004 — Publish Financial Events

**Actor:** System

> As the system, I want important financial state transitions to be represented as Business Events, so that financial notifications and workflows remain consistent.

**Related FR:** FR-EVENT-004

### Supported Events

```text
EarningCreated
RefundCreated
RefundCompleted
WithdrawalRequested
WithdrawalCompleted
WithdrawalFailed
```

---

## US-EVENT-005 — Publish Trust Events

**Actor:** System

> As the system, I want important Trust and Review events to be represented as Business Events, so that related platform workflows can react consistently.

**Related FR:** FR-EVENT-005

### Supported Events

```text
ReviewCreated
DisputeCreated
DisputeResolved
ReportCreated
```

---

# EPIC 26 — Admin User Management

## US-ADMIN-001 — View User

**Actor:** Admin

> As an Admin, I want to view user information, so that I can perform platform operations and investigations.

**Related FR:** FR-ADMIN-001

---

## US-ADMIN-002 — Suspend User

**Actor:** Admin

> As an Admin, I want to suspend a user, so that I can temporarily restrict access when required.

**Related FR:** FR-ADMIN-002

---

## US-ADMIN-003 — Reactivate User

**Actor:** Admin

> As an Admin, I want to reactivate a suspended user, so that the user can resume permitted platform activities.

**Related FR:** FR-ADMIN-003

---

## US-ADMIN-004 — Ban User

**Actor:** Admin

> As an Admin, I want to ban a user, so that users who cannot continue participating in the marketplace are prevented from normal platform activity.

**Related FR:** FR-ADMIN-004

---

# EPIC 27 — Admin Enrollment Governance

## US-ADMIN-005 — View Enrollment as Admin

**Actor:** Admin

> As an Admin, I want read visibility into Enrollment information, so that I can investigate exceptional cases without interfering with normal learning flows.

**Related FR:** FR-ADMIN-007

### Acceptance Criteria

- Admin can view relevant Enrollment information.
- Admin normally has read visibility rather than direct control.
- Exceptional intervention follows applicable rules.

---

## US-ADMIN-006 — Intervene in Exceptional Enrollment

**Actor:** Admin

> As an Admin, I want to intervene in an Enrollment during exceptional situations, so that serious platform issues can be resolved.

**Related FR:** FR-ADMIN-008

### Applicable situations

- Fraud.
- Serious safety issue.
- Tutor banned.
- Platform error.
- Dispute resolution.

---

## US-ADMIN-007 — Cancel Enrollment Administratively

**Actor:** Admin

> As an Admin, I want to cancel an Enrollment in exceptional situations, so that serious operational or safety issues can be resolved.

**Related FR:** FR-ADMIN-009

### Acceptance Criteria

- Cancellation reason is mandatory.
- Financial consequences are explicitly determined.
- Affected parties are notified.
- Administrative action is audited.

---

# EPIC 28 — Admin Financial Operations

## US-ADMIN-008 — Process Refund

**Actor:** Admin

> As an Admin, I want to process refunds when permitted by policy, so that exceptional financial cases can be resolved correctly.

**Related FR:** FR-ADMIN-010

### Acceptance Criteria

Every refund contains:

- Amount.
- Reason.
- Related transaction.
- Audit record.

---

## US-ADMIN-009 — Handle Withdrawal Issue

**Actor:** Admin

> As an Admin, I want to handle operational withdrawal issues, so that failed or exceptional withdrawals can be resolved.

**Related FR:** FR-ADMIN-011

---

## US-ADMIN-010 — Protect Tutor Balance

**Actor:** Admin

> As an Admin, I want financial corrections to use explicit adjustment records, so that Tutor balances remain auditable.

**Related FR:** FR-ADMIN-012

### Acceptance Criteria

- Admin cannot arbitrarily modify Tutor Balance.
- Financial correction creates an explicit adjustment record.
- Adjustment contains an appropriate reason.
- Financial history is preserved.

---

# EPIC 29 — Platform Configuration

## US-CONFIG-001 — Configure Platform Fee

**Actor:** Admin

> As an Admin, I want to configure the platform fee, so that Tutor earnings follow the current platform policy.

**Related FR:** FR-CONFIG-001

---

## US-CONFIG-002 — Configure Cancellation Policy

**Actor:** Admin

> As an Admin, I want to configure Cancellation Policy rules, so that cancellation consequences can be governed consistently.

**Related FR:** FR-CONFIG-002

---

## US-CONFIG-003 — Configure Refund Rules

**Actor:** Admin

> As an Admin, I want to configure Refund rules, so that applicable refunds can follow platform policy.

**Related FR:** FR-CONFIG-003

---

## US-CONFIG-004 — Configure Attendance Verification Window

**Actor:** Admin

> As an Admin, I want to configure the Attendance Verification Window, so that the platform can control how long participants have to verify attendance.

**Related FR:** FR-CONFIG-004

---

## US-CONFIG-005 — Configure Withdrawal Rules

**Actor:** Admin

> As an Admin, I want to configure Withdrawal rules, so that Tutor payouts follow platform policy.

**Related FR:** FR-CONFIG-005

---

## US-CONFIG-006 — Configure Review Window

**Actor:** Admin

> As an Admin, I want to configure the Review Window, so that Students have a defined period in which they can provide feedback.

**Related FR:** FR-CONFIG-006

---

## US-CONFIG-007 — Preserve Historical Policy Integrity

**Actor:** System

> As the system, I want policy changes to apply according to their effective rules, so that historical transactions are not retroactively changed.

**Related FR:** FR-CONFIG-007

### Acceptance Criteria

- Policy changes apply according to the applicable rule for new transactions.
- Historical transactions are not retroactively changed solely because policy changed.
- Relevant policy version can be identified where required.

---

# EPIC 30 — Audit & Financial Integrity

## US-AUDIT-001 — Audit Administrative Actions

**Actor:** System

> As the system, I want to record important Admin actions, so that platform governance decisions remain traceable.

**Related FR:** FR-AUDIT-001

### Acceptance Criteria

Important Admin actions create Audit Logs.

---

## US-AUDIT-002 — Record Administrative Context

**Actor:** Admin / System

> As an Admin, I want administrative actions to record who, what, why, when, and what was affected, so that decisions can be investigated later.

**Related FR:** FR-AUDIT-002

### Audit information

```text
Who?
What?
Why?
When?
What was affected?
```

---

## US-AUDIT-003 — Preserve Financial History

**Actor:** System

> As the system, I want historical financial transactions to remain immutable, so that financial history cannot be silently rewritten.

**Related FR:** FR-FIN-001

### Acceptance Criteria

- Historical financial transactions are not silently modified.
- Historical financial transactions are not silently deleted.

---

## US-AUDIT-004 — Create Explicit Financial Adjustment

**Actor:** System / Admin

> As an Admin, I want financial corrections to create explicit adjustment records, so that every correction has a traceable reason.

**Related FR:** FR-FIN-002, FR-FIN-004

### Acceptance Criteria

A financial correction:

```text
Correction
→ Explicit Adjustment
→ Reason
→ Audit
```

---

## US-AUDIT-005 — Preserve Enrollment Financial Integrity

**Actor:** System

> As the system, I want Session allocations to reconcile exactly with the Enrollment price, so that the financial model remains internally consistent.

**Related FR:** FR-FIN-003

### Acceptance Criteria

```text
Total Enrollment Price
=
Sum of Session Allocations
```

- Rounding remainder is handled according to the defined rule.
- No value is lost or silently created.

---

# EPIC 31 — End-to-End Student Journey

## US-JOURNEY-001 — Discover and Evaluate Tutor

**Actor:** Student

> As a Student, I want to discover Tutors, inspect their Profiles, Services, and Trial Lessons, so that I can make an informed purchase decision.

### Acceptance Criteria

Student can:

```text
Browse
→ Search
→ Filter where supported
→ View Tutor
→ View Service
→ View Trial Lesson
```

---

## US-JOURNEY-002 — Purchase Standard Service

**Actor:** Student

> As a Student, I want to purchase a Standard Service through TutorHub, so that I can begin a structured learning commitment.

### Acceptance Criteria

```text
Discover
→ Evaluate
→ Accept Service
→ Pay
→ Enrollment Active
```

---

## US-JOURNEY-003 — Purchase Custom Service

**Actor:** Student

> As a Student, I want to discuss and accept customized terms with a Tutor, so that I can purchase a Service that better matches my needs.

### Acceptance Criteria

```text
Discover
→ Evaluate
→ Chat
→ Custom Discussion
→ Custom Agreement
→ Accept
→ Pay
→ Enrollment
```

---

## US-JOURNEY-004 — Complete Learning Cycle

**Actor:** Student

> As a Student, I want to participate in Sessions, verify attendance, track Learning Records, and complete my Enrollment, so that I can follow the full learning lifecycle.

### Acceptance Criteria

```text
Enrollment
→ Schedule
→ Session
→ Attendance
→ Learning Record
→ Session Completion
→ Enrollment Completion
→ Review
```

---

# EPIC 32 — End-to-End Tutor Journey

## US-JOURNEY-005 — Become an Approved Tutor

**Actor:** Tutor

> As a Tutor, I want to apply and obtain approval, so that I can offer Services on the marketplace.

### Acceptance Criteria

```text
Apply
→ Pending
→ Admin Review
→ Approved
```

---

## US-JOURNEY-006 — Acquire Student

**Actor:** Tutor

> As an approved Tutor, I want to publish Services and communicate with Students, so that I can acquire learning clients.

### Acceptance Criteria

```text
Approved
→ Create Service
→ Publish
→ Student Discovery
→ Messaging
```

---

## US-JOURNEY-007 — Deliver Service and Earn

**Actor:** Tutor

> As a Tutor, I want to deliver Sessions, verify attendance, and receive progressive earnings, so that I am compensated for successfully delivered learning.

### Acceptance Criteria

```text
Enrollment
→ Schedule
→ Session
→ Attendance Verification
→ Session Completed
→ Earning
→ Balance
```

---

## US-JOURNEY-008 — Withdraw Earnings

**Actor:** Tutor

> As a Tutor, I want to withdraw my Available Balance, so that I can receive money earned from completed Sessions.

### Acceptance Criteria

```text
Available Balance
→ Withdrawal Request
→ Processing
→ Completed / Failed
```

---

# EPIC 33 — End-to-End Admin Governance

## US-JOURNEY-009 — Govern Tutor Marketplace

**Actor:** Admin

> As an Admin, I want to review Tutor applications and moderate violating marketplace content, so that TutorHub remains a trusted marketplace.

### Acceptance Criteria

```text
Tutor Application
→ Review
→ Approve / Reject

Service Violation
→ Investigate
→ Unpublish / Require Correction
```

---

## US-JOURNEY-010 — Resolve Exceptional Cases

**Actor:** Admin

> As an Admin, I want to investigate disputes, reports, financial issues, and safety incidents, so that exceptional marketplace situations can be resolved.

### Acceptance Criteria

Admin can:

```text
Investigate
→ Decide
→ Apply Financial Consequence
→ Notify
→ Audit
```

---

# EPIC 34 — Core Business Invariants

Các invariant này không nhất thiết là User Story độc lập trong UI backlog, nhưng phải được xem là **acceptance constraints xuyên suốt các stories liên quan**.

## INV-US-001 — Enrollment Price Integrity

> As a Student, I want my purchased Enrollment price to remain fixed, so that later Service price changes cannot unexpectedly affect my commitment.

```text
Service Price Change
≠
Existing Enrollment Price Change
```

---

## INV-US-002 — Session Allocation Integrity

> As a platform, I want all Session allocations to reconcile to the Enrollment price, so that financial accounting remains consistent.

```text
Σ Session Allocation
=
Enrollment Total Price
```

---

## INV-US-003 — Attendance Conflict Protection

> As a Student or Tutor, I want disputed attendance to prevent premature earning release, so that unresolved conflicts can be investigated.

```text
Attendance Conflict
→ No Earning Release
```

---

## INV-US-004 — Attendance Timeout Protection

> As a platform, I want incomplete attendance verification to remain unresolved after timeout, so that the system does not incorrectly classify a Session as attended.

```text
Verification Timeout
→ Pending Resolution
→ No Automatic Attended
→ No Earning Release
```

---

## INV-US-005 — Pending Earnings Protection

> As a Tutor, I want only Available Balance to be withdrawable, so that funds still subject to resolution cannot be withdrawn.

```text
Pending Earnings
→ Cannot Withdraw
```

---

## INV-US-006 — Financial History Integrity

> As a platform, I want historical financial records to remain immutable, so that every money movement remains auditable.

```text
Historical Transaction
→ Cannot be silently rewritten/deleted
```

---

## INV-US-007 — Explicit Financial Correction

> As an Admin, I want financial corrections to be represented as explicit adjustments, so that every correction has a reason and audit trail.

```text
Correction
→ Explicit Adjustment
→ Reason
→ Audit
```

---

## INV-US-008 — Tutor Cannot Continue

> As a Student, I want unused learning value refunded when a Tutor cannot continue, so that I am not charged for undelivered future learning.

```text
Tutor Cannot Continue
→ Cancel Enrollment
→ Refund Unused Portion
→ Stop Future Sessions
→ No Automatic Tutor Transfer
```

---

## INV-US-009 — Trial Lesson Isolation

> As a Student, I want to evaluate a Trial Lesson without creating a commercial commitment, so that I can decide whether to purchase.

```text
Trial Lesson
→ No Enrollment
→ No Payment
→ No Earning
```

---

## INV-US-010 — Messaging Isolation

> As a platform, I want messaging to remain separate from commercial state, so that communication does not accidentally create a transaction.

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

## INV-US-011 — Admin Governance Boundary

> As a platform, I want normal workflows to remain user-driven and exceptional workflows to require Admin intervention, so that Admin does not unnecessarily control normal tutoring activity.

```text
Normal Flow
→ User-driven

Exceptional Flow
→ Admin intervention
→ Audit
```

---

# 35. User Story Coverage Summary

| Capability | Main User Stories |
|---|---|
| Authentication | US-AUTH-001 → 003 |
| Tutor Application | US-TUTOR-001 → 003 |
| Tutor Profile | US-TUTOR-004 → 005 |
| Service | US-SERVICE-001 → 006 |
| Marketplace | US-MARKET-001 → 004 |
| Trial Lesson | US-TRIAL-001 → 002 |
| Messaging | US-MSG-001 → 005 |
| Custom Agreement | US-AGREE-001 → 003 |
| Standard Purchase | US-PURCHASE-001 → 002 |
| Payment | US-PAY-001 → 003 |
| Enrollment | US-ENR-001 → 004 |
| Schedule / Session | US-SESSION-001 → 009 |
| Attendance | US-ATT-001 → 007 |
| Learning Record | US-LEARN-001 → 003 |
| Earnings | US-EARN-001 → 004 |
| Balance | US-WALLET-001 → 002 |
| Withdrawal | US-WITHDRAW-001 → 005 |
| Cancellation | US-CANCEL-001 → 003 |
| Tutor Cannot Continue | US-CONTINUE-001 |
| Tutor No-show | US-NOSHOW-001 → 003 |
| Refund | US-REFUND-001 → 003 |
| Dispute | US-DISPUTE-001 → 006 |
| Reviews | US-REVIEW-001 → 006 |
| Trust & Safety | US-TRUST-001 → 004 |
| Notifications | US-NOTIF-001 → 008 |
| Business Events | US-EVENT-001 → 005 |
| Admin User Management | US-ADMIN-001 → 004 |
| Admin Enrollment | US-ADMIN-005 → 007 |
| Admin Financial Operations | US-ADMIN-008 → 010 |
| Platform Configuration | US-CONFIG-001 → 007 |
| Audit | US-AUDIT-001 → 005 |
| End-to-End Journeys | US-JOURNEY-001 → 010 |
| Business Invariants | INV-US-001 → 011 |

---

# 36. Explicitly Unresolved Stories / Requirements

Các User Stories dưới đây **không nên được coi là implementation-ready** cho đến khi các open requirements trong Functional Requirements được chốt.

### Marketplace

- Exact marketplace filter criteria.
- Sorting behavior.

### Cancellation / Refund

- Cancellation policy matrix.
- Refund calculation formula.
- Treatment of completed/pending/cancelled Sessions.
- Treatment of already released earnings.

### Session Allocation

- Different Session durations.
- Custom Agreement allocation.
- Partial Enrollment.
- Allocation after cancellation/refund.

### Attendance

- Exact Verification Window duration.

### Review

- Exact Review Window.
- Exact Review cardinality.

### Withdrawal

- Minimum withdrawal amount.
- Processing time.
- Supported payout methods.
- Withdrawal fee.
- Failure handling.
- Frequency/limits.

### Platform Fee

- Percentage/fixed amount.
- Calculation basis.
- Per-earning vs Enrollment basis.
- Rounding.
- Policy versioning.

### Makeup Session

- Who creates it.
- Who proposes it.
- Student acceptance.
- Relation to original Session.
- Financial allocation.
- Maximum attempts.
- Cancellation behavior.

### Notifications

- Event-to-channel mapping.
- Retry behavior.
- Email failure handling.
- Notification preference model.

### Reports

- Report categories.
- Required evidence.
- Report lifecycle.
- Resolution SLA.
- Reporter visibility.

### Blocking

- Existing conversation behavior.
- New message behavior.
- Marketplace visibility.
- Effect on existing Enrollment.

### Authentication

- Authentication methods.
- Password policy.
- Email verification.
- Password reset.
- Account deletion.
- Role switching.

---

# 37. Product-Level User Story Flow

## Student

```text
Register
   ↓
Browse Marketplace
   ↓
Search / Filter
   ↓
View Tutor
   ↓
View Service
   ↓
View Trial Lesson
   ↓
┌─────────────────────┐
│ Standard Service    │
│         OR          │
│ Custom Agreement    │
└─────────────────────┘
          ↓
       Payment
          ↓
      Enrollment
          ↓
       Schedule
          ↓
       Sessions
          ↓
Attendance Verification
          ↓
   Learning Record
          ↓
    Session Complete
          ↓
 Enrollment Complete
          ↓
        Review
```

---

## Tutor

```text
Register
   ↓
Tutor Application
   ↓
Admin Approval
   ↓
Tutor Profile
   ↓
Create Service
   ↓
Publish
   ↓
Student Discovery
   ↓
Messaging
   ↓
Custom Agreement (if required)
   ↓
Enrollment
   ↓
Schedule
   ↓
Conduct Sessions
   ↓
Attendance Verification
   ↓
Learning Record
   ↓
Session Earning
   ↓
Tutor Balance
   ↓
Withdrawal
   ↓
Review Response
```

---

## Admin

```text
Tutor Application
       ↓
     Review
       ↓
 Approve / Reject
       ↓
Marketplace Governance
       ↓
Reports / Trust & Safety
       ↓
Dispute Investigation
       ↓
Financial Exceptions
       ↓
Refund / Withdrawal Operations
       ↓
Platform Configuration
       ↓
Audit
```

---

# 38. Final User Story Product Loop

TutorHub MVP user stories collectively support:

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
        ┌──────────┼──────────┐
        ↓          ↓          ↓
     PAYMENT    ATTENDANCE   REVIEW
    PROTECTION  VERIFICATION
        │          │          │
        └──────────┼──────────┘
                   ↓
             REFUND / DISPUTE
                   ↓
             TRUST & SAFETY
                   ↓
             ADMIN GOVERNANCE
                   ↓
                  AUDIT
```

**Status: DRAFT — Pending User Review**