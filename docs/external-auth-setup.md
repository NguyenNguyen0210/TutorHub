# Thiết lập đăng nhập Google / Facebook

Bản thân tính năng **đã có đầy đủ trong code**. Phần còn lại là thao tác tại
console của nhà cung cấp — tôi không có tài khoản đó, và `redirect_uri` phải
khớp **đúng** domain bạn dùng.

Làm theo đúng thứ tự: bước 1 → bước 3. Chưa bật provider nào thì ứng dụng vẫn
chạy bình thường, nút social **ẩn mất**, và gọi API trả `400` kèm giải thích
(không phải 500).

---

## 0. Trạng thái hiện tại khi chưa cấu hình

| Kiểm tra | Kết quả |
|---|---|
| API khởi động | Bình thường, đăng nhập mật khẩu chạy phải |
| `GET /api/v1/auth/oauth/providers` | `{"providers":[],"enabled":false}` |
| `GET /api/v1/auth/oauth/google/start` | `400` + "Google sign-in is not configured on this server." |
| Trang `/auth/login` | **Không có** nút Google/Facebook |

Đây là hành vi chủ ý: nút bấm không hoạt động thì tốt hơn là hiện ra rồi báo lỗi.

---

## 1. Google

**Tạo project**

1. Mở <https://console.cloud.google.com/>.
2. Chọn project (tạo mới nếu chưa có) — dự án hiện tại có thể dùng project riêng.
3. Vào **APIs & Services → OAuth consent screen**.
   - Chọn **External**.
   - *App information*: tên `TutorHub`, email hỗ trợ của bạn.
   - *Audience*: **External** (bắt buộc nếu chưa có app nào được xác minh).
   - Thêm **Test users** → email của bạn. Ở trạng thái "Testing" chỉ những email
     này mới đăng nhập được, và màn hình đồng ý sẽ hiện cảnh báo "Google chưa
     xác minh ứng dụng". Bấm **Advanced → Go to TutorHub (unsafe)** để tiếp tục.
     Muốn sạch cảnh báo thì phải xin Google xác minh — cần domain riêng và file
     `verification.html`, việc này **không làm được với `localhost`**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - *Authorized redirect URIs*: `http://localhost:5173/auth/oauth/callback`
     (khớp **chính xác**, kể cả dấu gạch chéo cuối và viết hoa/thường).
5. Màn kết quả cho **Client ID** và **Client secret**.

**Điền vào `.env`**

```dotenv
ExternalAuth__RedirectUri=http://localhost:5173/auth/oauth/callback
ExternalAuth__Google__ClientId=<dán Client ID>
ExternalAuth__Google__ClientSecret=<dán Client secret>
```

Scope code yêu cầu: `openid email profile` (mặc định trong `appsettings.json`).

---

## 2. Facebook

**Tạo app**

1. Mở <https://developers.facebook.com/apps/> → **Create App**.
2. Use case chọn **Other** → app type **Consumer** (Business chỉ cần khi bạn có
   fan page doanh nghiệp thật).
3. Vào **App settings → Basic**.
   - *App ID* → `ExternalAuth__Facebook__ClientId`
   - *App secret* → **Show** → `ExternalAuth__Facebook__ClientSecret`
4. **App settings → Basic → Client OAuth Settings**.
   - Bật **Client OAuth Login** = Yes.
   - *Valid OAuth Redirect URIs*: `http://localhost:5173/auth/oauth/callback`
4b. *App Domains*: `localhost`
5. Trong sản phẩm cần thêm:
   - **Facebook Login → Settings**: bật các quyền `email` và `public_profile`.
     Thiếu `email` thì API trả lỗi rõ ràng vì không xác định được tài khoản.

**Điền vào `.env`**

```dotenv
ExternalAuth__Facebook__ClientId=<dán App ID>
ExternalAuth__Facebook__ClientSecret=<dán App secret>
```

> `App secret` của Facebook **không phải** `client secret` của các app khác cùng
> tên trong Settings — phải là `App secret` ở đúng màn "Basic".

---

## 3. Chạy thử

```powershell
# 1. Nạp lại biến môi trường và restart API
Get-Process -Name "TutorHub.Api" -EA SilentlyContinue | Stop-Process -Force
# nạp .env rồi `dotnet run --project src/backend/TutorHub.Api` như bình thường

# 2. Xác nhận provider đã bật
Invoke-RestMethod http://localhost:5129/api/v1/auth/oauth/providers
# kỳ vọng: data.providers = ["Facebook","Google"], data.enabled = true
```

Mở `http://localhost:5173/auth/login` → phải thấy 2 nút. Bấm thử.

---

## 4. Lên production

| Việc | Ghi chú |
|---|---|
| Đổi `ExternalAuth__RedirectUri` | thành `https://<domain-của-bạn>/auth/oauth/callback` |
| Đăng ký URI đó ở cả 2 console | URI phải **khớp tuyệt đối**, kể cả `https` và không có port |
| Chuyển consent screen sang **Production** | Google: cần xác minh. Facebook: cần App Review nếu quyền `email` nằm ngoài `public_profile` |
| CORS | `Cors__AllowedOrigins` phải chứa đúng domain |

---

## 5. Cơ chế đã cài — để bạn đánh giá, không phải để bạn sửa

- **Authorization code + PKCE (S256)**. Không dùng SDK bên thứ ba, nên
  `client secret` **không bao giờ** tới trình duyệt. Toàn bộ trao đổi `code` →
  `token` diễn ra giữa API và provider.
- **Callback nhận `POST`**. Provider chuyển hướng bằng `GET`, nên `code` sẽ nằm
  trong `Referer`/history/log. Trang callback đọc nó rồi POST lên API; API **không
  có** endpoint GET tương ứng. Xem `docs/external-auth-spec.md` §2.2.
- **`state` 256-bit, lưu server, dùng một lần**, hết hạn sau 10 phút. Không có nó
  thì kẻ xấu dán link callback của nạn nhân vào trình duyệt nạn nhân để đăng nhập
  vào tài khoản của chính kẻ. Trùng `state` lần hai bị từ chối.
- **API tự lấy email từ provider, không tin email từ trình duyệt.** Body của
  callback **không có** trường email. Nếu nhận email từ client thì chỉ cần gửi
  `{ email: "admin@tutorhub.com" }` là chiếm được tài khoản.
- **Chỉ ghép tài khoản khi provider xác nhận `email_verified`.** Thiếu xác nhận →
  từ chối, không ghép. Đây là ranh giới giữa "tiện" và "chiếm tài khoản".
- **Tài khoản mới luôn là Student.** Gia sư vẫn phải qua `/tutor/application` +
  duyệt, y hệt tài khoản mật khẩu. Tài khoản đã tồn tại giữ nguyên vai trò khi
  được liên kết — một Tutor không bị hạ xuống Student.
- **`User.PasswordHash` không nullable** nên không cần migration đổi kiểu. Tài
  khoản OAuth được gán hash của một secret ngẫu nhiên 64 byte: đăng nhập bằng mật
  khẩu **không thể** thành công, nhưng cột vẫn hợp lệ. Nếu sau này người dùng đặt
  mật khẩu thì `ChangePassword` ghi đè và tài khoản dùng được cả hai cách.
- **Unique index `(Provider, ProviderUserId)`** trên `ExternalLogins`. Không có nó,
  hai lần đăng nhập đầu tiên chạy đồng thời có thể gắn cùng một định danh provider
  vào hai tài khoản, và tài khoản nào được vào phụ thuộc vào kẻ thắng.
- **`StartupSecretGuard`** giờ canh `ExternalAuth:*:ClientSecret` để chặn trường
  hợp ai dán nhầm giá trị mẫu từ `.env.example`.

### Giới hạn đã biết

- **State lưu trong RAM, nên một node.** Chạy 2 instance API sau load balancer thì
  callback rơi vào node kia sẽ bị từ chối. Đây là hỏng theo hướng **fail-closed**
  (người dùng thử lại) chứ không phải vòng qua xác thực — nhưng phải chuyển sang
  Redis trước khi scale ngang. Xem `MemoryExternalAuthStateStore.cs`.
- **Google/Facebook có thể đổi email.** Vì vậy định danh dùng `sub`/`id` chứ
  không dùng email làm khoá. `EmailAtLinkTime` chỉ để đối chiếu.
- **Chưa có luồng gỡ liên kết.** Đăng nhập Google rồi muốn bỏ hẳn sang chỉ dùng
  mật khẩu thì phải xoá bản ghi `ExternalLogins` qua DB. Chưa có UI cho việc này.
