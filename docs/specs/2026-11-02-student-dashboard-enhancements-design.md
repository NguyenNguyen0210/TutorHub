# Thiết Kế Tinh Chỉnh Giao Diện Bàn Học Của Học Viên (Student Dashboard Enhancements)

- **Ngày tạo:** 2026-11-02
- **Trạng thái:** Đã phê duyệt (Approved)
- **Mục tiêu:** Nâng cấp trải nghiệm người dùng trên trang Bàn học học viên (`StudentDashboard.jsx`) khi đã có hợp đồng kích hoạt, bổ sung ảnh thật gia sư, các nút điều hướng hành động tiếp theo, căn chỉnh lưới thống kê 3 cột và trực quan hóa tiến độ giải ngân ký quỹ Escrow.

---

## 1. Bối Cảnh & Vấn Đề (Problem Statement)

Trang Bàn học của học sinh (`/student/dashboard`) hiện đang có một số điểm hạn chế về trải nghiệm và thẩm mỹ khi học viên đã đăng ký hợp đồng học tập:
1. **Thẻ hợp đồng thiếu ảnh thật và nút hành động:** `EnrollmentSummaryDto` từ backend chưa cung cấp `TutorAvatarUrl`, dẫn tới avatar của gia sư chỉ hiển thị chữ cái đầu ("T") thay vì ảnh đại diện thật của gia sư (ví dụ TS. Trần Quốc Huy). Khi hợp đồng vừa tạo (0/15 buổi, chưa có lịch), học viên chưa có hướng dẫn hay nút hành động rõ ràng để tiến hành bước tiếp theo (xếp lịch, xem chi tiết lộ trình).
2. **Khối 3 thẻ thống kê trên cùng (`StatStrip`) bị thụt lề/lệch mép:** `<StatStrip>` mặc định cấu hình 4 cột (`lg:grid-cols-4`). Do chỉ có 3 thẻ ("Hợp đồng đang học", "Học phí trong Escrow", "Buổi học sắp tới"), cột thứ 4 bị trống, làm khối thẻ bị hẹp hơn tổng chiều rộng của 2 cột nội dung phía dưới, tạo khoảng trống bất đối xứng.
3. **Thẻ "Buổi học sắp tới" khi chưa có lịch quá đơn điệu:** Chỉ hiển thị chữ xám "Chưa có lịch" kèm dấu gạch ngang "—", không có liên kết kết nối học viên với gia sư để bắt đầu xếp lịch.
4. **Hộp "Tiền của bạn đang ở đâu" ở cột phải thiếu trực quan:** Lặp lại con số "Đang ký quỹ" mà không nêu bật "Tổng giá trị hợp đồng ban đầu" và thiếu thanh tiến trình mini biểu thị tỷ lệ tiền đã giải ngân so với tổng hợp đồng.

---

## 2. Giải Pháp Chi Tiết (Detailed Design)

### Luồng 1 (Backend Stream): Cung Cấp Ảnh Đại Diện Gia Sư Trong Hợp Đồng
- **File:** `src/backend/TutorHub.Application/Features/Enrollments/DTOs/EnrollmentSummaryDto.cs`
  - Thêm thuộc tính `string? TutorAvatarUrl = null` vào record `EnrollmentSummaryDto`.
- **File:** `src/backend/TutorHub.Application/Features/Enrollments/GetMyEnrollments/GetMyEnrollmentsQueryHandler.cs`
  - Trong phép chiếu LINQ `.Select(e => new EnrollmentSummaryDto(...))`, ánh xạ:
    `e.TutorProfile.User.AvatarUrl` vào trường `TutorAvatarUrl`.
- **Đảm bảo:** Không phá vỡ tương thích ngược, không ảnh hưởng các trường dữ liệu hiện tại, biên dịch backend không cảnh báo.

### Luồng 2 (Frontend Stream): Cải Tiến Giao Diện Bàn Học (`StudentDashboard.jsx`)

#### A. Kéo giãn hàng 3 thẻ thống kê trên cùng
- Cấu hình `<StatStrip columns={3} className="w-full grid-cols-1 sm:grid-cols-3" />`.
- Đảm bảo 3 thẻ chia đều 1/3 chiều rộng mỗi thẻ, mép phải của thẻ "Buổi học sắp tới" thẳng hàng tuyệt đối với mép phải của thẻ "Tiền của bạn đang ở đâu" ở cột phải bên dưới.

#### B. Gợi ý đặt lịch ở thẻ "Buổi học sắp tới"
- Trong `StatStrip` figure `key: 'next'`:
  - Khi chưa có lịch (`!nextSession`):
    - Nếu học viên có ít nhất 1 hợp đồng kích hoạt: hiển thị thông báo kèm đường dẫn nổi bật:
      ```jsx
      hint: (
        <Link
          to="/app/messages"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-primary-600 hover:text-brand-primary-700 hover:underline transition-colors mt-0.5"
        >
          <span>Chờ gia sư xếp lịch · Trao đổi ngay</span>
          <Icon name="arrow_forward" size="xs" />
        </Link>
      )
      ```
    - Nếu không có hợp đồng: giữ nguyên `'Chưa có hợp đồng'`.

#### C. Thẻ Hợp đồng: Ảnh thật gia sư & Nút hành động nhanh
- Thẻ hợp đồng dùng `enr.tutorAvatarUrl` từ backend.
- Khi tiến độ `done === 0` hoặc hợp đồng đang kích hoạt:
  - Bổ sung thanh nút hành động ở chân thẻ (action footer):
    - Nút **"Nhắn tin xếp lịch"** (icon `chat`, variant `outline` hoặc button con, dẫn tới `/app/messages`).
    - Nút **"Chi tiết lộ trình →"** (dẫn tới `/student/enrollments/${enr.id}`).
  - Ngăn sự kiện nổi bọt (bubbling) khi click vào các nút hành động bên trong thẻ bọc link `Card`.

#### D. Cột phải hộp "Tiền của bạn đang ở đâu"
- Tính toán thêm tổng giá trị hợp đồng ban đầu:
  ```js
  const totalContractValue = useMemo(() => {
    return activeEnrollments.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
  }, [activeEnrollments]);
  ```
- Tính phần trăm đã giải ngân:
  ```js
  const payoutPercentage = totalContractValue > 0 
    ? Math.min(100, Math.round((escrowReleased / totalContractValue) * 100))
    : 0;
  ```
- Hiển thị trong Card:
  1. Dòng **Tổng giá trị hợp đồng**: `<Money value={totalContractValue} />`.
  2. **Thanh tiến trình giải ngân mini (Payout Mini-Bar):**
     - Thanh 2 màu: màu xanh `bg-brand-success-500` (đã giải ngân) và nền cam `bg-holding-subtle` / viền `border-holding` (đang ký quỹ).
     - Nhãn phụ: `Đã giải ngân ${payoutPercentage}% · Đang ký quỹ ${100 - payoutPercentage}%`.
  3. Hai dòng chỉ số chi tiết:
     - **Đang ký quỹ:** `<Money value={escrowRemaining} />` (màu cam holding).
     - **Đã giải ngân:** `<Money value={escrowReleased} />` (màu xanh success).

---

## 3. Quản Lý Trạng Thái (State Matrix)

| Trạng thái học viên | StatStrip (3 thẻ) | Thẻ hợp đồng | Hộp "Tiền của bạn đang ở đâu" |
|---------------------|-------------------|--------------|------------------------------|
| **0 hợp đồng** | 0 hợp đồng, 0 ₫ Escrow, "Chưa có lịch" | EmptyState "Khám phá gia sư ngay" | Tổng 0 ₫, Escrow 0 ₫, Giải ngân 0 ₫ |
| **Có hợp đồng mới (0/X buổi)** | 1+ hợp đồng, Escrow = 100%, Gợi ý "Chờ gia sư xếp lịch · Trao đổi ngay →" | Avatar thật, 0/X buổi, 2 nút "Nhắn tin xếp lịch" & "Chi tiết lộ trình →" | Tổng = 100%, Mini-bar 0% giải ngân, Đang ký quỹ 100% |
| **Đang học (dở dang X/Y buổi)** | Số hợp đồng active, Escrow còn lại, Ngày giờ buổi sắp tới | Avatar thật, X/Y buổi, Progress bar, link chi tiết | Tổng ban đầu, Mini-bar X% giải ngân, Đang ký quỹ Y%, Đã giải ngân X% |
| **Hoàn thành toàn bộ** | 0 hợp đồng active, Escrow 0 ₫, "Chưa có lịch" | Badge Completed, 100% buổi | Mini-bar 100% giải ngân, Đang ký quỹ 0 ₫ |

---

## 4. Kế Hoạch Chạy Song Song (Parallel Execution Plan)

- **Luồng A (Backend):** Cập nhật `EnrollmentSummaryDto.cs` và `GetMyEnrollmentsQueryHandler.cs`, kiểm tra `dotnet build src/backend/TutorHub.sln`.
- **Luồng B (Frontend):** Cập nhật `StudentDashboard.jsx` theo 4 điểm yêu cầu, kiểm tra `npm run build` từ `src/frontend`.
- **Kiểm thử nghiệm thu:** Kiểm tra phản hồi API thực tế và giao diện rendered trên trình duyệt.
