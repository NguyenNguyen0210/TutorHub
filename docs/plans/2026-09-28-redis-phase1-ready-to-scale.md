# Redis Phase 1 (Ready to Scale) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API chạy 2 replica với 1 Redis chung cho OAuth state, SignalR backplane, cache Subjects/settings, cron lock.

**Architecture:** Giữ code memory/DB cũ làm fallback theo flag `Redis:Enabled` + từng feature flag; Redis chết thì degrade theo SPEC bản 2 §2 (OAuth fail-closed, còn lại fail-open/skip + health Degraded).

**Tech Stack:** .NET 8, `Microsoft.Extensions.Caching.StackExchangeRedis 8.0.11`, `Microsoft.AspNetCore.SignalR.StackExchangeRedis 8.0.11`, `redis:7-alpine`, xUnit (`dotnet test`).

---

## File structure map

| File | Responsibility |
|---|---|
| `docker-compose.yml` (modify) | thêm `redis` service + `api` env `ConnectionStrings__Redis`, `Redis__*` |
| `.env.example` (modify) | mẫu `ConnectionStrings__Redis`, `Redis__Enabled`, `Redis__InstanceName` |
| `src/backend/TutorHub.Api/appsettings.json` (modify) | `ConnectionStrings:Redis=""`, `Redis:{Enabled,InstanceName,...}` |
| `src/backend/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj` (modify) | 2 package Redis 8.0.11 |
| `src/backend/TutorHub.Infrastructure/Redis/RedisOptions.cs` (create) | options `Enabled/ConnectionString/InstanceName/Features` |
| `src/backend/TutorHub.Infrastructure/HealthChecks/RedisHealthCheck.cs` (create) | `PingAsync`, Degraded khi lỗi |
| `src/backend/TutorHub.Infrastructure/Authentication/External/DistributedExternalAuthStateStore.cs` (create) | `IExternalAuthStateStore` qua `StringGetDeleteAsync` nguyên tử |
| `src/backend/TutorHub.Infrastructure/Distributed/RedisDistributedLock.cs` (create) | `SET NX PX` + Lua compare-del |
| `src/backend/TutorHub.Infrastructure/Caching/*` (create, Task 4) | cache Subjects/settings + invalidate |
| `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs` (modify) | đăng ký có điều kiện theo flag |
| `src/backend/TutorHub.Api/Program.cs` (modify) | health check redis |
| `src/backend/TutorHub.Infrastructure/BackgroundServices/*` (modify, Task 5) | bọc cron lock |
| Tests (Task 1/2/4/5/6) | unit + integration, chạy bằng `dotnet test` |

## Tasks

### Task 1: WP0 Redis infra + options + healthcheck — ✅ DONE (commit c2170c4; spec APPROVED; quality APPROVED with 4 minor polish notes deferred)

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `src/backend/TutorHub.Api/appsettings.json`
- Modify: `src/backend/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj`
- Create: `src/backend/TutorHub.Infrastructure/Redis/RedisOptions.cs`
- Create: `src/backend/TutorHub.Infrastructure/HealthChecks/RedisHealthCheck.cs`
- Modify: `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs`
- Modify: `src/backend/TutorHub.Api/Program.cs`

- [ ] **Step 1: Thêm 2 package Redis (giữ train 8.0.11)**

Run: `dotnet add src/backend/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj package Microsoft.Extensions.Caching.StackExchangeRedis --version 8.0.11`
Run: `dotnet add src/backend/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj package Microsoft.AspNetCore.SignalR.StackExchangeRedis --version 8.0.11`
Expected: csproj có 2 dòng mới, `dotnet restore` pass.

- [ ] **Step 2: Viết `RedisOptions` skeleton + validation**

Create `src/backend/TutorHub.Infrastructure/Redis/RedisOptions.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
namespace TutorHub.Infrastructure.Redis;
public sealed class RedisOptions
{
    public const string SectionName = "Redis";
    public bool Enabled { get; set; }
    [MinLength(1)] public string ConnectionString { get; set; } = string.Empty;
    public string InstanceName { get; set; } = "tutorhub:";
    public RedisFeatureFlags Features { get; set; } = new();
}
public sealed class RedisFeatureFlags
{
    public bool OAuth { get; set; } = true;
    public bool SignalR { get; set; } = true;
    public bool Cache { get; set; } = true;
    public bool CronLock { get; set; } = true;
}
```

- [ ] **Step 3: Viết `RedisHealthCheck` (Ping, fail = Degraded)**

Create `src/backend/TutorHub.Infrastructure/HealthChecks/RedisHealthCheck.cs` dùng `IConnectionMultiplexer.GetDatabase().PingAsync()` với timeout 2s; `Enabled=false` → return Healthy kèm `{"redis":"disabled"}`; bắt exception → `HealthCheckResult.Degraded`.

- [ ] **Step 4: Compose + env + appsettings + đăng ký có điều kiện, rồi build**

`docker-compose.yml` thêm service `redis` (`redis:7-alpine`, volume `redisdata`, `redis-cli ping` healthcheck); `api` thêm `depends_on.redis: service_healthy` + env `ConnectionStrings__Redis`, `Redis__Enabled`, `Redis__InstanceName`. `appsettings.json` thêm `ConnectionStrings:Redis=""` + `Redis:{Enabled:false,...}`. Đăng ký: `Enabled` mới `AddStackExchangeRedisCache` + `AddSingleton<IConnectionMultiplexer>` với `abortConnect=false`; `Program.cs` thêm `.AddCheck<RedisHealthCheck>("redis")`.
Run: `dotnet build src/backend/TutorHub.sln`
Expected: 0 error. Run: `docker compose up redis -d && curl -f http://localhost:8080/health`
Expected: `Enabled=false` → healthy không cần redis.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example src/backend/TutorHub.Api/appsettings.json src/backend/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj src/backend/TutorHub.Infrastructure/Redis/RedisOptions.cs src/backend/TutorHub.Infrastructure/HealthChecks/RedisHealthCheck.cs src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs src/backend/TutorHub.Api/Program.cs
git commit -m "feat(redis): wp0 infra options healthcheck with fallback"
```

### Task 2: WP1 OAuth state phân tán (fail-closed, single-use nguyên tử) — ✅ DONE (commits 3f1b6fa + 2861e17; spec APPROVED; quality APPROVED after re-review)

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/Authentication/External/DistributedExternalAuthStateStore.cs`
- Modify: `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs`
- Test: `src/test/TutorHub.Infrastructure.UnitTests/Authentication/DistributedExternalAuthStateStoreTests.cs`

- [ ] **Step 1: Viết test đỏ cho single-winner**

```csharp
[Fact]
public async Task Consume_Twice_SecondReturnsNull()
{
    var store = CreateStore(); // IDatabase thật (testcontainers redis:7) hoặc fake
    var state = store.Create(ExternalAuthProvider.Google, "verifier-1", null);
    Assert.NotNull(store.Consume(state, ExternalAuthProvider.Google));
    Assert.Null(store.Consume(state, ExternalAuthProvider.Google));
}
```

Run: `dotnet test src/test/TutorHub.Infrastructure.UnitTests --filter DistributedExternalAuthStateStore -v`
Expected: FAIL (class chưa tồn tại).

- [ ] **Step 2: Implement `DistributedExternalAuthStateStore`**

Dùng `IDatabase.StringSetAsync(key, json, TTL, When.NotExists)` cho `Create` (trùng thì sinh `state` lại, tối đa 3 lần); `Consume` dùng `StringGetDeleteAsync(key)` nguyên tử rồi check `entry.Provider == provider` (giữ logic `MemoryExternalAuthStateStore.cs:78-84`); serialize `PendingExternalAuth` bằng `System.Text.Json`. Key giữ `external-auth:state:{state}`, TTL `ExternalAuthOptions.StateLifetimeMinutes`.

- [ ] **Step 3: Đăng ký điều kiện + chạy test xanh**

```csharp
if (redis.Enabled && redis.Features.OAuth) services.AddSingleton<IExternalAuthStateStore, DistributedExternalAuthStateStore>();
else services.AddSingleton<IExternalAuthStateStore, MemoryExternalAuthStateStore>();
```

Run: `dotnet test src/test/TutorHub.Infrastructure.UnitTests --filter DistributedExternalAuthStateStore -v`
Expected: PASS (single-winner, sai-provider null, hết TTL null).

- [ ] **Step 4: Commit**

```bash
git add src/backend/TutorHub.Infrastructure/Authentication/External/DistributedExternalAuthStateStore.cs src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs src/test/TutorHub.Infrastructure.UnitTests/Authentication/DistributedExternalAuthStateStoreTests.cs
git commit -m "feat(oauth): distributed state store with atomic consume"
```

### Task 3: WP2 SignalR backplane — ✅ DONE (commit c484d93; spec APPROVED; quality APPROVED, 1 cosmetic note on unwrapped disconnect-leave deferred) (prefix TutorHub)

**Files:**
- Modify: `src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs`
- Test: manual 2-node (không thêm unit vì backplane là infra)

- [ ] **Step 1: Đấu backplane theo flag**

```csharp
var signalR = services.AddSignalR();
if (redis.Enabled && redis.Features.SignalR)
    signalR.AddStackExchangeRedis(redis.ConnectionString, o => o.Configuration.ChannelPrefix = "TutorHub");
```

Không đổi `ChatHub`, `NotificationHub`, group `conversation_{id}`/`user_{id}`.

- [ ] **Step 2: Đo cross-node thủ công**

Run: `docker compose up --build -d redis api` rồi scale api replica 2 (hoặc chạy 2 `dotnet run` port 5129/5130 cùng `ConnectionStrings__Redis=localhost:6379`).
Expected: ws client nối node A `JoinConversation(id)`, publish từ node B qua `IHubContext<ChatHub>` → A nhận `UserTyping`/message; kill redis → handshake vẫn 200 + log warn.

- [ ] **Step 3: Commit**

```bash
git add src/backend/TutorHub.Infrastructure/InfrastructureServiceCollectionExtensions.cs
git commit -m "feat(signalr): redis backplane with local-degrade fallback"
```

### Task 4: WP5 cache Subjects + settings (read-through, invalidate đúng key) — ✅ DONE (commits 738edd6 + 07a21ca + 62b2b97; spec APPROVED; quality APPROVED after re-review)

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/Caching/SubjectCacheService.cs`
- Create: `src/backend/TutorHub.Infrastructure/Caching/PlatformSettingCacheService.cs`
- Modify: `GetPublicSubjectsQueryHandler.cs`, `GetAdminSubjectsQueryHandler.cs`, `EnrollmentActivationService.cs`, admin CUD Subject/Category + `PlatformSettingChangedEvent` handler
- Test: `src/test/TutorHub.Application.UnitTests/Caching/CacheInvalidationTests.cs`

- [ ] **Step 1: Viết test đỏ cho invalidate**

```csharp
[Fact]
public async Task UpdateSubject_InvalidatesListAndDetail()
{
    await cache.GetPublicSubjectsAsync(filter); // miss, ghi key subj:list:{hash}
    await admin.UpdateSubject(...);
    Assert.False(await cache.ExistsAsync("subj:list:{hash}")); // đã xóa đúng key
}
```

Run: `dotnet test src/test/TutorHub.Application.UnitTests --filter CacheInvalidation -v`
Expected: FAIL.

- [ ] **Step 2: Implement read-through + TTL + single-flight**

Key: `subj:list:{sha256(filter)}` TTL 5p, `subj:{id}` TTL 10p, `platform:setting:{key}` TTL 2p. Miss → query DB → `StringSetAsync` JSON. Redis chết → catch → query DB trực tiếp (fail-open). Dùng `SemaphoreSlim` per-key chống stampede trong cùng node.

- [ ] **Step 3: Móc invalidate + chạy xanh**

Admin Subject/Category CUD → `RemoveAsync` cả `subj:list:*` (dùng `Keys` scan giới hạn hoặc version counter `subj:ver` append vào key — chốt version-counter để tránh `KEYS` prod) + `subj:{id}`; `PlatformSettingChangedEvent` → xóa `platform:setting:{key}`.
Run: `dotnet test src/test/TutorHub.Application.UnitTests --filter CacheInvalidation -v`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/backend/TutorHub.Infrastructure/Caching/ src/test/TutorHub.Application.UnitTests/Caching/
git commit -m "feat(cache): subjects and platform settings with invalidate"
```

### Task 5: WP4 cron distributed lock — ✅ DONE (commits 2a26a9b + 422d570; spec APPROVED; quality APPROVED after re-review) (SET NX PX + Lua compare-del)

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/Distributed/RedisDistributedLock.cs`
- Modify: `BookingTimeoutBackgroundService.cs`, `AutoPayoutJob.cs`, `SessionReminderJob.cs`, `GracePeriodReminderJob.cs`
- Test: `src/test/TutorHub.Infrastructure.UnitTests/Distributed/RedisDistributedLockTests.cs`

- [ ] **Step 1: Viết test đỏ cho mutual-exclusion**

```csharp
[Fact]
public async Task TwoWorkers_OnlyOneAcquires()
{
    var w1 = await lock1.AcquireAsync("cron:test", TimeSpan.FromSeconds(30));
    var w2 = await lock2.AcquireAsync("cron:test", TimeSpan.FromSeconds(30));
    Assert.True(w1); Assert.False(w2);
}
```

Run: `dotnet test src/test/TutorHub.Infrastructure.UnitTests --filter RedisDistributedLock -v`
Expected: FAIL.

- [ ] **Step 2: Implement lock + release Lua**

`Acquire`: `StringSetAsync(key, workerId, ttl, When.NotExists)`. `Release`: Lua `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`. Mỗi job 1 `workerId = Guid.NewGuid():N` (theo mẫu `OutboxDispatcherJob.cs:18`).

- [ ] **Step 3: Bọc job + chạy xanh**

Đầu mỗi tick: `if (!await lock.AcquireAsync(key, ttl)) skip; try { work } finally { Release }`. Key/TTL: `cron:booking-timeout`/50s, `cron:auto-payout`/90s, `cron:session-reminder`/4m, `cron:grace-reminder`/4m. `Enabled=false` → chạy thẳng.
Run: `dotnet test src/test/TutorHub.Infrastructure.UnitTests --filter RedisDistributedLock -v` + `dotnet test src/test/TutorHub.Api.IntegrationTests --filter "BookingTimeout|AutoPayout" -v`
Expected: PASS, 2 node cùng tick → 1 node xử lý.

- [ ] **Step 4: Commit**

```bash
git add src/backend/TutorHub.Infrastructure/Distributed/RedisDistributedLock.cs src/backend/TutorHub.Infrastructure/BackgroundServices/ src/test/TutorHub.Infrastructure.UnitTests/Distributed/
git commit -m "feat(cron): redis distributed lock for background jobs"
```

### Task 6: E2E 2-replica + kill-redis + docs — ✅ DONE (commit 3d40598)

**Files:**
- Modify: `docker-compose.yml` (profile scale api x2 cho test), `docs/redis-scaleout-spec.md`, `README.md`

- [ ] **Step 1: Ma trận 2-replica**

Run: `docker compose up --build -d` với api scale 2 + redis.
Expected: OAuth start node A → callback node B pass; ws cross-node pass; 2 node cùng tick cron → `OutboxMessages` không trùng `EventId`; `GET /health` healthy.

- [ ] **Step 2: Ma trận kill-redis**

Run: `docker stop tutorhub-redis` khi api đang chạy.
Expected: API vẫn phục vụ; OAuth từ chối rõ ràng (fail-closed, không 500 mù); cache fallback DB; cron skip + log; `/health` Degraded redis, db vẫn healthy.

- [ ] **Step 3: Full test + commit**

Run: `dotnet build src/backend/TutorHub.sln` → 0 error.
Run: `dotnet test src/test/TutorHub.Infrastructure.UnitTests src/test/TutorHub.Application.UnitTests src/test/TutorHub.Domain.UnitTests -v` → PASS.
Run: `dotnet test src/test/TutorHub.Api.IntegrationTests --filter "RateLimiting|HealthEndpoint" -v` → PASS.

```bash
git add docker-compose.yml docs/redis-scaleout-spec.md README.md docs/plans/2026-09-28-redis-phase1-ready-to-scale.md
git commit -m "docs(plan): phase1 e2e matrix and rollout notes"
```

## Ngoài phạm vi plan này (GĐ2/GĐ3, plan riêng)

Rate-limit Redis (WP3), revoke JWT per-user `ver` (WP6, chỉ khi PO duyệt kick <15p), Serilog+Seq (WP7), `TutorHub.Worker`/Hangfire (WP8), FTS `pg_trgm+unaccent` (WP9).
