# PRD: Quản Lý Tệp Đa Phương Tiện & AWS S3 (Media Management Subsystem)

* **Tính năng:** Phân hệ quản lý tệp đa phương tiện tải lên đám mây AWS S3, xác thực tệp nhị phân đa lớp (Magic Bytes), quản lý danh tính tệp trong Database (`Media` table), phân cấp bảo mật Public vs Private và sinh Pre-signed URL.
* **Người dùng:** Học Viên (Student), Gia Sư (Tutor), Quản Trị Viên (Admin).
* **Stack:** .NET 8 Web API, AWSSDK.S3, EF Core 8, PostgreSQL, Magic Bytes Binary Inspection.

---

## 1. Vấn Đề Cần Giải Quyết & Success Metrics
* **Vấn đề:** Thay vì lưu chuỗi URL thô không kiểm soát, hệ thống cần một phân hệ quản trị tệp chuẩn hóa: Phân cấp bảo mật (Avatar là Public; Bằng cấp, Chứng cứ khiếu nại là Private), chống giả mạo đuôi tệp bằng chữ ký nhị phân (Magic Bytes), và cấp quyền truy cập tệp nhạy cảm thông qua Pre-signed URL có thời hạn.
* **Success Metrics:**
  - 100% tệp tải lên được quét và đối chiếu chữ ký Magic Bytes header (chống 100% file `.exe` đổi đuôi thành `.jpg`).
  - 100% tệp nhạy cảm (`Certificate`, `DisputeEvidence`) ở chế độ Private và chỉ truy cập được qua Pre-signed URL tạm thời (15 phút) sau khi xác thực quyền sở hữu.
  - 0 file rác mồ côi (Orphan S3 objects) nhờ cơ chế rollback S3 khi Database insert thất bại.

---

## 2. User Stories & Acceptance Criteria

### US-01: Tải tệp lên đám mây (Upload Media)
* **User Story:** Là người dùng, tôi muốn tải ảnh đại diện, bằng cấp hoặc chứng cứ khiếu nại lên hệ thống.
* **Acceptance Criteria:**
  - `POST /api/v1/media/upload` (multipart/form-data: `file`, `mediaType`).
  - Giới hạn dung lượng tối đa: `5MB`.
  - Định dạng mở rộng và MIME type cho phép: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  - Kiểm tra chữ ký nhị phân Magic Bytes:
    - JPEG: `FF D8 FF`
    - PNG: `89 50 4E 47`
    - WEBP: `RIFF...WEBP`
    - PDF: `%PDF`
  - Phân quyền theo vai trò: `Certificate` chỉ dành cho `Tutor` và `Admin`.
  - Phân vùng ObjectKey: `{mediaType}/{yyyy}/{MM}/{guid}.{ext}`.
  - Tự động lưu bản ghi `Media` vào Database. Nếu lưu DB lỗi, tự động gọi xóa S3 object để rollback.

### US-02: Lấy URL truy cập tệp (Get Media Access URL)
* **User Story:** Là người dùng hoặc Admin, tôi muốn xem/tải tệp của mình.
* **Acceptance Criteria:**
  - `GET /api/v1/media/{id}/url`.
  - Nếu `IsPrivate = false` (`Avatar`): Trả về Public S3 URL hoặc CloudFront CDN URL.
  - Nếu `IsPrivate = true` (`Certificate`, `DisputeEvidence`): Kiểm tra quyền sở hữu (`UploadedByUserId == CurrentUserId` hoặc `Admin`). Sinh Pre-signed URL có thời hạn 15 phút.

### US-03: Xóa tệp (Delete Media)
* **User Story:** Là chủ sở hữu tệp hoặc Admin, tôi muốn xóa tệp không còn sử dụng.
* **Acceptance Criteria:**
  - `DELETE /api/v1/media/{id}`.
  - Kiểm tra quyền sở hữu (Chủ tệp hoặc Admin).
  - Soft delete trong Database (`Status = Deleted`, `DeletedAt = UtcNow`) và xóa physical object trên S3.

---

## 3. Scope Ranh Giới Tính Năng
* **Có trong v1:**
  - Upload `Avatar`, `Certificate`, `DisputeEvidence`, `General`.
  - Magic Bytes binary inspection.
  - Presigned URL 15 phút cho private media, CDN/Public URL cho avatar.
  - Soft-delete DB và delete S3 object.
* **Chưa có trong v1 (Dời sang v2):**
  - Tự động nén và resize ảnh đại diện thành nhiều kích thước (Thumbnail, Medium, Large) qua AWS Lambda.
  - Tích hợp Antivirus/ClamAV quarantine scanning pipeline trước khi lưu vào production bucket.

---

## 4. Data Model
* **`Media`:** `Id (PK, Guid)`, `ObjectKey (Unique, string)`, `OriginalFileName (string)`, `StoredFileName (string)`, `ContentType (string)`, `FileSize (long)`, `StorageProvider (string: AwsS3)`, `BucketName (string)`, `MediaType (MediaType enum: Avatar, Certificate, DisputeEvidence, General)`, `IsPrivate (bool)`, `Status (MediaStatus enum: Active, Deleted)`, `UploadedByUserId (FK, Guid)`, `CreatedAt (DateTime)`, `DeletedAt (DateTime?)`.

---

## 5. Edge Cases & Xử Lý Lỗi
* **File giả mạo (Content-type spoofing):** Đổi đuôi `virus.exe` thành `avatar.jpg` và gửi MIME `image/jpeg` ➔ Bị chặn bởi Magic Bytes Validator (`400 Bad Request`).
* **Truy cập trái phép tệp Private:** Học viên A cố lấy link bằng cấp của Gia sư B ➔ Bị từ chối với `403 Forbidden`.
