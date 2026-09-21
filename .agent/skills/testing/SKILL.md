---

name: testing
description: Design, implement, review, and maintain automated tests for .NET applications. Use when adding or modifying unit tests, integration tests, API tests, test fixtures, mocks, test data, database tests, or regression tests. Covers test strategy, test boundaries, xUnit, assertions, mocking, EF Core integration testing, HTTP API testing, test isolation, deterministic tests, and test quality. Project-agnostic and should follow the repository's existing testing conventions.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Testing

## 1. Purpose

This skill defines how an AI coding agent should design, implement, review, and maintain automated tests for .NET applications.

The objective is to produce tests that are:

* Correct.
* Deterministic.
* Isolated.
* Readable.
* Maintainable.
* Fast where appropriate.
* Representative of real application behavior.
* Resistant to implementation-detail changes.

The primary principle is:

```text
Test behavior and contracts,
not implementation details.
```

---

# 2. Testing Strategy

Use the appropriate test level for the behavior being verified.

```text
                    Tests
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Unit Test   Integration Test  API Test
        │             │             │
        ▼             ▼             ▼
     Isolated      Components      HTTP Contract
     logic         together        end-to-end
```

Prefer the lowest test level that can reliably verify the behavior.

Typical preference:

```text
Domain rule
    ↓
Unit test

Application handler
    ↓
Unit test or integration test depending on dependencies

EF Core persistence
    ↓
Integration test

HTTP endpoint
    ↓
API/integration test
```

Do not turn every test into an end-to-end test.

Do not mock infrastructure when the behavior being tested is specifically infrastructure behavior.

---

# 3. Repository First

Before creating tests:

1. Inspect the existing test projects.
2. Inspect test framework versions.
3. Inspect assertion libraries.
4. Inspect mocking libraries.
5. Inspect naming conventions.
6. Inspect fixtures.
7. Inspect integration-test infrastructure.
8. Follow existing conventions.

Look for:

```text
*.Tests.csproj
*.IntegrationTests.csproj
*.ApiTests.csproj
TestFixtures/
Fixtures/
Builders/
Factories/
```

Inspect package references.

Common libraries include:

```text
xUnit
NUnit
MSTest
FluentAssertions
Moq
NSubstitute
FakeItEasy
Testcontainers
Microsoft.AspNetCore.Mvc.Testing
```

Do not introduce a new testing library when the project already has an established equivalent.

---

# 4. Test Pyramid

Prefer a healthy distribution of tests:

```text
                 ┌───────────────┐
                 │  API / E2E    │
                 │   Few tests   │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │ Integration   │
                 │ Some tests    │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │     Unit      │
                 │  Many tests   │
                 └───────────────┘
```

This is a guideline, not a rigid numerical requirement.

The important principle is:

```text
Cheap tests → many
Expensive tests → targeted
```

---

# 5. What Should Be Tested?

Prioritize behavior that can fail and matters to the system.

Test:

* Business rules.
* Validation.
* State transitions.
* Authorization behavior.
* Application use cases.
* Important persistence behavior.
* API contracts.
* Error handling.
* Edge cases.
* Regression cases.
* Concurrency-sensitive behavior when relevant.

Do not create tests merely to increase coverage percentage.

---

# 6. What Should Not Be Tested Directly?

Avoid tests that merely verify framework behavior.

Usually do not test:

```text
.NET itself
EF Core itself
ASP.NET Core routing internals
Third-party library internals
Simple property getters/setters
```

Example:

```csharp
public string Name { get; set; }
```

does not normally require a dedicated test.

Test the application's behavior that uses the property.

---

# 7. Unit Tests

A unit test should isolate the behavior under test.

Typical characteristics:

* Fast.
* Deterministic.
* No real network.
* No real database.
* Minimal external dependencies.

Example structure:

```text
Arrange
   ↓
Act
   ↓
Assert
```

Prefer one logical behavior per test.

---

# 8. Unit Test Naming

Test names should explain:

```text
What
When
Expected result
```

Examples:

```text
CreateStudent_WithValidData_CreatesStudent

CreateStudent_WhenEmailAlreadyExists_ReturnsConflict

EnrollStudent_WhenClassIsFull_RejectsEnrollment

CalculateFee_WhenAttendanceIsAbsent_IncludesAttendanceInFee
```

Avoid:

```text
Test1
Works
ShouldWork
TestCreate
```

The test name should be understandable without opening the implementation.

---

# 9. Arrange Act Assert

Prefer explicit AAA structure.

Example:

```csharp
// Arrange
var command = ...;

// Act
var result = await handler.Handle(command, cancellationToken);

// Assert
result.Should().Be(...);
```

Keep the three phases visually understandable.

Do not create excessive helper abstractions that hide the actual behavior being tested.

---

# 10. One Behavior Per Test

Prefer:

```text
CreateStudent_WithValidData_CreatesStudent
CreateStudent_WithDuplicateEmail_ReturnsConflict
CreateStudent_WithMissingName_ReturnsValidationError
```

over one giant test:

```text
CreateStudent_TestEverything
```

A test should fail for a meaningful reason.

---

# 11. Test the Contract

Prefer asserting observable behavior.

Good:

```csharp
result.IsSuccess.Should().BeFalse();
result.Error.Code.Should().Be("Student.DuplicateEmail");
```

Less desirable:

```csharp
handler._repository.SomeInternalMethod.Should().HaveBeenCalled();
```

unless that interaction is itself part of the contract being verified.

---

# 12. Avoid Testing Implementation Details

Do not couple tests unnecessarily to:

* Private methods.
* Internal variable names.
* Exact internal call order.
* Internal helper classes.
* Number of LINQ operations.
* Specific implementation structure.

If implementation changes while behavior remains correct, tests should generally continue passing.

---

# 13. Assertions

Assertions should be precise.

Prefer:

```csharp
result.Should().NotBeNull();
result.Id.Should().NotBeEmpty();
result.Name.Should().Be("Nguyen");
```

over vague assertions that verify too little.

When using FluentAssertions, use its domain-specific assertions where they improve readability.

Example:

```csharp
result.Should().BeEquivalentTo(expected);
```

when structural equivalence is what matters.

Do not use broad equivalence assertions when only one important property matters.

---

# 14. Assertion Quality

Avoid tests that can pass while the feature is broken.

Weak:

```csharp
result.Should().NotBeNull();
```

when the actual requirement is:

```text
Student must be created with the correct ID and name.
```

Prefer:

```csharp
result.Id.Should().NotBeEmpty();
result.Name.Should().Be(expectedName);
```

Assertions should verify the important contract.

---

# 15. Testing Exceptions

When an exception is part of the expected behavior, assert it explicitly.

Example:

```csharp
var action = () => service.DoSomething();

await action.Should()
    .ThrowAsync<SomeException>();
```

Also verify important exception information when it is part of the contract.

Do not write:

```csharp
await action.Should().ThrowAsync<Exception>();
```

when a more specific exception is expected.

---

# 16. Testing Result-Based Errors

If the application uses Result/Error objects instead of exceptions, assert the actual failure contract.

Example:

```text
Success = false
Error.Code = "Student.NotFound"
```

Do not convert every expected business failure into an exception merely to make testing easier.

Follow the application's established error-handling model.

---

# 17. Parameterized Tests

Use parameterized tests when multiple inputs verify the same logical behavior.

Example:

```text
Input      Expected
0          false
1          true
10         true
-1         false
```

Avoid duplicating nearly identical tests when parameterization makes the behavior clearer.

Do not parameterize unrelated behaviors merely to reduce line count.

---

# 18. Boundary and Edge Cases

For important business logic, test:

```text
Minimum
Maximum
Empty
Null where valid
Invalid
Boundary transitions
Duplicate values
Large values
```

Example:

```text
Age = 17
Age = 18
Age = 19
```

if 18 is a business boundary.

Do not test arbitrary values without a reason.

---

# 19. Domain Testing

Domain tests should focus heavily on business invariants.

Example:

```text
Enrollment
├── Cannot enroll inactive student
├── Cannot enroll into full class
├── Cannot duplicate active enrollment
└── Can cancel active enrollment
```

These rules should be tested independently from:

* HTTP.
* EF Core.
* PostgreSQL.
* Controllers.

This makes domain tests fast and precise.

---

# 20. Application Testing

Application tests should verify use-case behavior.

Example:

```text
CreateEnrollmentHandler
    ↓
Valid command
    ↓
Student exists
    ↓
Class available
    ↓
Enrollment created
    ↓
Expected result
```

Also test important failure paths:

```text
Student not found
Class not found
Already enrolled
Class full
Unauthorized operation
Validation failure
```

Do not test every internal method call.

---

# 21. Mocking

Mock only meaningful external dependencies.

Common candidates:

```text
External API
Email service
Clock
Message publisher
Payment gateway
Repository abstraction
```

depending on the architecture.

Do not mock pure business logic.

---

# 22. Avoid Mock Everything

Do not write tests like:

```text
Mock A
Mock B
Mock C
Mock D
Mock E
```

until the test no longer represents real application behavior.

Excessive mocking produces tests that verify:

```text
"Did I call the implementation correctly?"
```

instead of:

```text
"Does the feature behave correctly?"
```

Prefer real objects for simple, deterministic dependencies.

---

# 23. Mock Verification

Verify interactions only when the interaction matters.

For example:

```text
Payment must be requested exactly once.
```

Interaction verification may be appropriate.

But do not verify every getter, setter, or repository call simply because the mocking framework allows it.

Avoid brittle tests such as:

```text
Verify method A
Verify method B
Verify method C
Verify exact order
Verify exact number of internal calls
```

unless those interactions are contractually important.

---

# 24. Time-Dependent Tests

Do not use uncontrolled system time in tests when time affects behavior.

Avoid relying directly on:

```csharp
DateTime.UtcNow
```

inside business logic.

Prefer an injectable abstraction or clock mechanism.

Then tests can control:

```text
Current time
Expiration time
Date boundaries
Time zones
```

This produces deterministic tests.

---

# 25. Randomness

Avoid uncontrolled randomness in tests.

Bad:

```csharp
var id = Guid.NewGuid();
var amount = Random.Shared.Next();
```

when the test outcome depends on those values.

Use deterministic test data unless randomness is specifically what is being tested.

If random testing/property-based testing is intentionally used, control seeds and make failures reproducible.

---

# 26. Test Isolation

Tests should not depend on execution order.

Bad:

```text
Test A creates user
Test B expects user created by Test A
```

Every test should establish the state it requires.

Do not rely on:

```text
global static state
shared mutable objects
test execution order
previous test database state
```

unless the testing framework explicitly manages that state safely.

---

# 27. Test Data

Use realistic but minimal data.

Prefer:

```text
Student:
Id
Name
Email
```

when those are the only fields relevant to the behavior.

Do not construct massive object graphs for every test unless the behavior requires them.

---

# 28. Test Builders

Test builders/factories can simplify repeated complex test data.

Example:

```text
StudentBuilder
EnrollmentBuilder
OrderBuilder
```

Use builders when they improve readability.

Avoid builders that hide critical test setup.

Bad:

```text
new StudentBuilder().DefaultEverything().Build()
```

when the reader cannot tell which values matter.

Prefer explicit overrides:

```text
StudentBuilder
    .WithEmail("existing@example.com")
    .Build()
```

---

# 29. Integration Tests

Integration tests verify multiple components working together.

Examples:

```text
Application
+
EF Core
+
Database
```

or:

```text
ASP.NET Core
+
Application
+
Infrastructure
```

Use integration tests when unit tests cannot reliably verify the behavior.

---

# 30. EF Core Integration Tests

When testing EF Core persistence behavior, prefer testing against a database provider that behaves like the real production database.

If production uses PostgreSQL, a PostgreSQL-backed integration test environment is generally more representative than replacing it with an unrelated provider.

Possible approaches:

```text
Testcontainers
Dedicated test PostgreSQL
Docker-based database
```

Follow the project's infrastructure.

---

# 31. Avoid InMemory Provider for Relational Semantics

Do not automatically use:

```text
Microsoft.EntityFrameworkCore.InMemory
```

to test relational database behavior.

The InMemory provider does not behave like a relational database in important ways.

It may differ in:

* SQL translation.
* Constraints.
* Transactions.
* Relational semantics.
* Query behavior.

Use a real relational provider when testing persistence behavior.

---

# 32. SQLite in Tests

SQLite can be useful for some tests, but it is not automatically equivalent to PostgreSQL or SQL Server.

Provider differences may affect:

* SQL syntax.
* Data types.
* Constraints.
* Functions.
* Transactions.
* JSON behavior.
* Enum behavior.
* Date/time semantics.

If provider-specific behavior matters, use the actual provider.

---

# 33. Testcontainers

When supported by the project, Testcontainers can provide realistic disposable infrastructure.

Conceptually:

```text
Test
  ↓
Start PostgreSQL container
  ↓
Apply schema
  ↓
Run test
  ↓
Dispose container
```

Benefits:

* Real database behavior.
* Isolation.
* Reproducibility.
* Environment consistency.

Do not introduce Testcontainers into a project without considering setup cost and existing conventions.

---

# 34. Database Isolation

Integration tests must avoid contaminating one another.

Possible strategies:

```text
Separate database per test
Separate schema
Transaction rollback
Database reset
Container per test class
Container per test suite
```

Choose based on:

* Test speed.
* Isolation requirements.
* Database behavior.
* Parallel execution.

---

# 35. Transactions in Tests

Transactions can be useful for isolating database state.

However, do not assume all application/database behavior can be correctly tested inside a rolled-back transaction.

For example:

* Background jobs.
* Separate connections.
* External processes.
* Commit-specific behavior.

may escape the transaction.

Use the isolation strategy that matches the behavior under test.

---

# 36. API Tests

API tests should verify HTTP-level behavior.

Test:

```text
HTTP method
Route
Request
Authentication
Authorization
Status code
Response body
Validation
Error contract
```

Example:

```text
POST /api/students
    ↓
201 Created
    ↓
Response contains student identifier
```

Do not test internal handler implementation through an API test.

---

# 37. ASP.NET Core Integration Testing

When appropriate, use:

```text
WebApplicationFactory
```

or the project's equivalent integration infrastructure.

Typical flow:

```text
HTTP Client
    ↓
ASP.NET Core pipeline
    ↓
Endpoint
    ↓
Application
    ↓
Infrastructure
    ↓
Database
```

This is useful for validating actual application wiring.

---

# 38. Authentication Tests

For protected endpoints, test at least:

```text
Unauthenticated → 401
Authenticated but unauthorized → 403
Authorized → expected success
```

Do not only test the happy path.

If the API uses roles/policies, verify important authorization boundaries.

---

# 39. Validation Tests

Test validation at the correct boundary.

Examples:

```text
Missing required field → 400
Invalid format → 400
Invalid business state → appropriate business error
```

Do not duplicate the same validation test across every layer unless each layer has a distinct responsibility.

---

# 40. API Error Contract

If the API defines a consistent error format, test it.

For example:

```json
{
  "type": "...",
  "title": "...",
  "status": 400,
  "errors": {}
}
```

The exact contract depends on the application.

Verify:

* HTTP status.
* Error code/type.
* Important fields.
* Validation details where applicable.

Avoid asserting irrelevant serialization details.

---

# 41. Regression Tests

Whenever fixing a bug:

```text
Bug
 ↓
Reproduce
 ↓
Write failing test
 ↓
Fix implementation
 ↓
Test passes
```

The regression test should fail against the buggy behavior and pass against the corrected behavior.

Do not fix a bug without considering whether a regression test is appropriate.

---

# 42. Test-Driven Development

TDD is optional, not mandatory.

Use:

```text
Red
 ↓
Green
 ↓
Refactor
```

when it improves development.

Do not mechanically force TDD for every trivial change.

The important requirement is that meaningful behavior has reliable tests.

---

# 43. Coverage

Code coverage is a signal, not the goal.

High coverage does not guarantee correctness.

Prioritize:

```text
Business-critical behavior
+
Failure paths
+
Security boundaries
+
Persistence behavior
+
Regression cases
```

Do not write meaningless tests merely to increase coverage.

---

# 44. Mutation of Test Quality

A test should be capable of detecting meaningful implementation mistakes.

Ask:

```text
If the implementation were subtly broken,
would this test fail?
```

If not, the test may be too weak.

Examples of weak tests:

```text
Only assert object is not null.
Only assert HTTP response exists.
Only assert no exception occurred.
Only verify a mock was called.
```

Strengthen assertions around the actual contract.

---

# 45. Test Determinism

A test should produce the same result under the same conditions.

Avoid dependencies on:

```text
Current time
Random values
Machine hostname
Local filesystem state
Developer database
Network availability
Execution order
Environment-specific configuration
```

unless those dependencies are explicitly controlled.

---

# 46. Parallel Test Execution

Tests should be safe to run in parallel unless they intentionally share isolated resources.

Avoid:

```text
static mutable state
shared mutable database state
shared files
shared ports
shared external resources
```

If parallel execution is unsafe, isolate the resource or explicitly configure appropriate test execution behavior.

Do not disable parallelization as the first solution.

---

# 47. External Services

Do not make normal automated tests depend on live external services unless the test is explicitly an external integration test.

Instead use:

```text
Mock
Stub
Fake
Local container
Test server
Recorded deterministic response
```

depending on what behavior is being tested.

Tests should not randomly fail because a third-party API is unavailable.

---

# 48. Test Environment Configuration

Never hard-code production credentials into tests.

Use:

```text
Environment variables
Test configuration
Secrets management
Disposable test infrastructure
```

Test configuration should be safe to commit when possible.

Never commit real secrets merely because tests need them.

---

# 49. Test Cleanup

Tests that create resources must clean them up.

Examples:

```text
Database records
Temporary files
Containers
Ports
Background processes
External resources
```

Prefer framework-managed lifecycle mechanisms.

Do not depend on manual cleanup by the developer.

---

# 50. Integration Test Performance

Integration tests are intentionally slower than unit tests.

Optimize when necessary by:

* Reusing expensive infrastructure safely.
* Reducing unnecessary setup.
* Keeping test data minimal.
* Avoiding redundant migrations.
* Running only relevant tests during development.

Do not compromise test isolation merely for speed.

---

# 51. Test Project Structure

A possible structure:

```text
tests/
├── Unit/
│   ├── Domain/
│   └── Application/
│
├── Integration/
│   ├── Persistence/
│   └── Application/
│
└── Api/
    └── Endpoints/
```

However, follow the repository's existing structure.

Vertical-slice projects may instead organize tests around features:

```text
Features/
└── Enrollment/
    ├── CreateEnrollment/
    │   ├── Handler.cs
    │   └── HandlerTests.cs
    └── CancelEnrollment/
        ├── Handler.cs
        └── HandlerTests.cs
```

Architecture determines the preferred organization.

---

# 52. Test Dependencies

Keep test dependencies intentional.

Typical:

```text
Production
    ↓
Test project
    ├── xUnit
    ├── FluentAssertions
    ├── Mocking library
    ├── ASP.NET Core testing
    └── Testcontainers
```

Do not add dependencies merely because they are popular.

Prefer the tools already used by the project.

---

# 53. Build and Test Verification

After implementing tests:

```bash
dotnet build
dotnet test
```

When appropriate:

```bash
dotnet test --no-restore
```

Run targeted tests during development, then run the broader test suite before completion when practical.

If tests fail:

```text
Do not simply weaken the test.
```

Determine whether:

```text
Implementation is wrong
Test is wrong
Test environment is wrong
Existing behavior changed intentionally
```

---

# 54. Test Failure Investigation

When a test fails:

```text
1. Read the failure.
2. Identify the actual vs expected result.
3. Inspect the test.
4. Inspect the implementation.
5. Determine whether the test expectation is correct.
6. Fix the underlying issue.
7. Re-run the test.
8. Run related tests.
```

Do not change expected values merely to make the test pass.

---

# 55. Flaky Tests

A test that sometimes passes and sometimes fails is a defect in the test suite.

Investigate:

```text
Timing
Concurrency
Shared state
Randomness
External services
Database state
Ordering
Resource cleanup
```

Do not hide flaky tests by:

```text
Retrying indefinitely
Ignoring failures
Disabling the test
Increasing arbitrary delays
```

Retries may be appropriate only for explicitly understood infrastructure-level transient failures.

---

# 56. Testing Checklist

Before completing a feature:

```text
[ ] Main behavior is tested
[ ] Important failure paths are tested
[ ] Boundary cases are considered
[ ] Tests are deterministic
[ ] Tests are isolated
[ ] Assertions verify meaningful behavior
[ ] No unnecessary mocking
[ ] No implementation-detail coupling
[ ] Persistence behavior uses an appropriate provider
[ ] API behavior is tested at the HTTP boundary when appropriate
[ ] Authentication/authorization boundaries are tested when relevant
[ ] Regression test exists for important bug fixes
[ ] No real secrets are used
[ ] Tests pass locally
```

---

# 57. Agent Workflow

When implementing a feature:

```text
Understand requirement
        ↓
Identify behavior
        ↓
Choose test level
        ↓
Write/update test
        ↓
Implement behavior
        ↓
Run targeted tests
        ↓
Run related tests
        ↓
Run broader suite
        ↓
Review test quality
```

When fixing a bug:

```text
Reproduce
   ↓
Regression test
   ↓
Fix
   ↓
Test
   ↓
Review
```

---

# 58. Decision Matrix

Use this as a general guide:

| Scenario                  | Preferred Test                       |
| ------------------------- | ------------------------------------ |
| Pure business rule        | Unit                                 |
| Value object behavior     | Unit                                 |
| Domain invariant          | Unit                                 |
| Application orchestration | Unit / Integration                   |
| EF Core mapping           | Integration                          |
| PostgreSQL constraint     | Integration                          |
| Transaction behavior      | Integration                          |
| Concurrency behavior      | Integration                          |
| HTTP status code          | API                                  |
| Request validation        | API / Unit                           |
| Authentication            | API                                  |
| Authorization             | API / Application                    |
| Serialization contract    | API                                  |
| External API adapter      | Unit + Integration where appropriate |
| Bug fix                   | Regression test at appropriate level |

---

# 59. Non-Negotiable Rules

```text
1. Test behavior, not implementation details.
2. Use the lowest test level that reliably verifies the behavior.
3. Do not mock everything.
4. Do not use EF Core InMemory as a universal replacement for a relational database.
5. Use the real database provider when provider-specific behavior matters.
6. Tests must be deterministic.
7. Tests must be isolated.
8. Do not depend on test execution order.
9. Do not weaken assertions merely to make tests pass.
10. Do not modify expected results without understanding the failure.
11. Important business rules require meaningful tests.
12. Important failure paths require tests.
13. Bug fixes should normally include regression tests.
14. Do not commit real credentials or secrets.
15. Do not make normal automated tests depend on live external services.
16. Avoid excessive mocking and interaction verification.
17. Avoid tests coupled to private implementation details.
18. Keep test data minimal and explicit.
19. Prefer realistic integration infrastructure when persistence behavior matters.
20. Coverage is a metric, not the objective.
```

---

# 60. Final Principle

Good tests should make the system safer to change.

The ideal test suite provides:

```text
Fast feedback
+
Behavior confidence
+
Regression protection
+
Clear documentation
+
Safe refactoring
```

The goal is not:

```text
Maximum number of tests
```

and not:

```text
Maximum code coverage
```

The goal is:

```text
Maximum confidence
per meaningful test.
```
