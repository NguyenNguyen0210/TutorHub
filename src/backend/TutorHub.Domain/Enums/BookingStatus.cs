namespace TutorHub.Domain.Enums;

public enum BookingStatus
{
    Holding,     // đang giữ chỗ tạm 15 phút chờ thanh toán
    Pending,     // đã thanh toán, chờ gia sư xác nhận (legacy)
    Confirmed,   // gia sư đã xác nhận (legacy)
    Completed,   // buổi học hoàn thành, đã giải ngân (legacy)
    Cancelled,   // bị hủy (bởi học viên/gia sư/hệ thống)
    Expired,
    Paid         // đã thanh toán thành công, kích hoạt Enrollment (Service-based)
}

