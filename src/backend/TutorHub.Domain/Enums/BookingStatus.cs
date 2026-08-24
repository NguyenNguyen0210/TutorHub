namespace TutorHub.Domain.Enums;

public enum BookingStatus
{
    Holding,     // đang giữ chỗ tạm 15 phút chờ thanh toán
    Pending,     // đã thanh toán, chờ gia sư xác nhận
    Confirmed,   // gia sư đã xác nhận
    Completed,   // buổi học hoàn thành, đã giải ngân
    Cancelled,   // bị hủy (bởi học viên/gia sư/hệ thống)
    Expired
}

