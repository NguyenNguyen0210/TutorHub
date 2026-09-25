---

name: dotnet-efcore
description: Develop, review, refactor, and optimize C#/.NET applications using ASP.NET Core and Entity Framework Core. Use when implementing .NET code, Web APIs, dependency injection, configuration, async operations, LINQ, EF Core entities, DbContext, Fluent API, relationships, queries, projections, transactions, concurrency, migrations, persistence, or .NET/EF Core performance. This skill is project-agnostic and must follow the repository's existing .NET and EF Core conventions.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# .NET & EF Core Engineering

## 1. Purpose

This skill defines engineering rules for building and maintaining applications using:

* C#
* .NET
* ASP.NET Core
* Entity Framework Core

The objective is to produce code that is:

* Correct.
* Idiomatic.
* Maintainable.
* Testable.
* Efficient.
* Explicit about dependencies.
* Safe with database operations.
* Compatible with the project's existing conventions.

This skill does not define overall architecture.

Architectural decisions such as:

* Clean Architecture.
* CQRS.
* Vertical Slice Architecture.
* Domain/Application boundaries.
* Feature boundaries.

belong to the `architecture` skill.

Database-specific design belongs to the `postgresql` skill when PostgreSQL is used.

---

# 2. Repository First

Before changing .NET or EF Core code:

1. Inspect the existing project structure.
2. Inspect target framework.
3. Inspect package versions.
4. Inspect existing coding conventions.
5. Inspect existing DI patterns.
6. Inspect existing DbContext configuration.
7. Inspect existing EF Core configuration.
8. Reuse established patterns when they are appropriate.

Check:

```bash
dotnet --info
dotnet --list-sdks
dotnet --list-runtimes
dotnet restore
dotnet build
```

Inspect project files:

```text
*.csproj
*.sln
*.slnx
Directory.Build.props
Directory.Build.targets
Directory.Packages.props
global.json
```

Do not upgrade framework or packages merely because newer versions exist.

---

# 3. Target Framework and Package Compatibility

Always respect the project's target framework.

Example:

```xml
<TargetFramework>net9.0</TargetFramework>
```

Do not introduce packages targeting an incompatible framework.

Before changing package versions:

```text
Check:
- Target framework
- Existing package versions
- Transitive dependencies
- Compatibility
- Project conventions
```

Avoid unnecessary dependency upgrades.

If a dependency upgrade is required, verify:

```bash
dotnet restore
dotnet build
dotnet test
```

---

# 4. C# Nullable Reference Types

Prefer nullable reference types when the project enables them.

Example:

```csharp
public string Name { get; set; } = string.Empty;
```

For genuinely optional values:

```csharp
public string? MiddleName { get; set; }
```

Do not suppress warnings with `!` unless the invariant is actually guaranteed.

Avoid:

```csharp
var name = user.Name!;
```

when the value can genuinely be null.

The nullability model should communicate the actual domain/application contract.

---

# 5. Classes, Records, Structs

Choose types according to semantics.

Use `class` for:

* Entities.
* Mutable objects.
* Services.
* Components with identity.

Use `record` for:

* Immutable data.
* Request/response models.
* Value-like data where structural equality is useful.

Use `struct` only when value semantics and allocation characteristics justify it.

Do not use records or structs merely because they are modern C# features.

---

# 6. Sealed Types

Prefer `sealed` for classes that are not intended to be inherited from.

Example:

```csharp
public sealed class CreateStudentHandler
{
}
```

and:

```csharp
public sealed record CreateStudentCommand(...);
```

Do not introduce inheritance merely to enable reuse.

Prefer composition when appropriate.

---

# 7. Dependency Injection

Use ASP.NET Core's built-in Dependency Injection system.

Register dependencies at the composition root.

Prefer constructor injection:

```csharp
public sealed class StudentService
{
    private readonly IStudentRepository _repository;

    public StudentService(IStudentRepository repository)
    {
        _repository = repository;
    }
}
```

Avoid service locator patterns:

```csharp
serviceProvider.GetRequiredService<T>();
```

inside business/application code unless there is a specific framework-driven reason.

Do not instantiate infrastructure services manually inside application code.

Avoid static global service access.

---

# 8. Dependency Lifetime

Choose lifetimes intentionally.

### Singleton

Use for stateless, thread-safe components whose lifetime should span the application.

### Scoped

Use for request-scoped services and components that depend on scoped resources.

`DbContext` is normally scoped.

### Transient

Use for lightweight, stateless components where a new instance per resolution is appropriate.

Do not choose lifetimes arbitrarily.

Be especially careful about:

```text
Singleton
    ↓
Scoped dependency
```

This creates a lifetime mismatch and is generally invalid.

---

# 9. Configuration

Use strongly typed configuration when configuration represents a coherent set of settings.

Example:

```csharp
public sealed class JwtOptions
{
    public string SecretKey { get; init; } = string.Empty;
    public int AccessTokenMinutes { get; init; }
}
```

Register using the Options pattern.

Avoid scattering:

```csharp
configuration["Jwt:SecretKey"]
```

throughout application code.

Configuration should be:

* Explicit.
* Validated.
* Centralized.
* Environment-aware.

Never hard-code secrets.

---

# 10. Options Validation

When configuration is required for application correctness, validate it during startup where practical.

Examples:

```text
Required connection string
JWT secret
Token lifetime
External service URL
Required API key
```

Fail fast when invalid configuration would make the application unusable.

---

# 11. Async Programming

Use asynchronous APIs for I/O-bound operations.

Prefer:

```csharp
await dbContext.Students.ToListAsync(cancellationToken);
```

over synchronous database calls inside asynchronous request pipelines.

Do not wrap synchronous I/O in:

```csharp
Task.Run(...)
```

merely to make it appear asynchronous.

Async is primarily for non-blocking I/O.

---

# 12. CancellationToken

Propagate `CancellationToken` through application and infrastructure operations when supported.

Example:

```csharp
public async Task<Result> Handle(
    Command request,
    CancellationToken cancellationToken)
{
    var student = await _dbContext.Students
        .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

    ...
}
```

Pass the token to:

* EF Core async methods.
* HTTP calls.
* Long-running operations.
* Other cancellable APIs.

Do not create a new unrelated `CancellationTokenSource` merely to ignore the caller's cancellation.

---

# 13. Avoid Async Void

Do not use:

```csharp
async void
```

except for event-handler scenarios where the framework requires it.

Prefer:

```csharp
Task
Task<T>
ValueTask
ValueTask<T>
```

when appropriate.

---

# 14. Exception Handling

Do not use exceptions for ordinary control flow.

Bad:

```csharp
try
{
    var student = ...
}
catch
{
    return null;
}
```

unless the exception represents an expected boundary condition and handling it is intentional.

Catch exceptions where the application can meaningfully:

* Recover.
* Translate.
* Add context.
* Log appropriately.
* Map to a defined result.

Avoid broad catches:

```csharp
catch (Exception)
```

unless there is a clear architectural reason.

Global exception handling should generally be centralized.

---

# 15. Logging

Use structured logging.

Prefer:

```csharp
_logger.LogInformation(
    "Student {StudentId} enrolled in class {ClassId}",
    studentId,
    classId);
```

over:

```csharp
_logger.LogInformation(
    $"Student {studentId} enrolled in class {classId}");
```

Do not log:

* Passwords.
* Access tokens.
* Refresh tokens.
* API secrets.
* Sensitive credentials.

Avoid excessive logging inside low-level loops.

---

# 16. LINQ

Use LINQ to express collection and query operations clearly.

Prefer readable expressions.

Avoid unnecessarily complex LINQ chains that are difficult to understand or translate.

When using EF Core, remember:

```text
LINQ over IQueryable
        ↓
Expression tree
        ↓
EF Core translation
        ↓
SQL
```

Not every C# method can be translated to SQL.

---

# 17. IQueryable vs IEnumerable

Understand the difference.

`IQueryable<T>` represents a query that can be translated and executed by the provider.

`IEnumerable<T>` represents in-memory iteration.

Avoid accidentally materializing data too early:

```csharp
var students = await db.Students.ToListAsync();

var active = students
    .Where(x => x.IsActive)
    .ToList();
```

when the filtering can safely occur in the database:

```csharp
var active = await db.Students
    .Where(x => x.IsActive)
    .ToListAsync();
```

Push filtering, projection, sorting, and pagination to the database when appropriate.

---

# 18. Avoid Premature Materialization

Be cautious with:

```csharp
ToList()
ToArray()
AsEnumerable()
```

before all database-side operations are complete.

Bad:

```csharp
var users = db.Users
    .ToList()
    .Where(x => x.IsActive)
    .ToList();
```

Prefer:

```csharp
var users = await db.Users
    .Where(x => x.IsActive)
    .ToListAsync(cancellationToken);
```

unless materialization is intentionally required.

---

# 19. EF Core DbContext

Treat `DbContext` as a unit-of-work boundary.

A DbContext should generally:

* Track entity changes when required.
* Execute database queries.
* Persist changes.
* Coordinate transactions.

Avoid:

* Global/static DbContext instances.
* Sharing DbContext across unrelated requests.
* Long-lived contexts.
* Concurrent operations on the same DbContext instance.

DbContext is not thread-safe.

---

# 20. DbContext Lifetime

In ASP.NET Core, the typical lifetime is scoped to the request.

Prefer:

```text
HTTP Request
    ↓
Scoped DbContext
    ↓
Application operations
    ↓
Dispose
```

Do not retain DbContext instances beyond their intended lifetime.

---

# 21. Entity Modeling

EF Core entities should represent persistence-compatible domain/application objects while respecting the project's architecture.

Do not automatically make every database column a public mutable property if the domain model requires encapsulation.

Follow the `architecture` skill for deciding:

* Where entities belong.
* Aggregate boundaries.
* Domain behavior.
* Persistence boundaries.

Use EF Core configuration to handle database mapping concerns.

---

# 22. Fluent API

Prefer Fluent API for non-trivial EF Core mapping.

Examples:

```text
Primary keys
Foreign keys
Indexes
Constraints
Relationships
Column types
Precision
Table names
Value conversions
Delete behavior
```

Keep complex persistence configuration out of application business logic.

Example:

```csharp
builder.HasKey(x => x.Id);

builder.HasIndex(x => x.Email)
    .IsUnique();
```

---

# 23. Entity Configuration

For larger projects, prefer separate configurations:

```text
Persistence/
└── Configurations/
    ├── StudentConfiguration.cs
    ├── EnrollmentConfiguration.cs
    └── AttendanceConfiguration.cs
```

rather than putting every entity mapping directly into `OnModelCreating`.

Use:

```csharp
IEntityTypeConfiguration<TEntity>
```

when it improves organization.

Do not split trivial mappings into excessive files if the project is small.

---

# 24. Relationships

Configure relationships explicitly when their behavior matters.

Understand:

```text
One-to-one
One-to-many
Many-to-many
Required relationship
Optional relationship
```

Be explicit about delete behavior when cascading could be dangerous.

Do not rely on accidental conventions for critical relationship behavior.

---

# 25. Foreign Keys

Foreign keys should represent actual database relationships.

Prefer explicit FK properties when they improve:

* Querying.
* Serialization boundaries.
* Relationship management.
* Persistence clarity.

Example:

```csharp
public Guid StudentId { get; set; }
public Student Student { get; set; } = null!;
```

The exact model should follow the project's domain design.

---

# 26. Indexes

Create indexes based on actual query patterns and constraints.

Common candidates:

```text
Frequently filtered columns
Frequently joined columns
Unique business identifiers
Composite query predicates
Ordering patterns where beneficial
```

Do not index every column.

Indexes have costs:

* Storage.
* Write overhead.
* Maintenance.
* Query planning complexity.

Indexes should be driven by access patterns.

---

# 27. Unique Constraints

Use database-level uniqueness for invariants that must hold regardless of application behavior.

Example:

```text
Student email must be unique.
```

Application validation may provide a friendly error, but the database constraint protects against race conditions.

Do not rely exclusively on:

```csharp
if (!await ExistsAsync(...))
{
    await InsertAsync(...);
}
```

for uniqueness under concurrent requests.

---

# 28. Enum Mapping

When mapping enums:

1. Follow the existing project convention.
2. Choose numeric or textual storage intentionally.
3. Consider interoperability and schema clarity.
4. Avoid silently changing existing enum representations.

Do not change enum database representation in an existing project without considering migration impact.

---

# 29. Value Conversion

Use EF Core value converters when a domain representation differs from its persistence representation.

Examples:

```text
Value Object ↔ primitive
Enum ↔ string
Strongly typed ID ↔ Guid
```

Keep conversions deterministic and well-defined.

---

# 30. Query Tracking

Use tracking when entities will be modified through the DbContext.

For read-only operations, consider:

```csharp
AsNoTracking()
```

Example:

```csharp
var students = await db.Students
    .AsNoTracking()
    .Where(...)
    .ToListAsync(cancellationToken);
```

Do not blindly add `AsNoTracking()` everywhere.

Understand whether later operations require tracked entities.

---

# 31. Projection

For read-only API/query operations, prefer projection when only selected fields are needed.

Example:

```csharp
var students = await db.Students
    .AsNoTracking()
    .Where(x => x.IsActive)
    .Select(x => new StudentListItem(
        x.Id,
        x.Name))
    .ToListAsync(cancellationToken);
```

Benefits:

* Less data transferred.
* Less memory usage.
* No unnecessary entity materialization.
* Clear query contract.

Do not load entire entity graphs when a projection is sufficient.

---

# 32. Include

Use `Include` when the entity graph is actually required.

Avoid excessive:

```csharp
.Include(...)
.ThenInclude(...)
.ThenInclude(...)
```

especially when a projection would be simpler.

Be aware of:

* Large joins.
* Cartesian explosion.
* Duplicate result rows.
* Query performance.

For read models, projection is often preferable.

---

# 33. N+1 Queries

Avoid patterns that execute one query for a parent collection and another query for each parent.

Bad conceptual pattern:

```text
Query students
    ↓
For each student
    ↓
Query enrollments
```

Prefer:

```text
Single appropriate query
```

or:

```text
Explicit batched queries
```

depending on the use case.

Use logging/profiling to verify actual SQL when performance matters.

---

# 34. Pagination

Never load an unbounded dataset when the API only needs a page.

Prefer database-side pagination.

Typical offset pagination:

```csharp
query
    .OrderBy(...)
    .Skip(...)
    .Take(...);
```

Always use deterministic ordering.

For large datasets or high-performance scenarios, consider keyset/cursor pagination when appropriate.

---

# 35. Transactions

Use transactions when multiple operations must succeed or fail atomically.

Example:

```text
Create enrollment
+
Create invoice
+
Update balance
```

may require one consistency boundary.

Do not create a transaction around every query.

Do not create nested transaction abstractions without understanding the provider behavior.

Follow the `architecture` skill for deciding the application transaction boundary.

---

# 36. SaveChanges

`SaveChanges` / `SaveChangesAsync` should represent a meaningful persistence boundary.

Prefer:

```csharp
await dbContext.SaveChangesAsync(cancellationToken);
```

after the relevant state changes are complete.

Avoid excessive calls such as:

```text
SaveChanges
SaveChanges
SaveChanges
```

when the operations should belong to one atomic unit.

Do not treat `SaveChanges` as an arbitrary synchronization mechanism.

---

# 37. Concurrency

Assume concurrent requests can occur.

Potential problems include:

```text
Lost updates
Duplicate records
Race conditions
Stale data
```

Use appropriate mechanisms:

* Unique constraints.
* Concurrency tokens.
* Transactions.
* Appropriate isolation.
* Atomic database operations.

Do not rely solely on:

```text
Read
→ check
→ write
```

when concurrent requests can invalidate the assumption.

---

# 38. Optimistic Concurrency

When appropriate, use optimistic concurrency mechanisms supported by EF Core/database provider.

Conceptually:

```text
Read version
    ↓
Modify entity
    ↓
Save
    ↓
Version changed?
    ├── No → success
    └── Yes → concurrency conflict
```

Handle concurrency exceptions intentionally.

Do not silently overwrite conflicting changes.

---

# 39. Migrations

EF Core migrations represent database schema evolution.

Before creating a migration:

```text
Inspect:
- Current model
- Existing migrations
- Database state
- Provider
- Pending changes
```

Typical commands:

```bash
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

Use the project's established project/startup-project structure.

Do not generate migrations merely because the model changed if the change is temporary or incorrect.

---

# 40. Migration Safety

Treat migrations as production-sensitive code.

Review generated migrations.

Check for:

```text
Data loss
Column drops
Table drops
Unexpected type changes
Constraint changes
Index changes
Large table rewrites
```

Never blindly apply a migration to production without understanding its SQL and operational impact.

For destructive schema changes, consider staged migrations.

---

# 41. Migration Naming

Use meaningful migration names.

Prefer:

```text
AddEnrollmentUniqueConstraint
AddAttendanceLateMinutes
CreateInvoiceTable
```

Avoid:

```text
Update
Migration1
Test
Fix
New
```

Names should describe the schema change.

---

# 42. Seeding

Distinguish between:

```text
Static reference data
Development/test data
Production initialization
```

Do not place sensitive credentials in seed data.

Avoid creating large or fragile seed mechanisms when simple initialization is sufficient.

Follow the project's existing seeding strategy.

---

# 43. Raw SQL

EF Core LINQ should be the default.

Raw SQL may be appropriate for:

* Provider-specific features.
* Complex queries that cannot be expressed efficiently.
* Carefully optimized operations.
* Database features not exposed cleanly by EF Core.

Always parameterize user-controlled values.

Never concatenate untrusted input into SQL.

Bad:

```csharp
$"SELECT * FROM users WHERE name = '{name}'"
```

Use parameterized APIs.

---

# 44. Query Performance

When a query appears slow:

Do not immediately rewrite the entire application.

Investigate:

```text
Generated SQL
Indexes
Query plan
Filtering
Projection
Joins
Tracking
Pagination
Network round trips
Database statistics
```

Use tools such as:

```text
EF Core SQL logging
Database EXPLAIN
Profilers
Application telemetry
```

Optimize based on evidence.

---

# 45. Avoid Premature Optimization

Do not optimize code based solely on theoretical concerns.

Prioritize:

```text
Correctness
→ Maintainability
→ Measured performance
```

When performance becomes a problem:

```text
Measure
→ Identify bottleneck
→ Change
→ Measure again
```

---

# 46. HTTP Client Usage

For ASP.NET Core applications calling external APIs, prefer `IHttpClientFactory`.

Avoid creating a new raw `HttpClient` repeatedly for each request.

Configure:

* Base address.
* Timeout.
* Headers.
* Delegating handlers.
* Resilience policies where appropriate.

Do not place external API implementation details directly in controllers or domain entities.

---

# 47. Controllers and Endpoints

Controllers/endpoints should remain thin.

Typical flow:

```text
HTTP
 ↓
Endpoint
 ↓
Application request
 ↓
Handler
 ↓
Domain
 ↓
Persistence
```

Do not place:

* Database queries.
* Complex business rules.
* Transaction orchestration.
* External integration logic.

inside controllers.

Architectural ownership is defined by the `architecture` skill.

---

# 48. Middleware

Use middleware for cross-cutting HTTP pipeline concerns.

Examples:

```text
Exception handling
Correlation ID
Request logging
Security headers
```

Do not use middleware for feature-specific business logic that belongs in the application layer.

---

# 49. Validation

Distinguish:

### Input validation

Examples:

```text
Required field
Invalid format
Invalid range
Invalid request structure
```

### Business validation

Examples:

```text
Enrollment cannot occur after course completion.
Student cannot have two active enrollments for the same class.
```

Input validation can occur at the application boundary.

Business invariants belong to the Domain according to the `architecture` skill.

Do not use FluentValidation or data annotations as a replacement for domain invariants.

---

# 50. Performance Anti-Patterns

Watch for:

```text
N+1 queries
Premature ToList()
Unbounded queries
Unnecessary Include
Loading entire entities for DTOs
Unnecessary tracking
Repeated SaveChanges
Blocking async operations
Synchronous database I/O
Unbounded API responses
Large object graphs
```

When detecting one, determine whether it is actually harmful before changing it.

---

# 51. Testing Compatibility

Code should be testable without excessive infrastructure coupling.

Prefer dependencies through explicit abstractions where they represent meaningful application boundaries.

Do not create interfaces solely to make trivial code mockable.

Testing strategy belongs to the `testing` skill.

This skill should ensure .NET/EF Core implementation does not unnecessarily prevent appropriate testing.

---

# 52. Code Review Checklist

Before considering .NET/EF Core code complete:

```text
[ ] Target framework is respected
[ ] Package versions are compatible
[ ] Nullable reference types are handled correctly
[ ] Async APIs are used for I/O
[ ] CancellationToken is propagated
[ ] No unnecessary async void
[ ] Dependencies are injected appropriately
[ ] Service lifetimes are correct
[ ] Configuration is strongly typed where useful
[ ] Exceptions are handled at appropriate boundaries
[ ] Logging does not expose secrets
[ ] LINQ is readable
[ ] IQueryable is not materialized prematurely
[ ] Queries are bounded
[ ] Projections are used when appropriate
[ ] Tracking behavior is intentional
[ ] No obvious N+1 queries
[ ] Relationships are correctly configured
[ ] Indexes support important access patterns
[ ] Constraints enforce important invariants
[ ] Transactions are used where required
[ ] Concurrency is considered
[ ] Migrations are reviewed
[ ] No unsafe raw SQL
[ ] No unnecessary abstractions
[ ] Existing project conventions are respected
```

---

# 53. Agent Workflow

When implementing a .NET/EF Core feature:

```text
1. Inspect project
        ↓
2. Identify target framework and packages
        ↓
3. Inspect existing conventions
        ↓
4. Understand architecture
        ↓
5. Implement C#/.NET code
        ↓
6. Implement EF Core mapping if required
        ↓
7. Implement queries/persistence
        ↓
8. Review performance implications
        ↓
9. Create/update migration if required
        ↓
10. Build
        ↓
11. Run relevant tests
        ↓
12. Review changes
```

Do not change architecture merely to make implementation easier.

Do not introduce a new technology when the existing .NET/EF Core stack already solves the requirement.

---

# 54. Agent Decision Rules

When deciding how to implement something:

### Question 1

Is this a business rule?

```text
Yes → Follow architecture skill → Domain
```

### Question 2

Is this application orchestration?

```text
Yes → Application feature/handler
```

### Question 3

Is this persistence mapping?

```text
Yes → EF Core configuration
```

### Question 4

Is this database-specific behavior?

```text
Yes → Consider database/provider-specific implementation
```

and consult the `postgresql` skill when PostgreSQL is involved.

### Question 5

Is this HTTP transport behavior?

```text
Yes → ASP.NET Core Presentation layer
```

### Question 6

Is this cross-cutting?

```text
Yes → Appropriate middleware/pipeline/service mechanism
```

---

# 55. Minimal Abstraction Principle

Do not create abstractions by default.

Before creating an interface, ask:

```text
Why does this abstraction exist?
Who owns the abstraction?
Does it represent a meaningful boundary?
Will it reduce coupling?
Does it improve testing or substitution?
```

Avoid unnecessary patterns such as:

```text
IStudentService
StudentService
IStudentManager
StudentManager
IStudentRepository
StudentRepository
```

when a simpler design is sufficient.

Architecture should remain understandable.

---

# 56. Project Convention Priority

When this skill conflicts with an established project convention:

1. Explicit user instruction.
2. Existing project behavior that must be preserved.
3. Project-specific architecture/conventions.
4. This skill's recommendations.
5. Generic .NET conventions.

Do not refactor existing code simply because it differs from this skill unless the user asks for improvement or the difference creates a real problem.

---

# 57. Final Principle

The goal is not to use every .NET or EF Core feature.

The goal is:

```text
Correct C#
+
Correct .NET behavior
+
Correct EF Core usage
+
Correct database interaction
+
Good performance
+
Maintainability
```

Prefer:

```text
Simple
Explicit
Idiomatic
Measured
Testable
```

over:

```text
Clever
Over-abstracted
Framework-driven
Prematurely optimized
```

Use the simplest .NET/EF Core implementation that satisfies the application's actual requirements while respecting the repository's architecture and conventions.
