# PRD — Nền tảng Tìm Gia Sư / Đặt Lịch Học 1-Kèm-1

**Phiên bản:** 1.0
**Ngày:** 11/08/2026
**Trạng thái:** Nghiệp vụ đã chốt, chuẩn bị thiết kế kỹ thuật

---

## 1. Tổng quan

### 1.1 Mục tiêu
Xây dựng nền tảng kết nối học viên với gia sư, cho phép tìm kiếm, đặt lịch học 1-kèm-1, thanh toán và đánh giá sau buổi học. Nền tảng có quản lý tập trung qua admin để đảm bảo chất lượng gia sư và xử lý tranh chấp.

### 1.2 Đối tượng người dùng
| Vai trò | Mô tả |
|---|---|
| Học viên (student) | Tìm gia sư, đặt lịch, thanh toán, đánh giá sau buổi học |
| Gia sư (tutor) | Tạo hồ sơ, khai báo lịch rảnh, xác nhận booking, dạy học |
| Admin | Duyệt hồ sơ gia sư, xử lý report/tranh chấp, quản lý tài khoản |

### 1.3 Phạm vi phiên bản này (MVP + Quản lý)
Bao gồm: Auth, hồ sơ gia sư + duyệt admin, tìm kiếm, đặt lịch, thanh toán (escrow, không hoa hồng), đánh giá, report & xử lý tranh chấp.

**Không bao gồm ở bản này** (để sau, xem mục 10): đăng nhập Google/Facebook, chat real-time, video call, hoa hồng nền tảng, gói combo, chương trình giới thiệu.

---

## 2. Đăng ký / Đăng nhập

- Xác thực bằng **email + password** (không OAuth ở bản này).
- Khi đăng ký, người dùng chọn vai trò: **Học viên** hoặc **Gia sư**.
- **Học viên**: có thể sử dụng ngay sau khi đăng ký thành công.
- **Gia sư**: sau khi đăng ký, bắt buộc hoàn thiện hồ sơ → hồ sơ vào trạng thái chờ duyệt (`pending_review`) → chưa hiển thị công khai cho đến khi admin duyệt.

---

## 3. Hồ sơ Gia sư & Quy trình duyệt

### 3.1 Thông tin gia sư khai báo
- Môn dạy (có thể nhiều môn, mỗi môn có thể có giá riêng)
- Bằng cấp, số năm kinh nghiệm, giới thiệu bản thân
- Hình thức dạy: online / offline / cả hai
- Giá dạy theo giờ
- Lịch rảnh cố định theo tuần (xem mục 4)

### 3.2 Trạng thái hồ sơ
```
pending_review → verified (admin duyệt)
              → rejected (admin từ chối, kèm lý do)
                  → gia sư sửa hồ sơ → nộp lại → pending_review
verified → suspended (admin khóa do vi phạm/report)
```

- Chỉ gia sư có trạng thái `verified` mới hiển thị công khai và cho phép học viên tìm thấy, đặt lịch.

### 3.3 Xử lý report gia sư
- Admin xem toàn bộ report liên quan đến 1 gia sư.
- Admin **tự quyết định** có suspend tài khoản hay không — không có cơ chế tự động suspend theo ngưỡng số lượng report.

---

## 4. Lịch rảnh của Gia sư

### 4.1 Mô hình: Lịch cố định theo tuần
- Gia sư khai báo khung giờ rảnh lặp lại hàng tuần (VD: Thứ 2, 4, 6 — 18h-21h).
- Lịch này áp dụng vô thời hạn cho đến khi gia sư chủ động sửa.

### 4.2 Block ngày cụ thể (nghỉ đột xuất)
- Gia sư có thể chặn (block) một ngày cụ thể dù ngày đó thường rảnh theo lịch tuần (VD: nghỉ ốm, có việc bận).

### 4.3 Logic hiển thị lịch trống cho học viên
```
Lịch trống = (Lịch tuần theo day_of_week)
             − (Các slot đã có booking pending/confirmed)
             − (Các ngày nằm trong danh sách bị block)
```

### 4.4 Khi gia sư sửa lịch tuần
- Các booking **đã xác nhận trong tương lai** dựa trên lịch cũ **không bị ảnh hưởng**, vẫn giữ nguyên.
- Lịch mới chỉ áp dụng cho các lượt đặt phát sinh sau thời điểm sửa.

---

## 5. Tìm kiếm & Lọc Gia sư

Học viên có thể tìm/lọc gia sư theo:
- Môn học (bắt buộc)
- Khoảng giá (min–max)
- Hình thức dạy (online/offline/cả hai)
- Khu vực (nếu offline)
- Rating tối thiểu
- Sắp xếp: giá thấp→cao, rating cao nhất, kinh nghiệm nhiều nhất

**Điều kiện hiển thị:** chỉ hiện gia sư có trạng thái `verified` **và** còn ít nhất 1 slot rảnh trong tương lai.

---

## 6. Luồng Đặt lịch (Booking) — Nghiệp vụ trung tâm

### 6.1 Các bước

| Bước | Mô tả | Trạng thái booking |
|---|---|---|
| 1 | Học viên chọn slot trống của gia sư | — |
| 2 | Bấm "Đặt lịch" → hệ thống **giữ chỗ tạm 15 phút** | `holding` |
| 3 | Học viên thanh toán trong 15 phút. Nếu không thanh toán kịp → slot tự nhả ra | `pending` (nếu thanh toán thành công) |
| 4 | Tiền chuyển vào trạng thái **held** (nền tảng giữ hộ, chưa chuyển gia sư) | `pending` |
| 5 | Gia sư có **24h** để xác nhận | `confirmed` hoặc `cancelled` |
| 6 | Nếu quá 24h không phản hồi hoặc gia sư từ chối → hoàn tiền 100% | `cancelled` |
| 7 | Đến giờ học, 2 bên tham gia buổi học | `confirmed` |
| 8 | Sau buổi học, **48h** để 1 trong 2 bên xác nhận hoàn thành (hoặc tự động nếu không ai báo vấn đề) | `completed` |
| 9 | Tiền chuyển từ `held` → `released` cho gia sư (100%, chưa trừ hoa hồng) | — |
| 10 | Học viên được mời đánh giá gia sư | — |

### 6.2 Race condition khi đặt lịch
- Khi 2 học viên cùng thao tác đặt 1 slot cùng lúc, hệ thống phải dùng **transaction + row lock** ở tầng database để đảm bảo chỉ 1 người đặt được, người còn lại nhận thông báo "khung giờ đã có người đặt".

### 6.3 Chính sách hủy lịch

| Ai hủy | Điều kiện | Hoàn tiền |
|---|---|---|
| Học viên | Trước 24h so với giờ học | 100% |
| Học viên | Trong vòng 24h trước giờ học | 50% |
| Gia sư | Bất kỳ lúc nào | 100% (lỗi thuộc gia sư) |

---

## 7. Thanh toán

### 7.1 Mô hình Escrow đơn giản
- Học viên thanh toán khi đặt lịch → tiền vào trạng thái **held** (nền tảng giữ hộ).
- Sau khi booking chuyển `completed` → tiền chuyển sang **released**, ghi có vào ví nội bộ của gia sư.
- Nếu booking bị hủy/hoàn tiền → tiền chuyển sang **refunded**, trả lại học viên theo chính sách mục 6.3.

### 7.2 Hoa hồng nền tảng
- **Phiên bản này: 0%** — gia sư nhận toàn bộ học phí.
- Cấu trúc dữ liệu (bảng `transactions`) đã thiết kế sẵn field `commission_rate` (mặc định = 0) và `payout_amount` để khi cần bật tính năng thu phí, chỉ cần thay đổi giá trị cấu hình, **không cần sửa cấu trúc DB hay luồng thanh toán hiện có**.

### 7.3 Ví gia sư
- Gia sư có ví nội bộ hiển thị 2 số dư:
  - `pending`: tiền đang giữ (booking chưa hoàn thành)
  - `available`: tiền có thể rút (booking đã completed và released)
- Gia sư yêu cầu rút tiền định kỳ (admin xử lý thủ công ở giai đoạn đầu).

---

## 8. Report & Xử lý tranh chấp

- Học viên và gia sư đều có thể **report một booking cụ thể** (không phải report chung chung về đối phương), kèm mô tả và bằng chứng (ảnh, nếu cần).
- Report được gửi đến admin.
- Admin xem xét và **quyết định thủ công**:
  - Hoàn tiền / không hoàn tiền cho học viên
  - Suspend tài khoản bên vi phạm (nếu cần)
- Không có logic tự động xử lý tranh chấp ở phiên bản này.

---

## 9. Đánh giá (Review)

- Chỉ được đánh giá sau khi booking có trạng thái `completed`.
- **Học viên → Gia sư**: rating (1-5 sao) + comment, **công khai**, hiển thị trên hồ sơ gia sư.
- **Gia sư → Học viên**: rating, **chỉ admin thấy**, dùng làm căn cứ nếu học viên thường xuyên phá lịch/vi phạm.

---

## 10. Ngoài phạm vi (Out of scope — dự kiến mở rộng sau)

| Tính năng | Ghi chú |
|---|---|
| Đăng nhập Google/Facebook | Đã cân nhắc, quyết định bỏ ở bản này |
| Chat real-time giữa học viên–gia sư | Phase 7 |
| Video call tích hợp | Phase 7 |
| Hoa hồng nền tảng | Cấu trúc DB đã hỗ trợ, chỉ cần bật cấu hình |
| Gói học combo nhiều buổi | Chưa thiết kế |
| Chương trình giới thiệu bạn bè | Chưa thiết kế |
| Chứng chỉ hoàn thành khóa học | Chưa thiết kế |
| Tự động suspend gia sư theo ngưỡng report | Quyết định giữ thủ công (admin toàn quyền) |

---

## 11. Bảng thông số nghiệp vụ đã chốt

| Thông số | Giá trị |
|---|---|
| Thời gian giữ chỗ tạm khi thanh toán (soft lock) | 15 phút |
| Thời gian gia sư phải xác nhận booking | 24 giờ |
| Hoàn tiền khi học viên hủy trước 24h | 100% |
| Hoàn tiền khi học viên hủy trong vòng 24h | 50% |
| Hoàn tiền khi gia sư hủy | 100% |
| Thời gian tự động chuyển `completed` sau buổi học | 48 giờ |
| Hoa hồng nền tảng | 0% (đã để sẵn cấu trúc mở rộng) |

---

## 12. Trạng thái dữ liệu chính (tổng hợp)

**Tutor profile status:** `pending_review` → `verified` / `rejected` → `suspended`

**Booking status:** `holding` → `pending` → `confirmed` → `completed`
(hoặc → `cancelled` ở bước xác nhận, kèm hoàn tiền theo chính sách)

**Transaction status:** `held` → `released` / `refunded`

---
