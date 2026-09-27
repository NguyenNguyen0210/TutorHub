# SPEC — Đăng nhập bằng Google / Facebook

> Trạng thái: **đang thực thi** (2026-09-26).
> Phạm vi đã chốt: **Google + Facebook**. Apple bị loại khỏi lượt này vì cần tài
> khoản Apple Developer trả phí + xác minh domain; kiến trúc dưới đây thêm
> được provider thứ ba mà không sửa gì ngoài một file.

---

## 1. Bối cảnh

`Login.jsx` và `Register.jsx` hiện có 3 nút Google / Facebook / Apple. Cả 3 chỉ
gọi `toast('sẽ sớm có mặt')` — nút bấm không làm gì. Người dùng thấy một lời
hứa rồi bị bỏ lửng.

Backend **chưa có gì**: grep `OAuth|ExternalLogin|ExternalIdentity` toàn
`src/backend` → 0 kết quả. Không bảng, không cấu hình, không package.

Ràng buộc phát hiện khi khảo sát schema:

- `User.PasswordHash` là `string` **không nullable** (`= default!`).
- `User.Role` là `UserRole` (Student / Tutor / Admin) — vai trò **không tự chọn**,
  Tutor phải qua `TutorApplication` + duyệt.
- Đăng nhập hiện tại: JWT access + refresh token (băm + pepper), có chống
  brute-force theo account.

---

## 2. Quyết định thiết kế

### 2.1 Luồng: authorization code + PKCE, **trao đổi token ở server**

```
Trình duyệt                     API                        Google/Facebook
    │                            │                                │
    │ 1. GET /oauth/{p}/start    │                                │
    │───────────────────────────►│ sinh state + PKCE verifier     │
    │◄── { authorizeUrl, state } │ (lưu server, TTL 10 phút)      │
    │                            │                                │
    │ 2. chuyển hướng tới authorizeUrl của provider                │
    │──────────────────────────────────────────────────────────────►│
    │                            │                                │
    │ 3. callback?code&state ──────────────────────────────────────►│
    │◄──────────────────────────────────────────────────────────────│
    │                            │                                │
    │ 4. POST /oauth/{p}/callback│                                │
    │   { code, state }          │                                │
    │───────────────────────────►│ đối chiếu state (1 lần dùng)  │
    │                            │ đổi code → token (server↔server)
    │                            │ lấy profile, xác minh email ───►│
    │◄── AuthResponseDto (giống  │                                │
    │     hệt đăng nhập mật khẩu)                                │
```

Bắt buộc vì ba lý do, không phải vì sở thích:

1. **Client secret không bao giờ chạm trình duyệt.** Đổi `code` → `token` cần
   secret; làm ở frontend là lộ secret cho bất kỳ ai mở DevTools.
2. **Email phải do server xác minh.** Nếu tin email từ trình duyệt, kẻ xấu gửi
   `{ email: "admin@tutorhub.com" }` là chiếm được tài khoản. Server tự gọi
   provider và tự tin `email_verified`.
3. **`state` chống CSRF** — không có nó, kẻ xấu dán link callback của nạn nhân
   vào trình duyệt nạn nhân và đăng nhập vào tài khoản của chính kẻ.

PKCE: Google và Facebook đều hỗ trợ; thêm vào vì nó khiến authorization code
trở nên vô dụng nếu bị chặn, và là bắt buộc với provider loại "native client".

### 2.2 Callback nhận bằng **POST**, không phải GET

Google/Facebook chuyển hướng bằng GET nên `code` sẽ nằm trong
`Referer`/history/log. Vì vậy:

- Provider chuyển hướng tới **route SPA** `/auth/oauth/callback?...`.
- Trang đó **POST** `code` + `state` lên API.
- API **chỉ nhận POST**. Không bao giờ có endpoint `GET .../callback`.

### 2.3 Ghép tài khoản (account linking)

| Tình huống | Hành động |
|---|---|
| `ExternalLogin(provider, providerUserId)` đã tồn tại | Đăng nhập, cập nhật `LastLoginAt` |
| Chưa có, nhưng có `User` cùng email **và provider xác nhận `email_verified`** | Tạo `ExternalLogin` trỏ tới `User` đó. Giữ nguyên vai trò (Tutor vẫn là Tutor) |
| Chưa có, email mới | Tạo `User` **role = Student** + `StudentProfile` |
| Chưa có, email đã tồn tại, **nhưng provider KHÔNG xác nhận email** | **Từ chối.** Không ghép vào email chưa xác minh — đó là đường chiếm tài khoản |

`UserRole.Student` là mặc định duy nhất cho tài khoản mới. Gia sư vẫn phải đi
qua `/tutor/application` như mọi người; nút "trở thành gia sư" không đổi.

### 2.4 Mật khẩu của tài khoản OAuth

`PasswordHash` không nullable nên **không cần migration đổi nullability**.
Gán bằng hash của một secret ngẫu nhiên 64 byte: đăng nhập bằng mật khẩu **không
thể thành công** với tài khoản này, nhưng cột vẫn hợp lệ. Nếu sau này người dùng
đặt mật khẩu, `ChangePassword` ghi đè giá trị đó và tài khoản đăng nhập được
bằng cả hai cách — đây là hành vi đúng, không phải vi phạm.

### 2.5 Provider chưa cấu hình → tắt, không lỗi 500

`ExternalAuthOptions.Google.{ClientId,ClientSecret}` rỗng ⇒ provider bị co là
"chưa bật":

- `GET /oauth/providers` không trả về provider đó ⇒ **frontend ẩn nút bấm**.
- Gọi thẳng endpoint của provider tắt ⇒ `400` với message rõ ràng.

Không bao giờ để `ClientId` rỗng chạy tới gọi HTTP rồi nhận 400 từ Google — thông
báo đó vô dụng cho người dùng và che giấu lỗi cấu hình.

---

## 3. Bảng `ExternalLogins`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Id` | `uuid` PK | |
| `UserId` | `uuid` FK → `Users` | cascade delete |
| `Provider` | `int` | enum: 0 = Google, 1 = Facebook |
| `ProviderUserId` | `text` | ID bên provider (`sub` / `id`). **Ổn định vĩnh viễn** |
| `EmailAtLinkTime` | `text` nullable | email lúc liên kết, để đối chiếu |
| `CreatedAt` | `timestamptz` | |
| `LastLoginAt` | `timestamptz` | |

**Unique index `(Provider, ProviderUserId)`** — bắt buộc: một định danh provider
chỉ được gắn vào một tài khoản, chặn việc ghi đè liên kết.

**Không** unique theo `Provider + Email`: Facebook cho phép đổi email, và `sub`
mới là khoá đúng.

---

## 4. Cấu hình

```dotenv
ExternalAuth__Google__ClientId=
ExternalAuth__Google__ClientSecret=
ExternalAuth__Facebook__ClientId=
ExternalAuth__Facebook__ClientSecret=
ExternalAuth__RedirectUri=http://localhost:5173/auth/oauth/callback
```

`RedirectUri` là URL **frontend** (nơi provider đưa người dùng về), không phải
URL API. Không nhất thiết phải trỏ thẳng vào API.

Cả 4 biến client rỗng thì `ExternalAuthOptions.Enabled = false` và các endpoint
trả `400` với hướng dẫn. Ứng dụng vẫn khởi động bình thường — thiếu cấu hình
OAuth **không** được làm sập API.

---

## 5. Cổng kiểm

1. `dotnet build src/backend` → 0 error, 0 warning mới.
2. `npx eslint src` → 0 error.
3. `npm run build` → pass.
4. Migration apply được: `GET /health` báo database healthy.
5. `GET /api/v1/auth/oauth/providers` chưa cấu hình → `{"providers":[],"enabled":false}`.
6. `POST /api/v1/auth/oauth/google/callback` chưa cấu hình → **400** kèm message
   tiếng Anh dễ hiểu, **không phải 500**.
7. `GET /api/v1/auth/oauth/google/start` chưa cấu hình → 400 tương tự.
8. Frontend: 3 nút social **biến mất** khỏi Login/Register khi chưa cấu hình, và
   `localStorage` không bị ghi bởi bất kỳ lần bấm nào.
9. `state` dùng lần hai → bị từ chối (chống replay).

> **Không kiểm chứng được:** luồng bắt tay thật với Google/Facebook, vì cần
> Client ID/Secret thật. Các bước trên kiểm chứng phần *của ta*; bước tạo app ở
> console và chạy thử là phần người dùng làm. Xem `docs/external-auth-setup.md`.

---

## 6. Ghi chú triển khai

### 6.1 Đã có gì

| Tầng | File |
|---|---|
| Domain | `Enums/ExternalAuthProvider.cs`, `Entities/ExternalLogin.cs`, `User.ExternalLogins` |
| Application | `Common/Models/ExternalAuthOptions.cs`, `Common/Security/Pkce.cs`, `Common/Interfaces/IExternalAuthProvider.cs`, `IExternalAuthStateStore.cs`, `Common/Exceptions/ExternalAuthException.cs`, `Features/Auth/ExternalLogin/*` (4 file) |
| Infrastructure | `Authentication/External/{Google,Facebook}AuthProvider.cs`, `MemoryExternalAuthStateStore.cs`, `Configurations/ExternalLoginConfiguration.cs` |
| API | 3 endpoint trong `AuthController`, `CompleteExternalLoginRequest` |
| Frontend | `services/externalAuth.service.js`, `pages/auth/OAuthCallback.jsx`, route, 2 nút social ở Login/Register |
| Tài liệu | `docs/external-auth-setup.md` — từng bước tạo app ở console |

### 6.2 Kết quả kiểm chứng (đo thật, không suy đoán)

| Cổng | Kết quả |
|---|---|
| `dotnet build` | 0 error, 0 warning |
| Migration apply | `ExternalLogins` tạo, unique `(Provider, ProviderUserId)`, FK `ON DELETE CASCADE` |
| `/health` | Healthy, DB reachable |
| Chưa cấu hình → `/oauth/providers` | `{"providers":[],"enabled":false}` |
| Chưa cấu hình → `/oauth/google/start` | **400** + "Google sign-in is not configured on this server." |
| Chưa cấu hình → callback | **400**, không phải 500 |
| Provider không hỗ trợ (`/oauth/apple/start`) | **400** + "'apple' is not a supported sign-in provider." |
| Có credential → `/oauth/providers` | `{"providers":["Google"],"enabled":true}` |
| Authorize URL | `state` 43 ký tự, `code_challenge_method=S256`, `redirect_uri` URL-encode, `prompt=select_account` |
| **Chống replay** | POST cùng `state` lần 1 → *"Google would not accept this sign-in request…"* (đã qua state check, fail ở token exchange). Lần 2 → *"This sign-in link is no longer valid…"* (state đã tiêu thụ). Hai message khác nhau chứng minh state dùng một lần. |

### 6.3 Bug tìm ra khi kiểm chứng, đã sửa

`ExternalAuthException` ban đầu kế thừa `Exception`, nên `GlobalExceptionHandler` rơi vào
nhánh 500. Nghĩa là **mỗi lần đăng nhập OAuth thất bại** đều bị báo là lỗi máy
chủ: người dùng thấy lỗi mù, còn cảnh báo vận hành sáng đèn vì một sự cố phía
client. Đã sửa bằng cách cho nó kế thừa `AppException` với `HttpStatusCode.BadRequest`
— middleware xử lý sẵn nên không phải sửa handler. Đồng thời bỏ mã HTTP của
provider khỏi message, thay bằng lời giải thích dùng được ("link hết hạn hoặc đã
dùng, hãy bắt đầu lại").

### 6.4 Quyết định phụ đã đưa vào code

- **`ReturnUrl` trong body của callback bị backend cố tình bỏ qua.** Redirect
  do frontend tự quyết định sau khi kiểm tra an toàn. Nếu server trả lại
  `returnUrl` thì nó phải tự validate, còn frontend vẫn phải validate — thêm một
  chỗ để sai mà không bớt rủi ro.
- **`MemoryExternalAuthStateStore` không dùng `TimeProvider` cho hạn dùng**; dùng
  `AbsoluteExpirationRelativeToNow` của `IMemoryCache`. `TimeProvider` vẫn được
  inject để hàm chưa cần thời gian tuyệt đối không phải sửa chữ ký sau này.
- **`ValidateOnStart()` cố ý KHÔNG** cho `ExternalAuthOptions`. Thiếu credential
  OAuth là một tính năng đang tắt, không phải deploy sai — API phải vẫn boot và
  đăng nhập mật khẩu vẫn phải chạy.
- **`StartupSecretGuard` giờ canh `ExternalAuth:*:ClientSecret`** để chặn dán
  nhầm giá trị mẫu từ `.env.example`.

### 6.5 Chưa làm

- **Chưa có luồng gỡ liên kết.** Muốn bỏ Google khỏi tài khoản thì phải xoá bản
  ghi `ExternalLogins` bằng tay. Chưa có UI, chưa có endpoint.
- **Chưa có thu hồi quyền.** Không gọi `revoke` ở provider khi gỡ. Vì chưa có luồng
  gỡ nên chưa cần, nhưng phải làm cùng lúc khi làm luồng gỡ.
- **Chưa kiểm chứng bắt tay thật với Google/Facebook** — cần credential thật. Mọi
  thứ phía ta đã đo ở bảng §6.2; phần còn lại là tạo app ở console
  (`docs/external-auth-setup.md`).
- **`MemoryExternalAuthStateStore` là một node.** Trước khi scale ngang phải chuyển
  sang Redis. Hỏng theo hướng fail-closed, không phải vòng qua xác thực.

