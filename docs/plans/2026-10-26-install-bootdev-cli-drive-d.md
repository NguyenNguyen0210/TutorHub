# Cài đặt Golang và Boot.dev CLI trên ổ đĩa D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cài đặt toàn bộ Golang toolchain và Boot.dev CLI lên ổ đĩa D (GOROOT=D:\Go, GOPATH=D:\go, GOBIN=D:\go\bin) và cấu hình biến môi trường User trên Windows để sử dụng trực tiếp qua PowerShell/CMD.

**Architecture:** Sử dụng script PowerShell tự động truy vấn bản Go ổn định mới nhất, tải file zip vào ổ D, giải nén vào `D:\Go`, thiết lập biến môi trường User (`GOROOT`, `GOPATH`, `GOBIN`, `Path`), sau đó cài đặt `bootdev` CLI bằng `go install` và kiểm tra xác thực.

**Tech Stack:** Windows 10/11, PowerShell, Golang toolchain (windows-amd64), Boot.dev CLI (`github.com/bootdotdev/bootdev`).

---

### Task 1: Chuẩn bị thư mục và dọn dẹp trên ổ D

**Files:**
- Thư mục: `D:\Go`, `D:\go`, `D:\go\bin`

- [ ] **Step 1: Kiểm tra và tạo các thư mục đích trên ổ D**

Chạy lệnh PowerShell để tạo các thư mục cần thiết:
```powershell
New-Item -ItemType Directory -Force -Path "D:\Go", "D:\go", "D:\go\bin"
```

- [ ] **Step 2: Xác minh thư mục đã sẵn sàng**

Chạy:
```powershell
Test-Path "D:\Go", "D:\go", "D:\go\bin"
```
Kỳ vọng: Cả 3 đường dẫn đều trả về `True`.

---

### Task 2: Tải và giải nén Golang vào D:\Go

**Files:**
- Tải tạm: `D:\temp_go.zip`
- Giải nén đích: `D:\Go`

- [ ] **Step 1: Lấy URL gói cài đặt Go Windows zip mới nhất**

Chạy lệnh PowerShell truy vấn Go API:
```powershell
$release = Invoke-RestMethod -Uri "https://go.dev/dl/?mode=json"
$windowsFile = $release[0].files | Where-Object { $_.os -eq "windows" -and $_.arch -eq "amd64" -and $_.kind -eq "archive" }
$downloadUrl = "https://go.dev/dl/" + $windowsFile.filename
Write-Output "URL: $downloadUrl"
```

- [ ] **Step 2: Tải gói zip về D:\temp_go.zip**

Chạy lệnh:
```powershell
Invoke-WebRequest -Uri $downloadUrl -OutFile "D:\temp_go.zip"
```

- [ ] **Step 3: Giải nén gói Go vào thư mục D:\Go**

Chạy lệnh giải nén và chuyển cấu trúc vào `D:\Go`:
```powershell
Expand-Archive -Path "D:\temp_go.zip" -DestinationPath "D:\temp_extract" -Force
Copy-Item -Path "D:\temp_extract\go\*" -Destination "D:\Go" -Recurse -Force
Remove-Item -Path "D:\temp_extract" -Recurse -Force
Remove-Item -Path "D:\temp_go.zip" -Force
```

- [ ] **Step 4: Kiểm tra file thực thi go.exe tại D:\Go\bin**

Chạy:
```powershell
Test-Path "D:\Go\bin\go.exe"
```
Kỳ vọng: Trả về `True`.

---

### Task 3: Cấu hình biến môi trường User (Environment Variables)

**Files/Registry:**
- User Environment: `GOROOT`, `GOPATH`, `GOBIN`, `Path`

- [ ] **Step 1: Thiết lập vĩnh viễn các biến môi trường cấp User**

Chạy script PowerShell:
```powershell
[Environment]::SetEnvironmentVariable("GOROOT", "D:\Go", "User")
[Environment]::SetEnvironmentVariable("GOPATH", "D:\go", "User")
[Environment]::SetEnvironmentVariable("GOBIN", "D:\go\bin", "User")

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @("D:\Go\bin", "D:\go\bin")
$pathList = ($currentPath -split ';') | Where-Object { $_ -ne "" }

foreach ($p in $pathsToAdd) {
    if ($pathList -notcontains $p) {
        $pathList += $p
    }
}
$newPath = $pathList -join ';'
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

- [ ] **Step 2: Cập nhật biến môi trường cho session hiện tại**

Chạy:
```powershell
$env:GOROOT = "D:\Go"
$env:GOPATH = "D:\go"
$env:GOBIN = "D:\go\bin"
$env:Path = "$env:Path;D:\Go\bin;D:\go\bin"
```

- [ ] **Step 3: Xác minh Go hoạt động từ dòng lệnh**

Chạy:
```powershell
& "D:\Go\bin\go.exe" version
go version
go env GOROOT
go env GOPATH
```
Kỳ vọng: `go version` hiển thị phiên bản go, `GOROOT` là `D:\Go`, `GOPATH` là `D:\go`.

---

### Task 4: Cài đặt Boot.dev CLI bằng go install

**Files:**
- Đích: `D:\go\bin\bootdev.exe`

- [ ] **Step 1: Thực thi lệnh cài đặt Boot.dev CLI**

Chạy:
```powershell
go install github.com/bootdotdev/bootdev@latest
```

- [ ] **Step 2: Xác minh file thực thi bootdev.exe đã được tạo tại D:\go\bin**

Chạy:
```powershell
Test-Path "D:\go\bin\bootdev.exe"
```
Kỳ vọng: Trả về `True`.

- [ ] **Step 3: Xác minh lệnh bootdev có thể gọi được trực tiếp**

Chạy:
```powershell
bootdev --version
```
Kỳ vọng: In ra phiên bản CLI của bootdev (ví dụ `bootdev version v1.x.x`).

---

### Task 5: Kiểm tra toàn diện & Cam kết tài liệu

**Files:**
- Kiểm tra tích hợp hệ thống
- Lưu kế hoạch vào git

- [ ] **Step 1: Chạy kiểm tra tích hợp toàn bộ công cụ**

Chạy:
```powershell
$goCmd = Get-Command go
$bootdevCmd = Get-Command bootdev
Write-Output "Go Path: $($goCmd.Source)"
Write-Output "Bootdev Path: $($bootdevCmd.Source)"
```
Kỳ vọng: 
- `Go Path` nằm trong `D:\Go\bin\go.exe`
- `Bootdev Path` nằm trong `D:\go\bin\bootdev.exe`

- [ ] **Step 2: Commit tài liệu kế hoạch vào git**

Chạy:
```powershell
git add -f docs/plans/2026-10-26-install-bootdev-cli-drive-d.md; git commit -m "docs: add implementation plan for installing Go and Boot.dev CLI on drive D"
```
Kỳ vọng: Commit thành công.
