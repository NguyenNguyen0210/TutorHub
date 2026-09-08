namespace TutorHub.Domain.Enums;

public enum SessionStatus
{
    Unscheduled, // Được sinh ra từ Enrollment nhưng chưa có lịch học cụ thể
    Scheduled,   // Đã chốt ngày giờ học (StartAt và EndAt không null)
    Completed,   // Buổi học hoàn thành, EarningAmount đã được giải ngân
    Cancelled    // Buổi học bị hủy (do cancel Enrollment hoặc cancel riêng lẻ)
}
