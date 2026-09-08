namespace TutorHub.Domain.Enums;

public enum EnrollmentStatus
{
    Pending,     // F-15: vừa trả tiền, escrow đã ghi nhưng hợp đồng chưa kích hoạt
    Active,      // Hợp đồng học tập đang hoạt động, có các Session chưa hoàn thành
    Completed,   // Tất cả N Session đã hoàn thành
    Cancelled    // Hủy (Student hoặc Tutor). Các Session chưa học được hoàn tiền.
}
