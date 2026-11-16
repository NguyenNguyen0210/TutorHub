# Local setup and configuration

[Back to TutorHub](../README.md) | [Deployment](deployment.md) | [API reference](api.md) | [Testing](testing.md)

## Local setup

### Prerequisites

- .NET 8 SDK.
- Node.js 20 or later and npm.
- Docker Compose, or an existing local PostgreSQL 16 and Redis 7 instance.
- Valid VNPay and Cloudflare R2 configuration for API startup; use VNPay sandbox for development payments.

The commands below use **PowerShell**. Run them from the repository root unless another directory is specified.

### 1. Clone and configure

```powershell
git clone https://github.com/NguyenNguyen0210/TutorHub.git
cd TutorHub
Copy-Item .env.example .env
```

Update `.env` with your local connection details and integration credentials. The API rejects placeholder secrets such as `change_me`. In Development, its dotenv loader reads the local file without overriding existing process environment variables.

See [Configuration](#backend) for the required backend settings before continuing.

### 2. Start PostgreSQL and Redis

```powershell
docker compose up -d postgres redis
```

Default PostgreSQL settings are database/user/password `tutorhub`, exposed on host port `5433`. Redis is exposed on `6379`. If you customize database credentials, keep the API connection string consistent with the PostgreSQL volume's existing credentials.

### 3. Apply migrations

```powershell
dotnet restore src/backend/TutorHub.sln
dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api
```

This creates the schema in the local database (`dotnet tool install --global dotnet-ef --version "8.*"` once if the EF CLI is missing). The Compose API service applies the same migrations on startup through `Database__MigrateOnStartup`.

### 4. Run the API

```powershell
dotnet run --project src/backend/TutorHub.Api --launch-profile http
```

### 5. Run the frontend

In a separate terminal:

```powershell
cd src/frontend
npm ci
npm run dev
```

| Service | Local URL |
| --- | --- |
| Web application | <http://localhost:5173> |
| API | <http://localhost:5129> |
| Swagger UI — Development only | <http://localhost:5129/swagger> |
| Readiness — PostgreSQL and Redis | <http://localhost:5129/health> |
| Liveness | <http://localhost:5129/health/live> |

## Backend

The [local environment template](../.env.example) documents backend settings. The API uses .NET configuration paths with double underscores (`Jwt__Secret`); the [production template](../.env.production.example) uses Compose variable names that are mapped to those API settings.

| Configuration | Purpose |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection; the template uses `localhost:5433`. |
| `ConnectionStrings__Redis` | Redis connection; the local default is `localhost:6379`. |
| `Jwt__Secret`, `RefreshToken__Pepper` | Separate random values of at least 32 characters each. |
| `VnPay__TmnCode`, `VnPay__HashSecret`, `VnPay__BaseUrl` | VNPay merchant credentials and sandbox gateway URL. |
| `VnPay__ReturnUrl` | Use `http://localhost:5173/payment/return` for the frontend payment result page. |
| `CloudflareR2__AccountId`, `CloudflareR2__AccessKeyId`, `CloudflareR2__SecretAccessKey` | Object storage credentials. |
| `CloudflareR2__BucketName` | Add this setting when running the API directly on the host. |
| `Cors__AllowedOrigins` | Set to `http://localhost:5173` for the local frontend. |
| `Smtp__*` | Resend via MailKit SMTP; leaving the host empty enables log-only delivery in Development. |
| `ExternalAuth__Google__*` | Optional Google sign-in; leave empty to disable. |

Compose maps `CLOUDFLARE_R2_BUCKET` to the API's `CloudflareR2__BucketName`. Host-based development needs the latter configuration key directly. Keep credentials in local environment files or deployment secrets; `VITE_*` variables are exposed to the browser.

### Email delivery: Resend over SMTP

Email still uses `IEmailSender` and MailKit, including the existing notification delivery job and retries. No Resend SDK or HTTP email endpoint is used. Verify the sending domain `tutorhub.id.vn` in Resend, then create an API key with permission to send from that domain.

```dotenv
Smtp__Host=smtp.resend.com
Smtp__Port=465
Smtp__UseSsl=true
Smtp__UserName=resend
Smtp__Password=
Smtp__FromAddress=no-reply@tutorhub.id.vn
Smtp__FromDisplayName=TutorHub
```

Set `Smtp__Password` to the actual Resend API key in the local `.env` or deployment secret settings. It is not a Gmail App Password or the password of the sender mailbox. Do not commit the key or expose it in frontend variables. Restart the API after updating configuration.

For production Compose, use `SMTP_HOST`, `SMTP_PORT`, `SMTP_USESSL`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS`, and `SMTP_FROM_DISPLAY_NAME` from `.env.production.example`. For a host running .NET directly, use the `Smtp__*` names above.

Port `465` (or `2465`) uses implicit SSL/TLS with `UseSsl=true`. If the hosting environment requires STARTTLS, use port `587` (or `25`/`2587`) with `UseSsl=false`; MailKit requires the TLS upgrade before authenticating. Resend-specific credential and TLS settings are validated at startup. See [Resend SMTP documentation](https://resend.com/docs/send-with-smtp).

Development can explicitly leave `Smtp__Host` empty to use the log-only sender. Production requires a real SMTP configuration. SMTP acceptance confirms handoff to Resend; delivery to the recipient should be checked in the Resend dashboard.

## Frontend

The frontend defaults to the API on port `5129`. To change endpoints, create `src/frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5129/api/v1
VITE_SIGNALR_HUB_URL=http://localhost:5129/hubs/chat
VITE_NOTIFICATION_HUB_URL=http://localhost:5129/hubs/notifications
```

Restart Vite after changing environment variables. When changing the frontend address, update CORS and the VNPay return URL as well.
