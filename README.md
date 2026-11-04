# TutorHub

**Nền tảng kết nối gia sư và học viên, quản lý gói học, lịch học và thanh toán theo từng buổi.**

TutorHub là dự án full-stack sử dụng React và ASP.NET Core. Dự án triển khai quy trình từ mua gói học đến giải ngân: giữ chỗ thanh toán, tạo hợp đồng, xếp lịch, giữ học phí và giải quyết khiếu nại trước giải ngân.

## Chức năng chính

| Vai trò | Chức năng |
| --- | --- |
| Học viên | Tìm gia sư và gói học, lưu yêu thích, thanh toán qua VNPay hoặc ví, theo dõi lịch học, nhắn tin, gửi khiếu nại và yêu cầu rút tiền. |
| Gia sư | Nộp hồ sơ xét duyệt, quản lý gói học, xếp và đổi lịch, cập nhật nội dung buổi học, theo dõi thu nhập và yêu cầu rút tiền. |
| Quản trị viên | Xét duyệt hồ sơ và gói học, xử lý tranh chấp, quản lý người dùng, danh mục, yêu cầu rút tiền và nhật ký kiểm toán. |

### Quy trình học tập và học phí

1. Học viên chọn gói học; đơn đặt chỗ được giữ trong 15 phút để thanh toán.
2. Thanh toán thành công kích hoạt hợp đồng và tạo các buổi học theo gói.
3. Gia sư xếp lịch. Chính sách báo trước mặc định là 2 giờ đối với các thao tác lịch học có áp dụng giới hạn này.
4. Sau khi buổi học kết thúc, tác vụ nền mở cửa sổ kiểm tra 12 giờ. Học phí chưa được giải ngân trong thời gian này.
5. Nếu không có báo cáo sự cố, tác vụ nền giải ngân phần thu nhập của gia sư. Khi có khiếu nại, khoản học phí liên quan được giữ để quản trị viên xử lý.

Ví theo dõi riêng số dư khả dụng, tiền đang giữ và tiền chờ rút. Các thao tác tài chính ghi nhận biến động số dư để phục vụ đối soát.

## Công nghệ và kiến trúc

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 18, Vite 5, Tailwind CSS, React Router, TanStack Query, Zustand, Axios |
| Backend | .NET 8, ASP.NET Core Web API, MediatR, FluentValidation |
| Dữ liệu | PostgreSQL 16, Entity Framework Core 8, Npgsql |
| Cache và realtime | Redis 7, ASP.NET Core SignalR |
| Tích hợp | VNPay, Cloudflare R2 qua S3 API, MailKit SMTP, Google sign-in tùy chọn |
| Kiểm thử | xUnit, FluentAssertions, Moq, ASP.NET Core integration tests, Node.js test runner |
| Vận hành | Docker Compose, GitHub Actions, Serilog, health checks |

Backend tổ chức theo **Clean Architecture và CQRS**:

```text
React SPA ── REST / SignalR ── TutorHub.Api
                                  │
                     TutorHub.Application
                                  │
                         TutorHub.Domain
                                  ▲
                     TutorHub.Infrastructure
                                  │
             PostgreSQL / Redis / VNPay / R2 / SMTP
```

Domain chứa thực thể và quy tắc nghiệp vụ. Application triển khai commands, queries, validation và các interface. Infrastructure hiện thực persistence, tích hợp bên ngoài và tác vụ nền; API cung cấp HTTP endpoints và cấu hình host.

Các điểm triển khai đáng chú ý:

- JWT access token, refresh token rotation và kiểm tra trạng thái tài khoản cho kết nối SignalR đang hoạt động.
- Transactional outbox và hàng đợi email lưu trong database để tách nghiệp vụ khỏi gửi thông báo.
- Transaction, khóa hàng và advisory lock PostgreSQL cho các thao tác đồng thời trên hợp đồng, ví và thống kê đánh giá.
- Idempotency cho các endpoint có áp dụng nhằm hạn chế xử lý lặp khi client gửi lại yêu cầu.
- Trigger append-only bảo vệ các bảng giao dịch và nhật ký kiểm toán tương ứng.
- Tác vụ nền xử lý đơn hết hạn, giải ngân, outbox, email và dọn dữ liệu idempotency.

## Chạy trên máy local

### Yêu cầu

- .NET 8 SDK.
- Node.js 20 trở lên và npm.
- Docker Compose, hoặc PostgreSQL 16 và Redis 7 đã chạy trên máy.
- Cấu hình VNPay sandbox và Cloudflare R2 cho các luồng thanh toán và tải tệp. API yêu cầu các tùy chọn tích hợp hợp lệ khi khởi động.

Các lệnh dưới đây dùng PowerShell và chạy từ thư mục gốc repository, trừ phần frontend.

### 1. Lấy mã nguồn và cấu hình

```powershell
git clone https://github.com/NguyenNguyen0210/TutorHub.git
cd TutorHub
Copy-Item .env.example .env
```

Điền giá trị trong `.env` trước khi chạy API. API từ chối các secret mẫu như `change_me`.

| Nhóm cấu hình | Thiết lập |
| --- | --- |
| PostgreSQL | `ConnectionStrings__DefaultConnection`; mẫu local dùng `localhost:5433`. |
| Redis | `ConnectionStrings__Redis`; mặc định local là `localhost:6379`. |
| Phiên đăng nhập | `Jwt__Secret` và `RefreshToken__Pepper`, mỗi giá trị tối thiểu 32 ký tự; dùng các giá trị ngẫu nhiên riêng biệt. |
| VNPay | `VnPay__TmnCode`, `VnPay__HashSecret`, `VnPay__BaseUrl`, `VnPay__ReturnUrl`. |
| Lưu trữ tệp | `CloudflareR2__AccountId`, `CloudflareR2__AccessKeyId`, `CloudflareR2__SecretAccessKey` và tên bucket. |
| Trình duyệt | `Cors__AllowedOrigins=http://localhost:5173` cho frontend local. |
| Email | `Smtp__*`; Development có thể dùng chế độ log-only khi bỏ trống SMTP host. |
| Google sign-in | `ExternalAuth__Google__*`; để trống để tắt đăng nhập Google. |

Với API chạy trực tiếp trên máy, đặt thêm `CloudflareR2__BucketName` trong `.env`. Compose lấy tên bucket từ `CLOUDFLARE_R2_BUCKET` và truyền sang tùy chọn này cho container API.

Để xem kết quả thanh toán trên giao diện, đặt `VnPay__ReturnUrl=http://localhost:5173/payment/return`. Không đưa secrets vào biến frontend `VITE_*` hoặc commit file `.env`.

### 2. Khởi động PostgreSQL và Redis

```powershell
docker compose up -d postgres redis
```

Theo cấu hình mặc định, PostgreSQL dùng database/user/password local là `tutorhub`, cổng host `5433`; Redis dùng cổng `6379`. Nếu đổi thông tin container, cập nhật connection string tương ứng. Thông tin khởi tạo PostgreSQL phải phù hợp với volume hiện có.

### 3. Tạo schema và dữ liệu demo

Với database ứng dụng local rỗng:

```powershell
dotnet restore src/backend/TutorHub.sln
dotnet run --project src/backend/TutorHub.Api --launch-profile http -- --seed-demo
```

Lệnh áp dụng EF Core migrations và tạo dữ liệu minh họa gồm ba vai trò, một gói học và ví học viên. Chạy lại không đặt lại số dư. Lệnh chỉ cho phép Development, PostgreSQL localhost và không thay thế dữ liệu ứng dụng không thuộc bộ demo.

| Vai trò | Email | Mật khẩu demo |
| --- | --- | --- |
| Quản trị viên | `admin.demo@tutorhub.local` | `Demo@12345` |
| Gia sư | `tutor.demo@tutorhub.local` | `Demo@12345` |
| Học viên | `student.demo@tutorhub.local` | `Demo@12345` |

Ví học viên có **1.000.000 VND minh họa** để trải nghiệm thanh toán bằng ví. Các tài khoản và số dư này chỉ dùng cho demo local; đây không phải khoản nạp tiền thật. Bản clone mới không cần file SQL hay scripts bên ngoài repository.

### 4. Chạy backend

```powershell
dotnet run --project src/backend/TutorHub.Api --launch-profile http
```

| Dịch vụ | Địa chỉ local |
| --- | --- |
| API | <http://localhost:5129> |
| Swagger UI — Development | <http://localhost:5129/swagger> |
| Readiness — PostgreSQL và Redis | <http://localhost:5129/health> |
| Liveness | <http://localhost:5129/health/live> |

### 5. Chạy frontend

Mở terminal khác:

```powershell
cd src/frontend
npm ci
npm run dev
```

Truy cập <http://localhost:5173>. Frontend mặc định kết nối API cổng `5129`. Khi đổi địa chỉ backend, tạo `src/frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:5129/api/v1
VITE_SIGNALR_HUB_URL=http://localhost:5129/hubs/chat
VITE_NOTIFICATION_HUB_URL=http://localhost:5129/hubs/notifications
```

Cập nhật đồng thời CORS và URL trả về VNPay khi đổi địa chỉ frontend. Khởi động lại Vite sau khi thay biến môi trường.

## Kiểm thử

### Backend

```powershell
dotnet build src/backend/TutorHub.sln --configuration Release /p:TreatWarningsAsErrors=true
dotnet test src/backend/TutorHub.sln --configuration Release --no-build
```

Integration tests cần PostgreSQL local và Redis đang hoạt động. Bộ test đọc connection string từ môi trường hoặc `.env`, tạo lại database test riêng và từ chối PostgreSQL remote. User PostgreSQL chạy test cần quyền tạo/xóa database test.

Có thể đặt tên database test riêng trước khi chạy; dùng tiền tố `tutorhub_integration_` theo sau bởi chữ thường, số hoặc dấu gạch dưới:

```powershell
$env:POSTGRES_TEST_DATABASE='tutorhub_integration_local'
dotnet test src/test/TutorHub.Api.IntegrationTests --configuration Release
```

### Frontend

Chạy từ `src/frontend`:

```powershell
npm run lint
npm test
npm run build
```

Regression tests được quản lý phiên bản trong `src/test` và `src/frontend/test`. E2E trên trình duyệt được kiểm tra riêng với Playwright; runner và báo cáo local không đóng gói trong repository. Khi kiểm tra các luồng thay đổi số dư, dùng database test riêng và VNPay sandbox.

Workflow [GitHub Actions](.github/workflows/ci.yml) định nghĩa build/test backend và kiểm tra frontend cho push hoặc pull request vào `main`. Kết quả CI cần đối chiếu với đúng commit đang xem.

## Cấu trúc repository

```text
src/
├── backend/
│   ├── TutorHub.Api/
│   ├── TutorHub.Application/
│   ├── TutorHub.Domain/
│   ├── TutorHub.Infrastructure/
│   └── TutorHub.sln
├── frontend/
│   ├── src/                   # Pages, components, services, state, utilities
│   └── test/                  # Frontend regression tests
└── test/                      # Backend unit và integration tests
docs/                          # Yêu cầu, user stories và OpenAPI snapshot
docker-compose.yml             # PostgreSQL, Redis và API local
docker-compose.prod.yml        # Cấu hình container production
.env.example                   # Mẫu cấu hình local
.env.production.example        # Mẫu cấu hình triển khai
```

## Tài liệu và triển khai

- [Yêu cầu chức năng](docs/functional-requirements.md)
- [Product requirements](docs/prd.md)
- [User stories](docs/user-stories.md)
- [OpenAPI snapshot](docs/openapi.json) — tham khảo Swagger của API đang chạy để xem hợp đồng hiện tại.
- [Cấu hình production](.env.production.example) và [Docker Compose production](docker-compose.prod.yml).

Nếu chạy API trong Compose, cổng host là `8080`; frontend vẫn chạy riêng. Container API kết nối PostgreSQL/Redis qua hostname nội bộ và tự áp dụng migrations theo cấu hình Compose. Lệnh `--seed-demo` chỉ dành cho API chạy trên máy với PostgreSQL localhost.

Ngoài Development, ứng dụng lấy secrets từ môi trường triển khai và yêu cầu cấu hình SMTP cùng CORS hợp lệ. Khi dùng reverse proxy, khai báo IP tin cậy qua `ReverseProxy__KnownProxies__0`, `ReverseProxy__KnownProxies__1`, ... . `/health` phản ánh trạng thái PostgreSQL và Redis; `/health/live` kiểm tra tiến trình độc lập với các dịch vụ này.
