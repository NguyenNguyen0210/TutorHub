# SPEC — Redis cho scale-out (SignalR / Rate-limit / OAuth state / Cron lock)

> Trạng thái: **Phase 1 (WP0/WP1/WP2/WP4/WP5) đã triển khai xong — xem §6 nghiệm thu**.
> Phạm vi chốt: **1 Redis chung**. Không Redis thứ hai, không chuyển dữ liệu durable (tiền, revoke gốc, outbox) sang Redis.

---

## 0. Đối chiếu roadmap bạn đưa → quyết định

| Đề xuất của bạn | Quyết định | Lý do / điều chỉnh |
|---|---|---|
| GĐ1: `redis:7-alpine` trong compose | **Đồng ý** | WP0, làm đầu tiên |
| GĐ1: SignalR backplane + OAuth state Redis | **Đồng ý** | WP1+WP2, đúng thứ tự ưu tiên (OAuth trước vì fail-closed) |
| GĐ1: Distributed cache Subjects + cài đặt sàn | **Đồng ý có điều kiện** | WP5. Subjects đọc nhiều/ghi ít → cache tốt. Bắt buộc có invalidate khi admin CUD + chống stampede. `PlatformFeeRate` TTL ngắn 1–5p + xóa khi `PlatformSettingChangedEvent` |
| GĐ2: Rate-limit sang Redis | **Đồng ý** | WP3. Giữ nguyên số `10/60/300 per 1m`, envelope + `Retry-After` |
| GĐ2: Revoke JWT tức thì bằng Redis blacklist | **Đồng ý có điều kiện — mặc định KHÔNG bật** | JWT hiện có `Jti` (`JwtService.cs:38`), access 15p. Blacklist = lookup Redis mỗi request có auth → +latency toàn bộ API. Chỉ bật nếu sản phẩm yêu cầu kick/ban < 15p. Và làm theo kiểu **per-user version** (1 key/user), không phải per-jti blacklist tràn lan. Chi tiết WP6 |
| GĐ2: Serilog + Seq tập trung log | **Đồng ý** | WP7. Đã có `CorrelationIdMiddleware` + `AuditLog.CorrelationId` nên chỉ việc enrich, không sửa flow. Lưu ý Seq tốn disk/retention, cấm log secret/PII |
| GĐ3: Tách job sang Worker riêng / Hangfire | **Đồng ý 1 nửa: Worker riêng trước, Hangfire sau** | 6 job hiện tại (`BookingTimeout`, `OutboxDispatcher`, `EmailDelivery`, `SessionReminder`, `GracePeriodReminder`, `AutoPayout`) đa số đã lease DB. Tách `TutorHub.Worker` + flag `Worker:Enabled` là đủ. Hangfire (+Postgres storage + dashboard) chỉ khi cần retry UI/trigger tay — nó kéo thêm bảng, polling, ops. WP8 |
| GĐ3: Tìm kiếm tiếng Việt FTS trên Postgres | **Đồng ý** | Code hiện `ToLower().Contains()` khắp nơi (`GetPublicSubjectsQueryHandler.cs:33`, `GetPublicServicesQueryHandler.cs:72-76`, `GetTutorsQueryHandler.cs:88-133`) → full-scan, không dấu (`toan` ≠ `toán`). Làm `pg_trgm + unaccent` trước, `tsvector` ranking sau. Không cần Elasticsearch. WP9 |

---

## 1. Bối cảnh (giữ nguyên bản 1)

| Phần | File hiện tại | Hỏng khi 2 replica |
|---|---|---|
| SignalR | `InfrastructureServiceCollectionExtensions.cs:158` trần; `Api/Program.cs:299-300` | group RAM từng node, mất tin cross-node |
| Rate-limit | `Api/Configuration/RateLimitingSetup.cs:33-91` counter RAM/IP | `permit × N node` |
| OAuth state | `MemoryExternalAuthStateStore.cs:25-75` `IMemoryCache` | landing sai node → reject |
| Cron không lease | `BookingTimeoutBackgroundService` + `ProcessBookingTimeoutsCommandHandler.cs:31-35`; `AutoPayoutJob.cs:63-93` phase 1 | double `Expire()` / double `GracePeriodStartedEvent` |
| Đã an toàn | Outbox/Email lease DB; webhook `FOR UPDATE Transactions`; `RefreshTokens/Users/Wallets` Postgres; reminders unique dedup | Không động vào |
| Search | `ToLower().Contains()` ~10 handler | chậm + không dấu, chưa phải Redis mà là Postgres FTS |
| Log | `ILogger` mặc định, chưa tập trung | multi-node khó trace |

`net8.0`, chưa có package Redis/Serilog/Hangfire nào. Compose chỉ `postgres+api+seed`.

---

## 2. Thiết kế chung

- Một Redis, `abortConnect=false`, flag tổng `Redis:Enabled` + flag từng feature `Redis:Features:{OAuth,SignalR,RateLimit,CronLock,Cache,RevokeCheck}`. Tắt flag = về đúng code memory/DB cũ (không xóa code cũ). Rollback không redeploy.
- Redis chết lúc chạy: OAuth fail-closed; rate-limit fail-open + log + health `Degraded`; SignalR degrade local; cron skip kỳ; cache fallback DB; revoke-check fail-closed hay fail-open **chọn lúc bật WP6** (khuyến nghị fail-closed cho ban/security, fail-open cho read thường — tách 2 middleware).
- Package pin `8.0.11` (cùng train EFCore): `Microsoft.Extensions.Caching.StackExchangeRedis`, `Microsoft.AspNetCore.SignalR.StackExchangeRedis`.

---

## 3. Việc phải làm

### WP0 — Redis infra + health (GĐ1)
Compose thêm `redis:7-alpine + volume redisdata + redis-cli ping healthcheck`; api `depends_on`; env `ConnectionStrings__Redis`, `Redis__{Enabled,InstanceName}`. `RedisHealthCheck` tự viết (`PingAsync`, timeout 2s, `Degraded` không restart oan). `Enabled=false` → boot không cần redis.

### WP1 — OAuth state phân tán (GĐ1)
Mới `DistributedExternalAuthStateStore : IExternalAuthStateStore` dùng `IConnectionMultiplexer.StringGetDeleteAsync` (nguyên tử, Redis ≥ 6.2) thay vì `IDistributedCache`. Giữ key/TTL/provider-check cũ. 2 node cùng `Consume` → đúng 1 thắng.

### WP2 — SignalR backplane (GĐ1)
`AddSignalR().AddStackExchangeRedis(conn, o.ChannelPrefix="TutorHub")`. Không đổi Hub/group. Đo 2 node cross-`Group()`.

### WP5 — Cache Subjects + cài đặt sàn (GĐ1, mới từ roadmap)
- Key `subj:list:{hash(filter)}` TTL 5p + `subj:{id}` TTL 10p; `platform:setting:{key}` TTL 1–5p. κατοχύρωση chống stampede bằng lock ngắn hoặc `GetOrCreate` single-flight.
- Invalidate: admin create/update/delete Subject/Category + `PlatformSettingChangedEvent` → `RemoveAsync` đúng key (không `FlushDB`).
- Chấp nhận: hit-rate log, admin sửa → đọc lại mới trong ≤ TTL cam kết; Redis chết → fallback DB.

### WP3 — Rate-limit Redis (GĐ2)
Lua `INCR+EXPIRE` key `ratelimit:{policy}:{ip}:{bucket}`, giữ `ClientKey/RemoteIpAddress/ReverseProxy` logic + envelope 429 hiện tại. Redis chết → cho qua + log.

### WP6 — Revoke JWT (GĐ2, conditional — chỉ làm khi PO xác nhận cần kick < 15p)
Không blacklist từng `jti` tràn lan. Làm **per-user auth version**:
- JWT thêm claim `ver` = `User.TokenVersion` (cột mới, default 0; tăng khi ban/suspend/đổi pass/logout-all).
- Redis key `auth:ver:{userId}` TTL = max access lifetime (15p+skew), fallback DB khi miss.
- Middleware sau `UseAuthentication`: nếu `token.ver < cachedVer` → 401. Revoke 1 session đơn lẻ mới dùng `auth:deny:{jti}` TTL = thời gian còn lại của token đó (ghi khi logout 1 thiết bị).
- Chấp nhận: ban → tối đa 1 request cũ lọt; overhead 1 `GET` Redis/request auth; đo p95 trước/sau.

### WP7 — Serilog + Seq (GĐ2)
`Serilog.AspNetCore + Seq sink`, JSON console + Seq; enrich `CorrelationId` (từ middleware sẵn có), env, version; filter bỏ health-check ồn; retention Seq + cấm log `Secret/PasswordHash/Token`. Compose thêm `seq` (chỉ dev/staging; prod dùng Seq cloud hoặc Loki — chốt lúc deploy).

### WP4 — Cron lock (làm cùng GĐ1, đừng đợi GĐ3)
`RedisDistributedLock` (`SET NX PX` + Lua compare-del). Key/TTL: `cron:booking-timeout` 50s/60s, `cron:auto-payout` 90s/120s, reminders 4m/5m (optional). Không lấy lock → skip.

### WP8 — Worker riêng / Hangfire (GĐ3)
Bước 1 (làm trước): tách `TutorHub.Worker` host chung code job, flag `Worker:Enabled` (API `false`, worker `true`) — hết double-run mà không thêm lib.
Bước 2 (chỉ nếu cần dashboard/retry tay): Hangfire + `Hangfire.PostgreSql` storage, giữ Outbox hiện tại (không thay Hangfire làm outbox tiền). Ghi nhận chi phí: thêm bảng `hangfire.*`, polling DB, bảo mật dashboard.

### WP9 — FTS tiếng Việt Postgres (GĐ3)
Bước 1: bật `unaccent, pg_trgm`, index `GIN (unaccent(lower(col)) gin_trgm_ops)` cho `Services.Title/Description`, `Subjects.Name`, `Users.FullName`; query normalize cả 2 vế (bỏ dấu + lower) qua `EF.Functions` / raw SQL — sửa `ToLower().Contains()` hiện tại, không đổi API.
Bước 2 (khi cần ranking): cột generated `tsvector` + `plainto_tsquery` + `ts_rank`, GIN index. Đo `EXPLAIN` trước/sau với seed hiện tại.

---

## 4. Cổng kiểm

1. `Enabled=false`, không redis: test cũ pass, `/health` healthy.
2. 2 replica + redis: OAuth sai node pass; SignalR cross-node pass; rate-limit tổng đúng ngưỡng; cron không double `EventId`.
3. Kill redis: API vẫn phục vụ, rate-limit fail-open có log, OAuth từ chối rõ ràng.
4. WP5: admin sửa subject/setting → đọc mới đúng hạn; kill redis → fallback DB.
5. WP6 (nếu bật): ban → token cũ 401 trong 1 RTT; p95 không vỡ SLA.
6. WP9: `toan` tìm ra `toán`, `EXPLAIN` dùng index.

## 5. Rollout

WP0 → WP1 → WP2 → WP5 → WP3 → WP4 → WP7 → (WP6 khi PO duyệt) → WP8 bước 1 → WP9 → (WP8 bước 2 + Hangfire nếu cần). Mỗi WP 1 PR + flag riêng.

## 6. Nghiệm thu Phase 1 (2026-09-29, Task 6)

WP0 (infra/options/healthcheck), WP1 (OAuth state phân tán), WP2 (SignalR
backplane), WP5 (cache Subjects/settings), WP4 (cron lock) đã merge trên nhánh
`feature/redis-phase1-ready-to-scale`.

- Ma trận 2-replica live (docker) KHÔNG chạy lại ở đây: docker daemon của môi
  trường verify tắt, compose không khởi động được. Ngữ nghĩa cross-node được
  chốt bằng unit test: `Create_OnNodeA_Consume_OnNodeB_SucceedsOnce` (OAuth
  start node A → consume node B, single-use),
  `TwoWorkers_OnlyOneAcquires` (cron lock mutual-exclusion),
  `SignalRFlagOn_*` (backplane wiring + `ChannelPrefix=TutorHub`,
  `AbortOnConnectFail=false`), `CacheInvalidationTests` (8 tests). Live 2-node
  SignalR cross-node + kill-redis degrade đã được chứng minh ở các task trước.
- Kill-redis tương đương được chốt một phần bằng unit test: cache outage fallback DB
  (`CacheOutage_*`), OAuth fail-closed ở mức store (`Create_WhenRedisRejectsSets_Throws`).
  Hạn chế đã biết: OAuth callback (và start khi mất kết nối thật) hiện trả 500 envelope —
  vẫn fail-closed (không cấp token) nhưng mù, cần follow-up map `RedisException` → 409/503
  với thông điệp rõ ràng. Lock outage → skip kỳ và `RedisHealthCheck` trả `Degraded`
  (không bao giờ `Unhealthy` để tránh restart oan) chỉ đúng theo kiểm tra code, chưa có
  unit test chốt. HTTP 200 chỉ đúng cho các đường non-OAuth (cache fallback, cron skip,
  health Degraded).
- Gates: `dotnet build TutorHub.sln` 0 warning 0 error; unit suites
  Infrastructure 40 + Application 415 + Domain 208 = 663 passed, 0 failed.
  `Api.IntegrationTests --filter "RateLimiting|HealthEndpoint"` NOT-RUN:
  cần Postgres `127.0.0.1:5433`, kết nối bị từ chối (không có docker/PG local).

## 7. Nghiệm thu Phase 2 (2026-09-29, Task 4)

WP3 (rate-limit Redis), WP6 (revoke JWT per-user `ver`), WP7 (Serilog + Seq)
đã merge trên nhánh `feature/redis-phase2-ratelimit-auth-observability`
(Tasks 1–3: `d062970`+`b637b19`, `911e082`+`e1c5d53`, `b2e59e0`+`81f6b62`;
Task 4: commit docs này).

- Ma trận kill-redis live (docker, 2 replica) KHÔNG chạy: môi trường verify
  không có docker daemon, Postgres, hay live Redis (kế thừa từ GĐ1+GĐ2).
  Ngữ nghĩa outage được chốt ở mức seam gần nhất, không cần mạng:
  - Rate-limit Redis chết → fail-open: request cho qua + `LogWarning`
    (`RedisRateLimitServiceTests.RedisDown_FailOpen_AllowsRequest`,
    `RedisRateLimitMiddlewareTests.RedisDown_FailOpen_CallsNext` — cho qua tới
    handler, envelope 429 giữ nguyên khi Redis sống).
  - Revoke-check Redis/DB chết → fail-closed: 401 rõ ràng
    `"Authentication service unavailable."`
    (`TokenRevocationMiddlewareTests.RedisDown_*`,
    `DatabaseDown_*`, `MissingServices_*` — không bao giờ cho qua, không throw mù).
  - `RedisHealthCheck` không bao giờ `Unhealthy`: disabled → `Healthy`,
    enabled thiếu multiplexer → `Degraded` (`RedisHealthCheckTests`, 2 tests mới,
    trả nợ ghi chú "chưa có unit test chốt" ở §6).
- Chi phí by-design (chưa đo p95 live, không có staging Redis):
  1 Lua eval (`INCR+EXPIRE`) mỗi request qua `RedisRateLimitMiddleware`;
  1 Redis `GET` mỗi authenticated request qua `TokenRevocationMiddleware`
  (+ 1 indexed DB read khi cache miss, cache lại 16p = 15p access + 60s skew).
  Đo p95 trước/sau là follow-up staging, không chặn nghiệm thu.
- Hạn chế đã biết (còn đúng sau Phase 2): OAuth callback/start khi Redis mất
  kết nối thật vẫn trả 500 envelope — vẫn fail-closed (không cấp token) nhưng
  mù. `TokenRevocationMiddleware` không đổi đường này: nó bỏ qua request chưa
  authenticate (đã pin bởi `UnauthenticatedRequest_SkipsCheck`), OAuth callback
  chưa có JWT nên đi thẳng vào MediatR → store ném `RedisException` → handler
  chung. Follow-up giữ nguyên từ §6: map `RedisException` → 409/503 với thông
  điệp rõ ràng.
- Gates (chạy thật trong sandbox này): `dotnet build TutorHub.sln` 0 warning
  0 error; unit suites Domain 210 + Infrastructure 44 (gồm 2 health mới) +
  Application 415 = 669 passed, 0 failed; integration subset không cần DB
  53 passed, 0 failed (filter: `RedisRateLimitServiceTests`,
  `RedisRateLimitMiddlewareTests`, `TokenRevocationMiddlewareTests`,
  `SerilogCorrelationTests`, `RedisEnabledRateLimitingTests`, `CorsOriginsTests`,
  `StartupSecretGuardTests`, `DevelopmentOnlyEndpointsTests`).
  DB-backed tests (`RateLimitingTests` 2 mode, revoke p95, `HealthEndpointTests`)
  NOT-RUN: `IntegrationTestBase` gọi `EnsureDatabase()` → Npgsql từ chối kết nối
  (`Host=localhost;Port=5433`, không có Postgres/docker trong sandbox) — đã
  probe 1 case để xác nhận lỗi môi trường, không sửa test.
