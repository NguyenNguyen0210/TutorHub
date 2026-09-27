# SPEC — Kích hoạt đăng nhập Google (OAuth client 26/09/2026)

> Trạng thái: **sẵn sàng triển khai** (2026-09-27).
> Phạm vi: **chỉ Google**. Facebook giữ nguyên (tắt), Apple ngoài phạm vi.
> Secret thật đã nằm trong `.env` (gitignored) — tài liệu này **không chứa secret**,
> chỉ nêu tên biến.

Tài liệu liên quan: `docs/external-auth-spec.md` (thiết kế gốc),
`docs/external-auth-setup.md` (thao tác console).

---

## 1. Bối cảnh & hiện trạng đo thật

| Tầng | Trạng thái | Bằng chứng |
|---|---|---|
| Backend OAuth | **Đã có** | `AuthController.cs:117-154` (3 endpoint `oauth/providers`, `oauth/{provider}/start`, `oauth/{provider}/callback`); `GoogleAuthProvider.cs`; `CompleteExternalLoginCommandHandler.cs`; `ExternalLogin.cs` + unique `(Provider, ProviderUserId)` |
| `.env` | **Vừa tạo** | Copy từ `.env.example`, đã điền `ExternalAuth__Google__ClientId/Secret`, `git check-ignore` xác nhận `.env` bị ignore |
| Google Console | Client mới tạo 26/09/2026, status **Enabled**, đang ở chế độ **Testing** (chỉ `test users` đăng nhập được) | Screenshot của bạn + banner "OAuth access is restricted to the test users" |
| Frontend | **Đã có (Task 2-5 plan 2026-09-27)** | `Login.jsx:161-163` và `Register.jsx` vẫn `toast('sẽ sớm có mặt')`; không có `OAuthCallback.jsx`, không có service gọi `/oauth/*`, không có route `/auth/oauth/callback` |
| `docker-compose.yml` | **Đã forward (Task 1)** | Service `api` chưa forward `ExternalAuth__*` → chạy bằng compose thì Google vẫn bị coi là "chưa cấu hình" |

Kết luận: việc "implement" còn lại là **(a)** xác nhận cấu hình console,
**(b)** vá compose, **(c)** làm frontend callback + nối nút Google.
Backend không cần sửa (trừ khi kiểm thử phát hiện lỗi).

---

## 2. Cấu hình nhạy cảm — đã xong, không chạm lại

- File: `.env` ở root repo (đã gitignored theo `.gitignore:58`, `! .env.example` giữ lại template).
- Đã điền:
  ```dotenv
  ExternalAuth__RedirectUri=http://localhost:5173/auth/oauth/callback
  ExternalAuth__Google__ClientId=<đã điền từ screenshot>
  ExternalAuth__Google__ClientSecret=<đã điền từ screenshot>
  ```
- Facebook để trống → tắt đúng như thiết kế (`IsConfigured == false` thì ẩn nút, endpoint trả 400 chứ không 500 — `ExternalAuthOptions.cs:24-25`, `InfrastructureServiceCollectionExtensions.cs:140-144`).
- Lưu ý từ banner vàng của Google: **client secret chỉ hiện 1 lần**. Nếu mất, phải **Reset secret** trong console và cập nhật lại `.env`. Không có cách xem lại.
- Không bao giờ commit `.env`, không dán secret vào docs/issue/chat. Quét bằng `pwsh ./scripts/scan-secrets.ps1` trước mỗi push.

---

## 3. Việc cần làm ở Google Console (bạn làm, ~5 phút)

1. **Authorized redirect URI** phải khớp tuyệt đối:
   `http://localhost:5173/auth/oauth/callback`
   (sai một dấu `/` cuối hay `http`/`https` đều fail ở bước đổi code).
2. **OAuth consent screen → Test users**: thêm email bạn dùng để test.
   Ở chế độ Testing, email ngoài danh sách bị Google chặn ngay, và màn consent
   hiện cảnh báo "Google chưa xác minh" → bấm **Advanced → Go to TutorHub (unsafe)**.
3. Scope code yêu cầu: `openid email profile` (mặc định trong `appsettings.json:51`).
4. Production sau này: đổi `ExternalAuth__RedirectUri` sang
   `https://<domain>/auth/oauth/callback`, đăng ký lại URI ở console,
   chuyển consent sang Production + xin xác minh Google, thêm domain vào
   `Cors__AllowedOrigins`. Xem `docs/external-auth-setup.md` §4.

---

## 4. Luồng đã chốt (không đổi)

```
Browser → GET /api/v1/auth/oauth/google/start → { authorizeUrl, state }
Browser → redirect Google → GET /auth/oauth/callback?code&state (route SPA)
SPA → POST /api/v1/auth/oauth/google/callback { code, state }
API → đối chiếu state (1 lần, TTL 10 phút) → server đổi code→token
    → lấy profile, yêu cầu email_verified → linking → trả AuthResponseDto
    (giống hệt login mật khẩu: access + refresh rotation)
```

- **Callback là POST.** Không tạo endpoint GET callback (code trong URL sẽ lọt vào
  history/log/Referer — `docs/external-auth-setup.md` §5).
- **PKCE S256**, `state` 256-bit server-side, dùng lần hai bị từ chối (chống replay/CSRF).
- **Không tin email từ client.** Body callback không có email; server tự lấy từ Google.
- Ghép tài khoản (`external-auth-spec.md` §2.3):
  - Có `ExternalLogin(Google, sub)` → login, cập nhật `LastLoginAt`.
  - Chưa có + trùng email **và** `email_verified=true` → tạo link, **giữ nguyên Role**.
  - Chưa có + email mới → tạo `User` **role Student** + `StudentProfile`.
  - Provider không xác minh email → **từ chối**, không ghép.
  - `PasswordHash` = hash của secret ngẫu nhiên 64 byte → login mật khẩu không thể
    thành công cho tới khi user đặt mật khẩu qua `ChangePassword`.

---

## 5. Việc còn lại — backend: 1 dòng compose

`docker-compose.yml` service `api.environment` chưa có 3 biến nên container
Production luôn thấy Google tắt. Thêm:

```yaml
ExternalAuth__RedirectUri: ${ExternalAuth__RedirectUri:-http://localhost:5173/auth/oauth/callback}
ExternalAuth__Google__ClientId: ${ExternalAuth__Google__ClientId}
ExternalAuth__Google__ClientSecret: ${ExternalAuth__Google__ClientSecret}
```

`dotnet run` local không cần (đã có loader `.env` Development-only trong
`Program.cs:25-52`, env thật luôn thắng `.env`).

---

## 6. Việc còn lại — frontend (phần implement chính)

> `docs/external-auth-spec.md` §6.1 ghi "Frontend đã có" là **sai so với code
> hiện tại** — cần làm mới các file sau (JS thuần `.jsx`, Tailwind token
> `tokens.css`, không hardcode hex):

1. `src/frontend/src/services/externalAuth.service.js` (mới):
   `getProviders()`, `startLogin('google')`, `completeCallback({code, state})`,
   dùng chung axios instance + refresh rotation trong `services/api.js`.
2. `src/frontend/src/pages/auth/OAuthCallback.jsx` (mới) + route
   `/auth/oauth/callback` trong `routes/index.jsx`:
   đọc `code`/`state` từ query → POST → lưu token vào `authStore.js`
   → điều hướng theo role; lỗi `state` hết hạn/dùng lại → báo "link hết hạn,
   hãy bắt đầu lại" + nút quay về login. Không hiển thị `code` ra UI.
3. `Login.jsx` / `Register.jsx`: thay `toast('sẽ sớm có mặt')` bằng luồng thật
   cho Google; **ẩn nút Google** khi `GET /oauth/providers` không chứa `Google`;
   giữ toast cho Facebook/Apple (chưa bật). Tài khoản mới luôn Student;
   Tutor vẫn qua `/tutor/application`.
4. Không lưu `client secret`, `code`, `code_verifier` vào `localStorage`.

---

## 7. Cổng kiểm (acceptance)

1. `GET /api/v1/auth/oauth/providers` → `providers: ["Google"], enabled: true`.
2. `GET /api/v1/auth/oauth/google/start` → 200, `authorizeUrl` chứa
   `code_challenge_method=S256`, `redirect_uri` URL-encode đúng §3.1,
   `prompt=select_account`; `state` ~43 ký tự.
3. `POST .../google/callback` với `state` đã dùng → 400 "no longer valid"
   (khác message với fail ở token-exchange → chứng minh dùng 1 lần).
4. Login bằng **test user** thành công → nhận `AuthResponseDto`, role đúng
   (user cũ giữ role; user mới = Student); login mật khẩu cho tài khoản OAuth
   thuần túy **thất bại**.
5. Email ngoài test users → Google chặn ngay (lỗi phía Google, không phải 500 API).
6. `dotnet build src/backend/TutorHub.sln` 0 warning (TreatWarningsAsErrors),
   `npm run lint` 0 warning, `pwsh ./scripts/scan-secrets.ps1` sạch.
7. Chưa bật provider (xóa secret khỏi env) → `providers: []`, nút Google ẩn,
   gọi thẳng endpoint → 400 message rõ ràng, API vẫn boot bình thường.

---

## 8. Giới hạn đã biết (không sửa trong đợt này)

- State lưu RAM (`MemoryExternalAuthStateStore`) → single-node; scale ngang cần
  Redis (fail-closed, thử lại được).
- Chưa có gỡ liên kết / thu hồi quyền → xóa tay bảng `ExternalLogins` nếu cần.
- Google đổi email được nên khóa liên kết là `sub`, không phải email.
- `StartupSecretGuard` canh `ExternalAuth:*:ClientSecret` — dán nhầm giá trị
  mẫu `change_me/...` sẽ chặn khởi động ngay thay vì fail mù ở Google.
