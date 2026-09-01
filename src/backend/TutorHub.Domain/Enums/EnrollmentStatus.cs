namespace TutorHub.Domain.Enums;

public enum EnrollmentStatus
{
    Active,      // Hợp đồng học tập đang hoạt động, có các Session chưa hoàn thành
    Completed,   // Tất cả N Session đã hoàn thành
    Cancelled    // Hủy (Student hoặc Tutor). Các Session chưa học được hoàn tiền.
}
