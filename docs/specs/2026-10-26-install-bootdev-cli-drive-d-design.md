# Design Specification: Cài đặt Golang và Boot.dev CLI trên ổ đĩa D

## 1. Mục tiêu và Phạm vi
- **Mục tiêu:** Cài đặt toàn bộ bộ công cụ Go (Golang) và Boot.dev CLI (`bootdev`) lên phân vùng ổ đĩa `D:` (thay vì ổ `C:`) nhằm bảo toàn dung lượng còn lại của ổ `C:`.
- **Nền tảng:** Windows 10/11 (64-bit), môi trường dòng lệnh PowerShell/CMD (Windows Native).

## 2. Cấu trúc thư mục & Biến môi trường
### 2.1 Cấu trúc thư mục trên `D:`
- `D:\Go`: Thư mục cài đặt Golang toolchain (`GOROOT`), chứa `bin\go.exe`, `bin\gofmt.exe`, chuẩn thư viện.
- `D:\go`: Thư mục Go Workspace (`GOPATH`), chứa:
  - `D:\go\bin`: Thư mục đích (`GOBIN`) chứa các file thực thi được cài qua `go install` (bao gồm `bootdev.exe`).
  - `D:\go\pkg`: Cache module tải về qua Go proxy.

### 2.2 Biến môi trường Người dùng (User Environment Variables)
- `GOROOT` = `D:\Go`
- `GOPATH` = `D:\go`
- `GOBIN` = `D:\go\bin`
- Bổ sung vào User `Path`:
  - `D:\Go\bin`
  - `D:\go\bin`

## 3. Quy trình thực hiện chi tiết
1. **Kiểm tra phiên bản & Tải Go zip:**
   - Truy vấn phiên bản ổn định mới nhất của Go từ `https://go.dev/dl/?mode=json`.
   - Tải gói Windows zip tương ứng (ví dụ: `goX.X.X.windows-amd64.zip`) lưu tạm vào `D:\temp_go.zip`.
2. **Giải nén & Bố trí thư mục:**
   - Giải nén file zip vào `D:\` (file zip mặc định chứa thư mục gốc `go`, đổi/chuyển thành `D:\Go`).
   - Xóa file tạm `D:\temp_go.zip`.
3. **Cấu hình biến môi trường vĩnh viễn (User level):**
   - Sử dụng PowerShell `[Environment]::SetEnvironmentVariable` với scope `User`.
   - Cập nhật biến môi trường cho session PowerShell hiện hành.
4. **Cài đặt Boot.dev CLI:**
   - Thực thi lệnh: `go install github.com/bootdotdev/bootdev@latest`.
   - Xác nhận file thực thi `D:\go\bin\bootdev.exe` đã được tạo ra.

## 4. Kế hoạch kiểm thử & Tiêu chuẩn nghiệm thu
1. `go version`: Phản hồi đúng phiên bản Golang đã tải.
2. `go env GOROOT`: Trả về chính xác `D:\Go`.
3. `go env GOPATH`: Trả về chính xác `D:\go`.
4. `(Get-Command bootdev).Source`: Trả về chính xác đường dẫn `D:\go\bin\bootdev.exe`.
5. `bootdev --version`: Lệnh phản hồi phiên bản CLI không lỗi.
