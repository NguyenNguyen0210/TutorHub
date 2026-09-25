---

name: code-quality
description: Review, improve, refactor, and maintain code quality across software projects. Use when reviewing code, refactoring, identifying code smells, improving readability, reducing complexity, removing duplication, enforcing consistency, evaluating abstractions, naming, dependency usage, error handling, maintainability, and technical debt. Project-agnostic and should respect the project's architecture, language, framework, testing, and database conventions.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Code Quality

## 1. Purpose

This skill defines how an AI coding agent should evaluate and improve code quality across a software project.

The objective is to produce code that is:

* Correct.
* Readable.
* Maintainable.
* Consistent.
* Cohesive.
* Loosely coupled where appropriate.
* Explicit.
* Testable.
* Easy to change.
* Proportional to the problem.

The primary principle is:

```text
Good code is code that is easy to understand,
safe to change, and appropriate for its context.
```

Code quality is not measured by:

* Number of abstractions.
* Number of design patterns.
* Number of lines reduced.
* Maximum code coverage.
* Maximum number of interfaces.
* Maximum use of language features.

---

# 2. Scope

This skill covers:

```text
Naming
Readability
Complexity
Cohesion
Coupling
Duplication
Abstraction
Error handling
Dependency management
Code organization
Maintainability
Refactoring
Technical debt
Consistency
Dead code
Comments
Logging
Configuration
Performance-related code smells
Security-related code smells
```

This skill does not replace:

```text
architecture
dotnet-efcore
postgresql
testing
git-workflow
```

Those skills own their respective technical decisions.

When a concern belongs to another skill, follow that skill instead of duplicating its rules.

---

# 3. Repository First

Before reviewing or refactoring code:

1. Inspect the project structure.
2. Identify the language and framework.
3. Read existing architecture conventions.
4. Inspect representative existing code.
5. Identify naming conventions.
6. Identify formatting conventions.
7. Inspect test conventions.
8. Inspect static-analysis configuration.
9. Check analyzers and compiler warnings.
10. Avoid introducing a style inconsistent with the repository.

Look for:

```text
.editorconfig
Directory.Build.props
Directory.Build.targets
global.json
*.editorconfig
lint configuration
analyzer configuration
style configuration
```

For .NET projects, inspect:

```text
Nullable
TreatWarningsAsErrors
AnalysisLevel
Roslyn analyzers
StyleCop
SonarAnalyzer
Meziantou.Analyzer
```

Do not impose external style preferences when the project already has established conventions.

---

# 4. Quality Hierarchy

When evaluating code, prioritize:

```text
1. Correctness
2. Security
3. Data integrity
4. Maintainability
5. Readability
6. Testability
7. Performance
8. Style
```

Do not sacrifice correctness for stylistic consistency.

Do not perform cosmetic refactoring when a correctness issue exists.

---

# 5. Correctness First

Before improving style, ask:

```text
Does the code actually do what it is supposed to do?
```

Check:

```text
Business behavior
Edge cases
Null handling
Error handling
Concurrency
State transitions
Boundary conditions
Resource lifetime
Data consistency
```

A beautifully formatted incorrect implementation is still bad code.

---

# 6. Readability

Code should be understandable without requiring the reader to mentally simulate unnecessary complexity.

Prefer:

```csharp
if (student.IsActive)
{
    Enroll(student);
}
```

over unnecessarily compressed expressions when readability suffers.

Do not optimize for minimum line count.

Optimize for clarity.

---

# 7. Naming

Names should communicate intent.

Prefer:

```text
student
enrollment
classSession
attendanceRecord
expirationTime
```

over:

```text
x
obj
data
item
tmp
foo
```

Use domain terminology consistently.

Do not rename established domain terminology merely because another name seems more elegant.

---

# 8. Boolean Naming

Boolean names should read naturally.

Prefer:

```text
isActive
hasPermission
canEnroll
shouldRetry
isExpired
```

Avoid ambiguous names:

```text
status
flag
check
value
```

when the property is actually boolean.

---

# 9. Method Naming

Methods should describe actions or meaningful operations.

Prefer:

```text
CreateEnrollment
CancelEnrollment
CalculateFee
ValidatePayment
RefreshToken
```

Avoid generic names:

```text
Process
HandleData
ExecuteStuff
DoIt
Manage
Run
```

unless the surrounding context makes the meaning unambiguous.

---

# 10. Class Naming

A class should have a clear responsibility and a meaningful name.

Prefer:

```text
EnrollmentService
CreateEnrollmentHandler
StudentRepository
JwtTokenService
```

when those names accurately describe their responsibilities.

Avoid meaningless suffixes:

```text
Manager
Helper
Utility
Processor
Handler
Service
```

when the name does not communicate actual responsibility.

Do not remove suffixes merely for stylistic reasons if the project's conventions use them consistently.

---

# 11. Single Responsibility

A component should have a coherent responsibility.

A class becomes suspicious when it handles unrelated concerns such as:

```text
HTTP
Business rules
Database access
Email
Logging
File processing
Authentication
```

all together.

Do not interpret Single Responsibility as:

```text
One class = one method
```

The goal is cohesive responsibility, not artificial fragmentation.

---

# 12. Method Size

Large methods are often a signal of excessive responsibility.

A long method is not automatically bad.

Ask:

```text
Can the method be understood easily?
Does it have multiple distinct responsibilities?
Are there nested branches?
Are important steps hidden?
```

Extract methods when doing so improves semantic clarity.

Do not split code into tiny methods that make the overall flow harder to follow.

---

# 13. Nesting

Deep nesting increases cognitive load.

Watch for:

```text
if
  if
    if
      if
        ...
```

Prefer guard clauses when they improve readability.

Example:

```csharp
if (!student.IsActive)
{
    return Result.Failure(...);
}

if (classSession.IsFull)
{
    return Result.Failure(...);
}

Enroll(student, classSession);
```

instead of deeply nested branches.

Do not use guard clauses mechanically when the nested structure communicates the logic better.

---

# 14. Cyclomatic Complexity

High branching complexity is a maintainability risk.

Watch for:

```text
if/else chains
switch statements
nested conditions
multiple boolean expressions
loops with nested conditions
```

When complexity becomes difficult to reason about:

```text
Extract decision
Extract policy
Use domain abstraction
Simplify conditions
```

Do not replace a simple conditional with an elaborate pattern merely to reduce a complexity metric.

---

# 15. Boolean Expressions

Complex boolean expressions should communicate intent.

Bad:

```csharp
if (a && b && !c || d && e)
```

Prefer named conditions when the logic is meaningful:

```csharp
var canEnroll = student.IsActive
    && !enrollmentExists
    && !classSession.IsFull;
```

This makes the business rule visible.

---

# 16. Duplication

Do not automatically remove every repeated line.

First determine whether the duplication is:

```text
Accidental duplication
Intentional duplication
Domain repetition
Similar but independently evolving behavior
```

Extract shared logic when:

* The behavior is genuinely identical.
* Changes should happen together.
* The abstraction has a clear owner.

Do not create abstractions merely because two pieces of code look similar.

---

# 17. Rule of Three

A practical guideline:

```text
1 occurrence → keep simple
2 occurrences → evaluate
3+ occurrences → strongly consider abstraction
```

This is not a hard rule.

Context matters more than the number three.

---

# 18. Abstraction

Before introducing an abstraction, ask:

```text
What problem does this abstraction solve?
Who owns it?
What variation does it represent?
Will it reduce coupling?
Will it improve maintainability?
```

Avoid abstraction for abstraction's sake.

Bad:

```text
IStudentService
StudentService
IStudentManager
StudentManager
IStudentProcessor
StudentProcessor
```

when the application only needs one simple operation.

---

# 19. Premature Abstraction

Do not predict every possible future requirement.

Avoid designing for hypothetical scenarios such as:

```text
Maybe we will support another database.
Maybe we will support another payment provider.
Maybe we will switch frameworks.
Maybe we will have ten implementations.
```

unless the requirement actually exists.

Prefer the simplest design that supports known requirements.

---

# 20. Overengineering

Signs of overengineering include:

```text
Too many layers
Too many interfaces
Too many factories
Generic repositories everywhere
Unnecessary design patterns
Excessive configuration
Excessive indirection
Abstractions with one implementation and no meaningful boundary
```

Ask:

```text
Does this complexity buy us something?
```

If not, simplify.

---

# 21. Design Patterns

Use design patterns when they solve a real problem.

Appropriate:

```text
Strategy
Factory
Decorator
Adapter
Specification
Builder
```

when the problem actually requires them.

Do not force patterns into simple code.

Pattern usage is not evidence of code quality.

---

# 22. Dependency Direction

Dependencies should flow according to the project's architecture.

For a Clean Architecture project, follow the `architecture` skill.

Do not introduce dependencies merely because they make implementation convenient.

Example of a suspicious dependency:

```text
Domain
  ↓
Infrastructure
```

if the architecture explicitly prohibits that dependency.

Architecture violations are code-quality problems, but the architecture skill owns the exact architectural rules.

---

# 23. Coupling

High coupling makes changes expensive.

Watch for components that depend directly on:

```text
Many concrete classes
Infrastructure details
Database implementation
External API details
Framework-specific details
```

Prefer meaningful boundaries where they reduce coupling.

Do not introduce interfaces for every dependency automatically.

---

# 24. Cohesion

A component should contain things that naturally belong together.

High cohesion:

```text
Enrollment
├── enrollment state
├── enrollment rules
└── enrollment behavior
```

Low cohesion:

```text
CommonService
├── enrollment
├── email
├── payments
├── logging
└── file operations
```

Avoid "god classes."

---

# 25. God Classes

A god class often:

* Has many dependencies.
* Has many unrelated methods.
* Knows too much.
* Changes for many unrelated reasons.
* Coordinates too many concerns.

When found:

```text
Identify responsibilities
→ Group related behavior
→ Extract cohesive components
→ Preserve behavior
→ Add/update tests
```

Do not split a class blindly by line count.

---

# 26. God Methods

A god method often:

```text
Validates
Queries database
Transforms data
Calculates business rules
Sends email
Updates state
Logs
Builds response
```

all at once.

Separate responsibilities according to architecture and actual boundaries.

---

# 27. Feature Cohesion

When the project uses Vertical Slice Architecture, prefer organizing related code around features.

For example:

```text
Features/
└── Enrollment/
    ├── CreateEnrollment/
    ├── CancelEnrollment/
    └── GetEnrollment/
```

Do not move code into generic folders merely because it is reusable.

Follow the `architecture` skill.

---

# 28. Comments

Prefer self-explanatory code.

Good comments explain:

```text
Why
Constraint
Trade-off
Non-obvious behavior
External limitation
```

Bad comments merely restate code.

Bad:

```csharp
// Increment count
count++;
```

Good:

```csharp
// The external provider may retry this request,
// so the operation must remain idempotent.
```

---

# 29. Comments Should Not Preserve Wrong Code

Never keep incorrect code merely because a comment explains it.

If code is confusing:

```text
First try to make the code clearer.
```

Use comments for information that cannot be expressed cleanly through code.

---

# 30. TODO Comments

Do not add vague TODOs such as:

```text
TODO: improve this
TODO: fix later
TODO: refactor
```

If a TODO is necessary, make it actionable:

```text
TODO: Replace polling with webhook integration when provider API supports it.
```

Avoid creating TODOs as a substitute for completing the requested work.

---

# 31. Dead Code

Remove code that is demonstrably unused when safe.

Examples:

```text
Unused methods
Unused variables
Unused dependencies
Unused imports
Unreachable branches
Obsolete configuration
Commented-out code
```

Do not delete apparently unused public APIs without checking whether external consumers depend on them.

---

# 32. Commented-Out Code

Do not keep large blocks of old code commented out.

Use version control to preserve history.

Bad:

```csharp
// var oldImplementation = ...
// ...
// ...
```

Delete obsolete code unless there is a specific documented reason to retain it.

---

# 33. Magic Numbers

Avoid unexplained literals.

Bad:

```csharp
if (retryCount > 3)
```

when `3` has domain significance.

Prefer:

```csharp
const int MaxRetryAttempts = 3;
```

or appropriate configuration/domain representation.

Do not extract every literal into a constant.

---

# 34. Magic Strings

Avoid repeated strings representing important identifiers.

Examples:

```text
Role names
Error codes
Configuration keys
Event names
Status values
Claim names
```

Use appropriate constants, enums, strongly typed configuration, or domain representations when justified.

Do not create a constant for every ordinary user-facing string.

---

# 35. Stringly-Typed Design

Be cautious when important domain concepts are represented as arbitrary strings.

Instead of:

```csharp
string status
```

consider an appropriate:

```text
enum
value object
strongly typed identifier
domain type
```

when the concept has meaningful semantics.

Do not replace simple strings with complex types without a real benefit.

---

# 36. Null Handling

Nullability should be intentional.

Avoid:

```csharp
if (x != null)
{
    ...
}
```

everywhere simply because the type model is weak.

Prefer making invalid states difficult to represent where appropriate.

Do not use null-forgiving operators to silence warnings without understanding the invariant.

---

# 37. Error Handling

Errors should be handled at meaningful boundaries.

Avoid:

```text
catch everything
return null
ignore exception
swallow failure
```

Bad:

```csharp
try
{
    ...
}
catch
{
}
```

This hides failures and makes debugging difficult.

If an exception cannot be handled meaningfully, let the appropriate higher-level boundary handle it.

---

# 38. Exception Context

When rethrowing or translating exceptions, preserve useful context.

Avoid losing the original exception:

```csharp
throw new Exception(ex.Message);
```

Prefer mechanisms that preserve the original exception as an inner exception when translation is appropriate.

Do not expose internal exception details directly to API clients.

---

# 39. Logging Quality

Logs should answer:

```text
What happened?
Which entity/request?
What was the relevant context?
What severity?
```

Prefer structured logging.

Avoid:

```text
Log everything
Log sensitive data
Log passwords/tokens
Log the same exception repeatedly at every layer
```

Log errors at the boundary where they are handled when possible.

---

# 40. Resource Management

Resources must have clear ownership.

Examples:

```text
Database connections
Streams
File handles
HTTP resources
CancellationTokenSource
Timers
```

Use appropriate disposal patterns.

For .NET:

```text
IDisposable
IAsyncDisposable
using
await using
```

when appropriate.

Do not manually dispose dependencies owned by the DI container.

---

# 41. Async Quality

Avoid:

```text
async void
blocking .Result
blocking .Wait()
unnecessary Task.Run
```

Prefer asynchronous APIs end-to-end for I/O-bound operations.

Follow `dotnet-efcore` for detailed .NET async rules.

---

# 42. Cancellation

Long-running or I/O-bound operations should support cancellation where appropriate.

Do not accept a `CancellationToken` and then ignore it throughout the operation.

Propagate it to supported dependencies.

---

# 43. Dependency Lifetime Quality

For .NET projects, ensure dependency lifetimes are intentional.

Watch for:

```text
Singleton → Scoped dependency
Long-lived object → request-scoped object
```

These can cause correctness and lifetime problems.

Detailed .NET dependency rules belong to `dotnet-efcore`.

---

# 44. API Boundary Quality

API endpoints should expose a clear contract.

Check:

```text
Request model
Response model
Status code
Error contract
Validation
Authentication
Authorization
```

Avoid exposing persistence entities directly when doing so creates an unstable or inappropriate API contract.

Follow the project's API and architecture conventions.

---

# 45. DTO Quality

DTOs should represent actual transport/query requirements.

Avoid DTOs that:

```text
Expose every database column
Contain unrelated fields
Duplicate entire entities without purpose
```

Prefer focused DTOs.

Do not create a DTO for every internal object automatically.

---

# 46. Mapping

Mapping between objects should be explicit enough to understand.

Avoid huge opaque mapping configurations where business behavior is hidden.

For complex mappings, explicit code can be clearer than automatic mapping.

Follow the project's established mapping approach.

---

# 47. Collections

Avoid exposing mutable collections unnecessarily.

Prefer appropriate collection abstractions:

```text
IReadOnlyCollection<T>
IReadOnlyList<T>
IEnumerable<T>
```

when callers should not modify internal state.

Use mutable collections when mutation is intentionally part of the API.

---

# 48. Immutability

Prefer immutable data where mutation is unnecessary.

Benefits:

```text
Predictability
Thread safety
Reduced accidental state changes
Easier reasoning
```

Do not force immutability into inherently stateful domain models.

---

# 49. Side Effects

Make important side effects visible.

Examples:

```text
Database write
Email
Payment
Message publication
External API call
File operation
```

Avoid hiding significant side effects inside methods that appear to be pure calculations.

Bad:

```csharp
CalculateFee()
```

which silently:

```text
calculates
writes database
sends email
```

A method name should not conceal major side effects.

---

# 50. Pure Functions

Prefer pure functions for calculations and transformations when practical.

Example:

```text id="quofxj"
Input
 ↓
Calculation
 ↓
Output
```

Pure code is easier to:

* Understand.
* Test.
* Reuse.
* Reason about.

Do not force pure functional style where it makes the domain model unnatural.

---

# 51. State Mutation

Make state transitions explicit.

Avoid scattered mutations:

```text
entity.Status = ...
entity.Value = ...
entity.Flag = ...
```

throughout unrelated code.

When domain behavior matters, encapsulate meaningful state transitions according to the architecture.

---

# 52. Immutability vs Domain Behavior

Do not make domain entities immutable merely because immutable objects are fashionable.

If an entity has meaningful state transitions:

```text
Enroll
Cancel
Activate
Deactivate
Approve
Reject
```

those transitions should remain explicit.

---

# 53. Repeated Conditional Logic

If the same business decision appears in multiple places:

```text
if active
if active
if active
```

consider whether the decision belongs in:

```text
Domain behavior
Specification
Policy
Reusable predicate
```

Do not blindly extract conditions into utility classes.

---

# 54. Utility Classes

Avoid generic utility classes such as:

```text
StringHelper
DateHelper
CommonUtils
GeneralUtility
```

when methods have unrelated responsibilities.

Prefer cohesive components:

```text
DateRangeCalculator
PasswordHasher
SlugGenerator
```

when they represent a meaningful concept.

---

# 55. Static Methods

Static methods are appropriate for:

* Pure functions.
* Stateless transformations.
* Constants/helpers with clear semantics.

Do not use static methods to bypass dependency injection or hide dependencies.

Avoid static global state.

---

# 56. Global State

Global mutable state is a major maintainability risk.

Avoid:

```text
static mutable collections
global service locators
global configuration state
shared mutable caches without clear ownership
```

If global state is necessary, define:

```text
Ownership
Lifetime
Synchronization
Invalidation
Testing strategy
```

---

# 57. Configuration Quality

Do not scatter configuration values throughout the codebase.

Avoid:

```csharp
if (timeout > 30)
```

when `30` is configurable.

Use appropriate configuration mechanisms.

Do not move every constant into configuration.

Configuration should represent values that genuinely vary by environment or deployment.

---

# 58. Security Code Quality

Watch for obvious security issues:

```text
Hard-coded secrets
Sensitive data in logs
Unsafe SQL
Improper authorization
Trusting client-controlled identifiers
Weak validation
Unsafe deserialization
Insecure file handling
```

Security-specific implementation belongs to the `security` skill when present.

Do not weaken security for convenience.

---

# 59. Performance Code Smells

Watch for obvious problems:

```text
N+1 queries
Repeated database calls
Unbounded collection loading
Blocking I/O
Repeated expensive calculations
Unnecessary serialization
Large object graphs
```

Do not optimize based solely on assumptions.

Use:

```text
Measure
→ Identify bottleneck
→ Optimize
→ Measure again
```

Follow `dotnet-efcore` and `postgresql` for persistence-specific optimization.

---

# 60. Premature Optimization

Do not sacrifice readability for hypothetical performance.

Bad reasoning:

```text
Maybe this will be faster.
```

Prefer evidence:

```text
This operation is measured as a bottleneck.
```

Optimize the actual bottleneck.

---

# 61. DRY vs Clarity

DRY does not mean:

```text
Every repeated line must disappear.
```

Sometimes duplication is clearer than a poorly designed abstraction.

Prefer:

```text
Small amount of intentional duplication
```

over:

```text
Large abstraction with unclear semantics
```

when the behaviors may evolve independently.

---

# 62. KISS

Prefer simple solutions.

Before introducing:

```text
Factory
Strategy
Mediator
Decorator
Repository
Adapter
Generic abstraction
```

ask whether a simpler implementation solves the requirement.

Simple code is not primitive code.

Simple code is code with unnecessary complexity removed.

---

# 63. YAGNI

Do not implement functionality that is not required.

Avoid:

```text
Unused extension points
Unused configuration
Unused interfaces
Unused abstractions
Unused generic parameters
```

Future-proof only when the future requirement is concrete enough to justify the cost.

---

# 64. Consistency

Consistency reduces cognitive load.

Follow existing conventions for:

```text
Naming
Folder structure
Method ordering
Dependency injection
Error handling
Logging
Testing
API responses
Configuration
```

Do not introduce a different style for personal preference.

Consistency should not preserve clearly harmful patterns.

---

# 65. Local Consistency vs Global Improvement

If the project consistently uses an imperfect pattern:

```text
Inspect scope.
```

For a small feature:

```text
Follow existing convention.
```

For a deliberate refactoring task:

```text
Consider improving the pattern systematically.
```

Do not perform broad architectural refactoring while implementing an unrelated feature.

---

# 66. Refactoring Safety

Before refactoring:

```text
Understand behavior
 ↓
Identify existing tests
 ↓
Make small change
 ↓
Run tests
 ↓
Review diff
```

Prefer small, reversible refactoring steps.

Do not combine:

```text
Feature implementation
+
Large unrelated refactor
+
Formatting entire project
```

unless explicitly requested.

---

# 67. Behavior Preservation

A refactor should preserve behavior unless behavior change is explicitly intended.

Before refactoring ask:

```text
What behavior must remain unchanged?
```

Verify:

```text
Tests
API behavior
Database behavior
Error behavior
Side effects
```

---

# 68. Refactoring Smells

Common smells:

```text
Long Method
Large Class
God Object
Feature Envy
Shotgun Surgery
Primitive Obsession
Duplicate Code
Deep Nesting
Long Parameter List
Data Clumps
Dead Code
Speculative Generality
Inappropriate Abstraction
```

Do not refactor every smell automatically.

Determine whether it creates actual maintenance cost.

---

# 69. Long Parameter Lists

A long parameter list can indicate:

```text
Missing concept
Missing value object
Too many responsibilities
Poor API boundary
```

Before introducing a parameter object, determine whether the parameters actually belong together.

Do not create a `RequestOptions` object containing unrelated values just to shorten a method signature.

---

# 70. Primitive Obsession

If the same primitive repeatedly represents a meaningful concept:

```text
Guid studentId
string email
decimal money
string phoneNumber
```

consider whether a stronger domain representation is useful.

Do not create value objects for trivial fields that gain nothing from the extra complexity.

---

# 71. Feature Envy

If one component constantly manipulates another object's internal data:

```text id="17t5lc"
entity.A
entity.B
entity.C
entity.D
```

ask whether behavior belongs closer to the object that owns the data.

Follow domain boundaries from the `architecture` skill.

---

# 72. Shotgun Surgery

If one small behavior change requires editing many unrelated files, consider whether the design has excessive coupling.

However, do not force all related behavior into one giant component.

Use cohesion and domain boundaries to determine the appropriate ownership.

---

# 73. Change Amplification

Good code minimizes the number of unrelated places that must change for one requirement.

Ask:

```text
If this rule changes,
how many places must I modify?
```

If the answer is unexpectedly large, investigate duplicated business logic or poor ownership.

---

# 74. Technical Debt

Not all technical debt must be removed immediately.

Classify it:

```text
Critical
High
Medium
Low
```

Prioritize debt that:

```text
Causes bugs
Blocks development
Creates security risk
Causes performance problems
Makes changes dangerous
```

Do not spend time polishing harmless code while critical debt remains.

---

# 75. Scope Control

When implementing a feature:

```text
Required change
+
Necessary supporting changes
```

is the default scope.

Avoid unrelated refactors.

If an issue is discovered but does not block the feature:

```text
Document it or leave it for a dedicated refactoring task.
```

Do not silently expand scope.

---

# 76. Code Review

When reviewing code, evaluate:

### Correctness

```text
Does it work?
```

### Design

```text
Is responsibility in the correct place?
```

### Readability

```text
Can another developer understand it quickly?
```

### Maintainability

```text
Can it be changed safely?
```

### Testability

```text
Can important behavior be tested?
```

### Performance

```text
Are there obvious expensive operations?
```

### Security

```text
Are there obvious security risks?
```

### Consistency

```text
Does it follow project conventions?
```

---

# 77. Review Severity

Classify findings.

```text
BLOCKER
Critical correctness/security/data-integrity problem.

HIGH
Significant maintainability, correctness, or performance issue.

MEDIUM
Meaningful quality problem that should be improved.

LOW
Minor improvement or stylistic issue.

NIT
Optional preference with negligible impact.
```

Do not present every stylistic preference as a critical issue.

---

# 78. Review Output

A useful review finding should contain:

```text
Problem
Why it matters
Suggested improvement
```

Example:

```text
HIGH — Duplicate enrollment check is application-only.

The current read-then-insert logic can race under concurrent requests.

Add a database-level unique constraint on the relevant columns and handle the resulting conflict.
```

Avoid vague findings:

```text
This code could be cleaner.
```

---

# 79. Static Analysis

Use existing tooling when available.

For .NET:

```bash
dotnet build
dotnet test
```

Inspect compiler/analyzer warnings.

Do not suppress warnings without understanding them.

When suppression is necessary, make it:

```text
Specific
Documented
Justified
```

Avoid broad suppression.

---

# 80. Formatting

Follow repository formatting rules.

For .NET projects, use:

```bash
dotnet format
```

only when the project uses it and the scope is appropriate.

Do not reformat unrelated files during feature work.

Formatting changes should not obscure functional changes.

---

# 81. Diff Quality

Before considering work complete:

```bash
git diff
git status
```

Review:

```text
Unexpected files
Debug code
Temporary code
Secrets
Unrelated formatting
Dead code
Generated files
Accidental changes
```

The final diff should tell a coherent story.

---

# 82. Quality Gates

Before completing a change:

```text id="y2f9v7"
[ ] Code builds
[ ] Relevant tests pass
[ ] No unexplained warnings
[ ] No debug code
[ ] No secrets
[ ] No unnecessary dependencies
[ ] No obvious dead code
[ ] Naming is clear
[ ] Responsibilities are coherent
[ ] Abstractions are justified
[ ] Error handling is intentional
[ ] Important side effects are visible
[ ] Existing conventions are respected
[ ] Diff contains no unrelated changes
```

---

# 83. Agent Workflow

When implementing new code:

```text
Understand requirement
        ↓
Inspect existing patterns
        ↓
Choose simplest suitable design
        ↓
Implement
        ↓
Test
        ↓
Review quality
        ↓
Remove unnecessary complexity
        ↓
Review diff
```

When reviewing existing code:

```text
Understand behavior
        ↓
Identify correctness problems
        ↓
Identify architectural problems
        ↓
Identify maintainability problems
        ↓
Identify unnecessary complexity
        ↓
Prioritize findings
        ↓
Recommend targeted changes
```

When refactoring:

```text
Establish behavior
        ↓
Add/verify tests
        ↓
Make small change
        ↓
Run tests
        ↓
Review diff
        ↓
Repeat
```

---

# 84. Decision Rules

### Before creating an abstraction

Ask:

```text
What concrete problem does this solve?
```

If there is no clear answer:

```text
Do not create it.
```

### Before duplicating code

Ask:

```text
Are these behaviors truly the same?
Will they evolve together?
```

If uncertain:

```text
Prefer small duplication over premature abstraction.
```

### Before refactoring

Ask:

```text
Does this improve maintainability enough to justify the risk?
```

### Before optimizing

Ask:

```text
Is there evidence of a performance problem?
```

### Before adding a dependency

Ask:

```text
Can the existing stack solve this cleanly?
```

If yes:

```text
Prefer existing capabilities.
```

---

# 85. Non-Negotiable Rules

```text
1. Correctness comes before style.
2. Do not introduce complexity without a concrete benefit.
3. Do not create abstractions merely because duplication exists.
4. Do not remove duplication when doing so makes the code harder to understand.
5. Do not refactor unrelated code during feature work.
6. Do not hide important side effects behind misleading method names.
7. Do not swallow exceptions.
8. Do not suppress warnings blindly.
9. Do not commit secrets or sensitive data.
10. Do not use global mutable state without a strong reason.
11. Do not optimize without evidence.
12. Do not force design patterns into simple problems.
13. Do not create interfaces for every class automatically.
14. Do not create generic utility classes for unrelated functionality.
15. Do not test implementation details merely to increase coverage.
16. Do not weaken tests to make broken code pass.
17. Respect the project's existing conventions.
18. Preserve behavior during refactoring unless behavior change is intentional.
19. Keep changes scoped to the requested work.
20. Prefer simple, explicit, maintainable code.
```

---

# 86. Final Principle

The best code is not the most sophisticated code.

It is code where another developer can quickly answer:

```text
What does this do?
Why does it do it?
Where does this behavior belong?
What can I safely change?
What could break if I change it?
```

Prefer:

```text
Clear
+
Cohesive
+
Simple
+
Explicit
+
Testable
+
Consistent
```

over:

```text
Clever
+
Abstract
+
Generic
+
Over-engineered
+
Difficult to trace
```

The purpose of code quality is not to make code look perfect.

It is to make the codebase safer and cheaper to change.
