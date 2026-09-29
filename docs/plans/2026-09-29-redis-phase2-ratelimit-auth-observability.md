# Redis Phase 2 (Rate-limit + Auth Revoke + Observability) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rate-limit đếm chung cross-node qua Redis, thu hồi JWT tức thì theo per-user version (ghi đè F-08 theo quyết định PO 2026-09-29), log tập trung Serilog + Seq.

**Architecture:** Mỗi feature sau flag `Redis:Features:{RateLimit,RevokeCheck}` riêng, fallback đúng hành vi cũ khi tắt; Redis chết: rate-limit fail-open + Degraded, revoke-check fail-closed cho request có auth (401 rõ ràng thay vì cho qua).

**Tech Stack:** .NET 8, StackExchange.Redis (đã có), `Serilog.AspNetCore`, `Serilog.Sinks.Seq`, `seq` container (dev/staging), xUnit.

---

## File structure map

| File | Responsibility |
|---|---|
| `Redis/RedisOptions.cs` (modify) | thêm flags `RateLimit`, `RevokeCheck` (trả nợ S1: comment GĐ1/GĐ2) |
| `Api/RateLimiting/RedisRateLimitService.cs` (create) | Lua INCR+EXPIRE, policy→permit, fail-open |
| `Api/RateLimiting/RedisRateLimitMiddleware.cs` (create) | đọc `EnableRateLimitingAttribute` từ endpoint metadata, 429 envelope cũ |
| `Api/Configuration/RateLimitingSetup.cs` (modify) | giữ nguyên cho mode tắt (fallback) |
| `Api/Program.cs` (modify) | pipeline có điều kiện + Serilog host + Seq |
| `Domain/Entities/User.cs` + migration (modify/create) | `TokenVersion` (default 0) + `BumpTokenVersion()` |
| `Infrastructure/Authentication/JwtService.cs` (modify) | claim `ver` |
| `Api/Middlewares/TokenRevocationMiddleware.cs` (create) | sau `UseAuthentication`: `token.ver < cachedVer` → 401 |
| Ban/Suspend/ChangePassword handlers (modify) | bump version + xóa cache `auth:ver:{userId}` |
| `Api/Middlewares/CorrelationIdMiddleware.cs` (modify) | `LogContext.PushProperty("CorrelationId")` |
| `docker-compose.yml`, `.env.example`, `appsettings.json` (modify) | `seq` service + `Seq__*`, `Redis__Features__*` mẫu |
| `CLAUDE.md` (modify) | F-08 bị ghi đè: revoke tức thì |
| Tests | rate-limit 2 mode + cross-node; revoke bump/kick; Serilog boot |

## Task outlines (chi tiết code ở Pass 2)

### Task 1: WP3 rate-limit Redis (fail-open) — ✅ DONE (commits d062970 + b637b19; spec APPROVED; quality APPROVED after re-review)

**Files:**
- Modify: `src/backend/TutorHub.Infrastructure/Redis/RedisOptions.cs` (thêm `RateLimit`, `RevokeCheck` flags + comment GĐ1/GĐ2 — trả nợ S1)
- Create: `src/backend/TutorHub.Api/RateLimiting/RedisRateLimitService.cs`
- Create: `src/backend/TutorHub.Api/RateLimiting/RedisRateLimitMiddleware.cs`
- Modify: `src/backend/TutorHub.Api/Program.cs` (pipeline điều kiện)
- `RateLimitingSetup.cs` giữ nguyên 100% (fallback khi tắt)
- Test: `src/test/TutorHub.Api.IntegrationTests/RateLimitingTests.cs` (mở rộng) + unit `RedisRateLimitServiceTests.cs`

- [ ] **Step 1: Thêm flags + viết test đỏ cho service**

`RedisFeatureFlags` thêm `public bool RateLimit { get; set; } = true;` + `RevokeCheck`. Test đỏ: fake `IDatabase` (theo mẫu `IRedisStringCommands` Task 2 — nếu `IDatabase.ScriptEvaluateAsync` khó fake, thêm seam `IRedisRateLimitCommands { Task<long> IncrementWithExpiryAsync(key, windowSeconds) }`):
```csharp
[Fact] public async Task OverLimit_ReturnsFalse_WithRetryAfter() {
    // permit 10: 10 lần true, lần 11 false; RetryAfter trong (0,60]
}
```
Run filter → FAIL (type chưa có).

- [ ] **Step 2: Implement service Lua nguyên tử**

```lua
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c
```
Key `ratelimit:{policy}:{ip}:{bucket}`, `bucket = epochSeconds / 60`, `ARGV[1] = 60`. Permit giữ nguyên (`auth-strict=10`, `payment=60`, global=300). `RedisException` → fail-open: return allowed + `LogWarning` 1 lần (không throw). `RetryAfter = 60 - (epochSeconds % 60)`.

- [ ] **Step 3: Middleware đọc attribute + pipeline điều kiện**

`RedisRateLimitMiddleware`: `endpoint = context.GetEndpoint()` → `GetMetadata<EnableRateLimitingAttribute>()?.Policy ?? null` → null nghĩa là global policy (giữ đúng ngữ nghĩa `GlobalLimiter` hiện tại). IP = `ClientKey` logic cũ (copy, tôn trọng `ReverseProxy`). Over-limit → 429 + header `RetryAfter` + đúng envelope `ApiResponse<object>.FailureResult("Too many requests. Please retry later.")` camelCase (copy từ `OnRejected`, không sửa câu chữ). `Program.cs`:
```csharp
if (redis.Enabled && redis.Features.RateLimit) app.UseMiddleware<RedisRateLimitMiddleware>();
else app.UseRateLimiter();
```
(vị trí cũ dòng 295, sau `UseCors`, trước `UseAuthentication`).

- [ ] **Step 4: Xanh + commit**

Run filter service tests → PASS. Run `RateLimitingTests` 2 mode (`Redis:Enabled=false` và `true` + redis thật/fake) → PASS cả hai, envelope + header giữ nguyên. Build 0 warn.
```bash
git add <các file trên>
git commit -m "feat(ratelimit): distributed fixed-window on redis with fail-open"
```

### Task 2: WP6 revoke JWT per-user ver (fail-closed, ghi đè F-08) — ✅ DONE (commits 911e082 + e1c5d53; spec APPROVED; quality APPROVED after re-review)

**Files:**
- Modify: `src/backend/TutorHub.Domain/Entities/User.cs` (+`TokenVersion` int default 0 + `BumpTokenVersion()`)
- Create: migration `AddUserTokenVersion` (cột `TokenVersion` int not null default 0)
- Modify: `src/backend/TutorHub.Infrastructure/Authentication/JwtService.cs` (claim `"ver"`)
- Create: `src/backend/TutorHub.Api/Middlewares/TokenRevocationMiddleware.cs`
- Modify: `BanUserCommandHandler.cs`, `SuspendUserCommandHandler.cs`, `ChangePasswordCommandHandler.cs` (bump + del cache)
- Modify: `src/backend/TutorHub.Api/Program.cs` (`UseMiddleware` sau `UseAuthorization`)
- Modify: `CLAUDE.md` (dòng F-08) + spec §WP6
- Test: `TokenRevocationTests.cs` (integration)

- [ ] **Step 1: Entity + migration + claim (test đỏ)**

`User.TokenVersion { get; private set; }` + `public void BumpTokenVersion() => TokenVersion++;`. Migration EF (`dotnet ef migrations add AddUserTokenVersion -p ...Infrastructure -s ...Api`). `JwtService.GenerateAccessToken` thêm `new Claim("ver", user.TokenVersion.ToString())`. Test đỏ: login → decode `ver==0`; bump → login mới `ver==1`.

- [ ] **Step 2: Middleware kiểm tra (fail-closed)**

Sau `UseAuthorization`: chỉ chạy khi `User.Identity.IsAuthenticated` và flag `RevokeCheck` bật. Đọc `ver` claim (thiếu → 401 rõ ràng "Token version missing"), `sub` → userId. Redis `GET auth:ver:{userId}`: hit → so sánh; miss → đọc DB `Users.TokenVersion`, `SET` TTL = 15p + 60s skew. `tokenVer < cachedVer` → 401 JSON envelope (dùng `ApiResponse` failure, message "Session has been revoked. Please sign in again."). Redis chết → 401 rõ ràng "Authentication service unavailable" (fail-closed, không cho qua — quyết định SPEC §2 cho auth). Không bao giờ throw mù.

- [ ] **Step 3: Bump ở 3 chỗ + xóa cache**

`BanUser`/`SuspendUser`/`ChangePassword` sau `SaveChanges`: `user.BumpTokenVersion()` (phải bump TRƯỚC save để persist cùng transaction — đọc handler rồi đặt đúng chỗ), `IDistributedCache.RemoveAsync($"auth:ver:{userId}")` (best-effort try/catch, miss lần sau đọc DB). Unban/reactivate KHÔNG bump (token cũ đã chết theo status vẫn chết; policy: chỉ bump khi thu hẹp quyền).

- [ ] **Step 4: Docs F-08 + xanh + commit**

`CLAUDE.md:8` sửa thành: revoke tức thì qua `TokenVersion` (quyết định PO 2026-09-29 ghi đè F-08 cũ). Test: ban user có 2 token đang bay → cả 2 request tiếp theo 401 trong 1 RTT; token login sau ban → 200. Đo p95 trước/sau (1 GET Redis/request). Build 0 warn.
```bash
git commit -m "feat(auth): instant token revoke via per-user version"
```

### Task 3: WP7 Serilog + Seq — ✅ DONE (commits b2e59e0 + 81f6b62; spec APPROVED; quality APPROVED)

**Files:**
- Modify: `src/backend/TutorHub.Api/TutorHub.Api.csproj` (`Serilog.AspNetCore`, `Serilog.Sinks.Seq` — chốt version tương thích net8 khi implement)
- Modify: `src/backend/TutorHub.Api/Program.cs` (`builder.Host.UseSerilog(...)`)
- Modify: `CorrelationIdMiddleware.cs` (`LogContext.PushProperty("CorrelationId", id)` quanh `_next`)
- Modify: `docker-compose.yml` (service `seq`, image `datalust/seq:latest`, volume `seqdata`, chỉ chạy ở dev/staging — ghi chú), `.env.example` (`Seq__ServerUrl`, `Seq__ApiKey`), `appsettings.json` (`Seq:{ServerUrl:"",ApiKey:""}`)
- Test: boot test (log khởi động có CorrelationId khi request qua middleware)

- [ ] **Step 1: Packages + UseSerilog skeleton**

`dotnet add ... Serilog.AspNetCore` + `Serilog.Sinks.Seq`. `Program.cs` đầu file (trước `builder.Build`): đọc `Seq:ServerUrl` — rỗng → chỉ console JSON; có → thêm Seq sink. Enrich: `FromLogContext`, `WithMachineName`, `WithEnvironmentName`. MinimumLevel override: `Microsoft.AspNetCore` Warning (giữ như appsettings hiện tại), `System` Warning.

- [ ] **Step 2: CorrelationId + lọc ồn + cấm secret**

Middleware bọc `using (LogContext.PushProperty("CorrelationId", correlationId)) await _next(context);`. Filter: bỏ log request `/health`, `/health/live` (dùng `Filter.ByExcluding("RequestPath like '/health%'")` hoặc middleware short-circuit đã có — chọn cách không đụng pipeline). Ghi chú cấm log `Secret/PasswordHash/Token/ClientSecret` vào `appsettings` comment + kiểm tra `GlobalExceptionHandler` không log token.

- [ ] **Step 3: Compose Seq + xanh + commit**

`seq` service: port `5341`, `ACCEPT_EULA=Y`, volume `seqdata`, retention mặc định (ghi chú đổi ở prod). Api env `Seq__ServerUrl=http://seq:5341`. Boot dev → Seq UI thấy log có CorrelationId; prod thiếu `Seq__ServerUrl` → console JSON, không crash.
```bash
git commit -m "feat(logging): serilog with seq sink and correlation enrichment"
```

### Task 4: E2E + docs close-out — ✅ DONE (commit bdb4705; spec APPROVED)

**Files:** `docker-compose` scale test, `docs/redis-scaleout-spec.md` (WP3/WP6/WP7 nghiệm thu), `README.md`

- [x] **Step 1: Ma trận kill-redis (live, nếu có docker)**

  Rate-limit Redis chết → request cho qua + `LogWarning` + `/health` Degraded (fail-open). Revoke-check Redis chết → 401 rõ ràng (fail-closed). Không docker → ghi NOT-RUN + lý do, chốt bằng unit (throwing-seam fallback, health Degraded).
  Kết quả: không docker/PG/live Redis trong sandbox → NOT-RUN live matrix, đã chốt bằng seam: `RedisDown_FailOpen_*` (3 tests), revoke fail-closed (`RedisDown/DatabaseDown/MissingServices`), `RedisHealthCheckTests` mới (disabled→Healthy, thiếu multiplexer→Degraded, không bao giờ Unhealthy). DB-backed (`RateLimitingTests` 2 mode, revoke p95) NOT-RUN — Npgsql từ chối `localhost:5433`, đã probe xác nhận. OAuth callback Redis-outage vẫn 500-blind (middleware bỏ qua unauthenticated, đường OAuth không đổi) → giữ follow-up map `RedisException` → 409/503.

- [x] **Step 2: Full gates + commit (KHÔNG gồm docs plan/spec — để untracked tới cuối như GĐ1)**

  `dotnet build` 0 warn; unit 3 suite PASS (Domain 210 + Infrastructure 44 + Application 415 = 669); integration subset không-DB 53 PASS; `RateLimitingTests` 2 mode NOT-RUN (cần PG); revoke p95 chưa đo — chi phí by-design: 1 Lua eval/request (rate-limit), 1 Redis GET/authenticated request (revoke). Commit theo từng task (không gộp).

## Ngoài phạm vi (GĐ3, plan riêng)

Worker riêng/Hangfire (WP8), FTS tiếng Việt `pg_trgm+unaccent` (WP9), per-jti deny cho logout 1 thiết bị (chỉ khi PO yêu cầu).
