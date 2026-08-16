---

name: architecture
description: Design, implement, review, and refactor backend applications using Clean Architecture, CQRS, MediatR-style request dispatching, and Vertical Slice Architecture. Use when deciding project boundaries, dependency direction, application feature structure, command/query design, handler responsibilities, pipeline behaviors, abstractions, use-case boundaries, or architectural refactoring. This skill is technology-aware but project-agnostic and must adapt to the repository's existing conventions.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Backend Architecture

## Purpose

Use this skill to design and maintain backend applications that combine:

* Clean Architecture for dependency direction and boundaries.
* Vertical Slice Architecture for organizing application code around features and use cases.
* CQRS for separating state-changing operations from read operations.
* MediatR or an equivalent mediator for dispatching application requests.
* Pipeline behaviors for cross-cutting concerns.

These patterns are complementary, not interchangeable.

The architecture should optimize for:

* Clear dependency boundaries.
* Explicit use cases.
* High cohesion within features.
* Low coupling between implementation details.
* Testable business behavior.
* Maintainable application code.
* Minimal unnecessary abstraction.

Do not apply any pattern mechanically.

---

# 1. Architectural Model

The default conceptual architecture is:

```text
                    Presentation
                         │
                         ▼
                  Application
                  /           \
         Vertical Slices      Cross-cutting
              │                   │
       Command / Query       Pipeline Behaviors
              │                   │
              └─────────┬─────────┘
                        ▼
                     Domain
                        ▲
                        │
                 Infrastructure
```

A more precise dependency model is:

```text
Presentation
     │
     ▼
Application ───────────────► Domain
     │
     │ abstractions
     ▼
Infrastructure
     │
     └──────────────► Application / Domain abstractions
```

The exact physical project structure may vary.

The dependency rule is more important than folder names.

---

# 2. Pattern Responsibilities

Do not confuse the responsibilities of the patterns.

## Clean Architecture

Defines:

* Dependency direction.
* Layer boundaries.
* Separation between policy and implementation detail.
* Where infrastructure dependencies are allowed.

## Vertical Slice Architecture

Defines:

* How application code is organized.
* Feature/use-case boundaries.
* High cohesion within a feature.
* Reduced coupling between unrelated features.

## CQRS

Defines:

* Separation between commands and queries.
* Different models or execution strategies where useful.
* Clear intent of application operations.

CQRS does not require separate databases or event sourcing.

## MediatR / Mediator

Defines:

* Request dispatching.
* Handler invocation.
* Pipeline behavior composition.

MediatR is an implementation mechanism, not the architecture itself.

## Pipeline Behaviors

Handle cross-cutting concerns such as:

* Validation.
* Logging.
* Metrics.
* Transactions.
* Performance measurement.
* Authorization when appropriate.

Do not place business logic in pipeline behaviors.

---

# 3. Layer Responsibilities

## 3.1 Domain

The Domain contains business policies and invariants.

Typical contents:

```text
Entities
Value Objects
Aggregates
Domain Services
Domain Events
Business Rules
Domain Exceptions
Enums
```

The Domain must not depend on:

```text
HTTP
Controllers
MediatR
ORM implementations
Database providers
External APIs
Message brokers
UI frameworks
Infrastructure implementations
```

The Domain should not know how application requests are dispatched.

---

# 3.2 Application

Application contains application behavior and use cases.

Typical contents:

```text
Features
Commands
Queries
Handlers
Validators
DTOs / Results
Pipeline Behaviors
Application abstractions
Use-case-specific services
```

Application coordinates business operations but should not become a replacement for the Domain.

Application answers:

> What does the system do?

Domain answers:

> What business rules must always hold?

Infrastructure answers:

> How is an external capability implemented?

---

# 3.3 Infrastructure

Infrastructure implements technical details.

Typical contents:

```text
Persistence
ORM configuration
Repository implementations
External API clients
Email
File storage
Caching
Messaging
Authentication providers
Third-party integrations
```

Infrastructure should implement abstractions required by Application or Domain where appropriate.

Infrastructure must not move business rules out of the Domain merely because the infrastructure layer has access to more technical information.

---

# 3.4 Presentation

Presentation translates external protocols into application requests.

Examples:

```text
HTTP Controllers
Minimal APIs
GraphQL
Message Consumers
CLI
```

Presentation should generally:

1. Receive input.
2. Perform transport-level concerns.
3. Create/send an application request.
4. Translate the result into the external protocol.

Avoid placing business logic in controllers or endpoints.

---

# 4. Vertical Slice Architecture

Application code should normally be organized by feature/use case rather than technical type.

Prefer:

```text
Application/
└── Features/
    ├── Students/
    │   ├── CreateStudent/
    │   ├── UpdateStudent/
    │   └── GetStudent/
    │
    ├── Enrollments/
    │   ├── CreateEnrollment/
    │   └── CancelEnrollment/
    │
    └── Attendance/
        ├── RecordAttendance/
        └── GetAttendance/
```

over:

```text
Application/
├── Commands/
├── Queries/
├── Handlers/
├── Validators/
├── DTOs/
└── Services/
```

The second structure scatters one feature across many folders.

Vertical slices keep related behavior together.

---

# 5. Feature Boundaries

A feature should represent a meaningful application capability.

Examples:

```text
CreateStudent
RegisterEnrollment
CancelEnrollment
RecordAttendance
GenerateInvoice
ApprovePayment
```

A feature should contain the components necessary to implement that use case.

For example:

```text
CreateStudent/
├── Command.cs
├── Handler.cs
├── Validator.cs
└── Result.cs
```

Do not create files simply to satisfy a predetermined template.

If a feature does not need a validator, do not create an empty validator.

If a feature does not need a DTO, do not create one merely for consistency.

---

# 6. CQRS

Use CQRS to make application intent explicit.

## Command

A Command represents an operation that changes state.

Examples:

```text
CreateStudent
UpdateStudent
DeleteStudent
EnrollStudent
RecordAttendance
CancelEnrollment
```

Characteristics:

* Expresses intent.
* May modify state.
* Should enforce relevant business rules.
* Usually returns a meaningful result or acknowledgement.

---

## Query

A Query represents an operation that reads data.

Examples:

```text
GetStudent
GetStudentList
GetEnrollmentDetails
GetAttendanceHistory
```

Characteristics:

* Should not modify application state.
* Should be optimized for the required read model.
* May use projections.
* Does not need to load full domain aggregates when unnecessary.

---

# 7. CQRS Does Not Require Two Databases

Do not assume:

```text
Command Database
+
Query Database
```

is required.

CQRS can be implemented using:

```text
One database
One ORM
One persistence model
```

while still maintaining separate Command and Query application flows.

Introduce separate read/write models or databases only when justified by actual requirements.

---

# 8. Command Design

Commands should express intent rather than describe implementation.

Prefer:

```text
ApproveEnrollment
```

over:

```text
UpdateEnrollmentStatus
```

when the business operation is conceptually an approval.

The command should contain the information required to execute the use case.

Avoid placing infrastructure dependencies inside commands.

Example conceptual structure:

```text
Command
 └── input data

Handler
 └── use-case orchestration
```

---

# 9. Query Design

Queries should express the information required by the caller.

Prefer purpose-specific queries:

```text
GetStudentDetails
GetStudentList
GetAttendanceSummary
```

over one giant query object containing every possible filtering and projection option.

Queries may bypass domain entities when the operation is purely read-oriented and does not require domain behavior.

For example:

```text
Query
   ↓
Application read abstraction
   ↓
Projection
   ↓
Database
```

can be appropriate.

Do not instantiate complex domain aggregates solely to display read-only data.

---

# 10. Handler Responsibilities

A Handler represents the execution boundary of one application use case.

A Handler may:

```text
Validate application input
Load required domain objects
Invoke domain behavior
Coordinate application services
Call persistence abstractions
Call external service abstractions
Commit the operation
Construct the result
```

A Handler should not become a dumping ground for business rules.

Avoid:

```text
Handler
 ├── 300 lines of business rules
 ├── SQL construction
 ├── HTTP calls
 ├── email formatting
 └── domain calculations
```

Instead:

```text
Handler
 ├── orchestrates use case
 ├── invokes Domain behavior
 ├── invokes abstractions
 └── returns result
```

---

# 11. Domain vs Handler

Use this rule:

### Business invariant

Put it in Domain.

Example:

```text
An enrollment cannot be cancelled after completion.
```

### Application workflow

Put it in Handler/Application.

Example:

```text
Load enrollment
→ verify actor authorization
→ cancel enrollment
→ persist changes
→ publish notification
```

The Handler coordinates.

The Domain enforces the business rule.

---

# 12. MediatR / Mediator

Use a mediator to decouple Presentation from concrete application handlers.

Typical flow:

```text
Controller
    │
    ▼
IMediator.Send(command)
    │
    ▼
Pipeline
    │
    ▼
CommandHandler
```

The Presentation layer should not manually instantiate handlers.

Avoid:

```text
new CreateStudentHandler(...)
```

in controllers.

---

# 13. MediatR Is Not a Requirement

If a project already uses another mediator or does not need one, do not introduce MediatR merely because this skill mentions it.

The architectural principle is:

> Application requests should have clear dispatch and execution boundaries.

The implementation may be:

```text
MediatR
Custom mediator
Framework mediator
Direct application service
```

Choose according to project requirements and conventions.

---

# 14. Pipeline Behaviors

Pipeline behaviors are appropriate for cross-cutting concerns.

Typical pipeline:

```text
Request
  ↓
Logging
  ↓
Authorization
  ↓
Validation
  ↓
Transaction
  ↓
Handler
```

The exact ordering depends on the project.

Common behaviors:

```text
ValidationBehavior
LoggingBehavior
PerformanceBehavior
TransactionBehavior
AuthorizationBehavior
CachingBehavior
```

Do not use pipeline behaviors for business-specific behavior that belongs to a feature or domain model.

---

# 15. Validation Behavior

Validation behavior should handle application/input validation.

Example:

```text
Request
   ↓
ValidationBehavior
   ├── valid → continue
   └── invalid → return validation error
```

Do not move domain invariants into validators merely to avoid implementing them in the Domain.

Example:

```text
"Name must not be empty"
```

can be request validation.

But:

```text
"An enrolled student cannot be removed from a completed course"
```

is a domain rule.

---

# 16. Transaction Behavior

Transactions should be applied around appropriate command use cases.

A common model:

```text
Command
   ↓
Validation
   ↓
Transaction
   ↓
Handler
   ↓
Commit
```

Do not automatically wrap every query in a transaction.

Do not automatically wrap every command in a transaction if the persistence mechanism or operation does not require one.

Transaction boundaries should reflect consistency requirements.

---

# 17. Abstractions

Application may define abstractions for capabilities it requires.

Examples:

```text
IUserRepository
IEmailSender
IPaymentGateway
ICurrentUser
IFileStorage
IClock
```

Prefer abstractions that represent capabilities.

Avoid abstractions that simply mirror infrastructure classes.

Bad:

```text
ISqlConnection
ISqlCommandFactory
ISqlRepositoryBase
```

when the Application layer has no meaningful reason to understand those implementation details.

---

# 18. Dependency Direction

The preferred conceptual dependency graph is:

```text
                  ┌──────────────┐
                  │ Presentation │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Application  │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    Domain    │
                  └──────────────┘

                  ┌──────────────┐
                  │Infrastructure│
                  └──────┬───────┘
                         │
                         ▼
                 Application/Domain
                   abstractions
```

Infrastructure implements contracts defined toward the inside.

Do not allow:

```text
Domain → Infrastructure
Application → Infrastructure implementation
Domain → Presentation
```

unless the project has explicitly chosen a different trade-off.

---

# 19. Dependency Injection

Dependency Injection belongs primarily at the composition root.

The application should receive abstractions.

Infrastructure provides implementations.

Conceptually:

```text
Composition Root
      │
      ├── IEmailSender → SmtpEmailSender
      ├── IUserRepository → EfUserRepository
      └── IPaymentGateway → StripePaymentGateway
```

Do not construct infrastructure implementations inside handlers or domain objects.

---

# 20. Repository Pattern

Repositories are optional.

Do not create:

```text
IGenericRepository<T>
```

by default.

A repository is justified when it represents a meaningful persistence boundary.

Prefer:

```text
IEnrollmentRepository
IStudentRepository
IOrderRepository
```

when those interfaces represent actual application/domain requirements.

For read-heavy queries, direct query abstractions or projections may be more appropriate than repositories.

---

# 21. Domain Services

Use a Domain Service when:

* Logic is genuinely business logic.
* The behavior does not naturally belong to one entity/value object.
* Multiple domain concepts participate in the rule.

Do not create:

```text
StudentService
EnrollmentService
AttendanceService
```

merely because every feature needs somewhere to put logic.

First determine whether the behavior belongs to:

```text
Entity
Value Object
Aggregate
Domain Service
Application Handler
```

---

# 22. Shared/Common Code

Avoid large shared folders.

Do not create:

```text
Application/Common/
├── Helpers/
├── Utils/
├── Managers/
└── Misc/
```

unless the project has clearly defined ownership.

Shared code should have a concrete reason to be shared.

Feature-specific behavior should remain inside the feature.

If only two features use a helper and the helper represents feature-specific behavior, consider keeping separate implementations rather than prematurely extracting it.

---

# 23. Feature Coupling

Features should be independent where practical.

Avoid:

```text
Feature A
   ↓
Feature B internal Handler
```

Prefer:

```text
Feature A
   ↓
Shared application abstraction
```

or:

```text
Feature A
   ↓
Domain behavior
```

or an explicit application-level integration mechanism.

Do not call another feature's internal Handler merely because MediatR makes it technically possible.

A Handler is an implementation detail of its feature, not automatically a reusable service API.

---

# 24. Cross-Feature Communication

When one feature needs another capability, choose the least coupled mechanism that satisfies the requirement.

Possible approaches:

```text
Shared domain behavior
Application abstraction
Domain event
Integration event
Explicit application service
Direct reuse of a stable component
```

Do not introduce events for simple synchronous operations that do not benefit from decoupling.

Do not create artificial abstractions merely to avoid a direct dependency that is actually acceptable.

---

# 25. Domain Events

Domain Events are appropriate when:

* A meaningful domain event occurred.
* Multiple consumers may react to the event.
* The publisher should not know the consumers.
* The event represents domain meaning.

Example:

```text
EnrollmentApproved
       │
       ├── update related state
       ├── notify application process
       └── trigger other domain reactions
```

Do not use domain events as a generic replacement for method calls.

---

# 26. API Boundary

The API layer should map transport concerns to application requests.

Example:

```text
POST /students
      │
      ▼
CreateStudentCommand
      │
      ▼
MediatR
      │
      ▼
CreateStudentHandler
```

The API should not know the implementation details of the Handler.

The API should not contain persistence logic.

The API should not enforce domain invariants.

---

# 27. Result and DTO Design

Do not automatically create DTOs for every internal object.

Use DTOs when they provide a meaningful boundary:

* API contract.
* Query projection.
* Security boundary.
* Versioning.
* Preventing domain model leakage.

For read operations:

```text
Database
   ↓
Projection
   ↓
Query Result
   ↓
API Response
```

may be preferable to:

```text
Database
   ↓
Entity
   ↓
Map
   ↓
DTO
```

when the domain model is not required.

---

# 28. Testing Architecture

Architecture should support testing.

Typical test boundaries:

```text
Domain
→ fast unit tests

Application
→ handler/use-case tests

Infrastructure
→ integration tests

Presentation
→ API/integration tests
```

Do not mock everything.

Use real infrastructure in integration tests when the behavior being tested depends on the actual database, ORM, serialization, or external integration.

The architecture should make important business behavior testable without requiring infrastructure.

---

# 29. Avoid Over-Engineering

Do not introduce all patterns simultaneously just because they are available.

Before adding a pattern, ask:

```text
What problem does this solve?
What complexity does it introduce?
Does the project actually need it?
Does an existing abstraction already solve it?
```

Examples:

Do not introduce:

```text
CQRS
```

if the project has no meaningful distinction between reads and writes.

Do not introduce:

```text
Domain Events
```

for a simple synchronous method call.

Do not introduce:

```text
Repository
```

only to wrap ORM CRUD methods.

Do not introduce:

```text
Mediator
```

if direct application invocation is clearer and the project does not need mediation.

Do not introduce:

```text
Multiple databases
```

because CQRS exists.

Patterns are tools, not goals.

---

# 30. New Feature Workflow

When implementing a new backend feature:

```text
1. Understand the business capability
        ↓
2. Identify business invariants
        ↓
3. Determine Domain changes
        ↓
4. Define the application use case
        ↓
5. Decide Command or Query
        ↓
6. Create the Vertical Slice
        ↓
7. Add Handler
        ↓
8. Add validation if needed
        ↓
9. Use existing abstractions
        ↓
10. Create new abstractions only when justified
        ↓
11. Connect Presentation
        ↓
12. Implement Infrastructure details
        ↓
13. Add appropriate tests
        ↓
14. Verify dependency direction
```

Do not start by creating folders.

Start by identifying the use case and ownership of the behavior.

---

# 31. Refactoring Workflow

When refactoring an existing system:

```text
1. Inspect current structure
2. Inspect dependency graph
3. Identify actual architectural violations
4. Identify feature boundaries
5. Identify business logic placement
6. Define the smallest safe refactoring
7. Refactor incrementally
8. Run tests after each meaningful step
9. Remove obsolete abstractions
10. Verify final dependencies
```

Do not perform a large architecture rewrite when an incremental change can solve the problem.

---

# 32. Architecture Review Checklist

Before considering an implementation complete:

```text
[ ] Dependency direction is correct
[ ] Domain contains important business invariants
[ ] Application contains explicit use cases
[ ] Features are organized as coherent vertical slices
[ ] Commands represent state changes
[ ] Queries represent reads
[ ] Handlers orchestrate rather than contain all business logic
[ ] MediatR is used as a dispatcher, not as the architecture itself
[ ] Pipeline behaviors contain only cross-cutting concerns
[ ] Infrastructure implements appropriate abstractions
[ ] Presentation remains thin
[ ] Cross-feature coupling is intentional
[ ] No unnecessary repositories or abstractions were introduced
[ ] No unnecessary CQRS complexity was introduced
[ ] Tests exist at appropriate boundaries
[ ] Existing project conventions are respected
```

---

# 33. Agent Decision Rules

When uncertain where code belongs, follow this order:

### Step 1 — Is it a business invariant?

```text
Yes → Domain
```

### Step 2 — Is it application workflow?

```text
Yes → Application feature / Handler
```

### Step 3 — Is it a cross-cutting application concern?

```text
Yes → Pipeline Behavior
```

### Step 4 — Is it an external implementation detail?

```text
Yes → Infrastructure
```

### Step 5 — Is it protocol/transport handling?

```text
Yes → Presentation
```

### Step 6 — Does another feature need it?

Determine whether it should be:

```text
Shared domain behavior
Application abstraction
Domain event
Integration mechanism
```

Do not directly couple to another feature's internal implementation without justification.

---

# 34. Agent Behavior

When working with this architecture:

1. Inspect the existing repository before introducing structural changes.
2. Follow existing conventions when they are compatible with the architecture.
3. Treat Clean Architecture as dependency boundaries, not folder naming.
4. Organize Application code around vertical slices.
5. Use CQRS when it clarifies command/query intent.
6. Use MediatR as a dispatch mechanism, not as a substitute for architecture.
7. Keep business invariants in Domain.
8. Keep application orchestration in Handlers.
9. Keep infrastructure implementations outside the inner layers.
10. Use pipeline behaviors only for cross-cutting concerns.
11. Prefer feature cohesion over technical-folder organization.
12. Reuse meaningful abstractions before creating new ones.
13. Avoid generic repositories and service abstractions without a clear purpose.
14. Avoid unnecessary patterns and framework-driven architecture.
15. Keep features independently understandable.
16. Prefer small, incremental architectural changes.
17. Verify dependency direction after structural changes.
18. Run relevant tests after meaningful changes.

The objective is not to maximize the number of architectural patterns.

The objective is to produce a backend where **business rules are protected, use cases are explicit, features are cohesive, dependencies are controlled, and complexity remains proportional to the actual problem**.
