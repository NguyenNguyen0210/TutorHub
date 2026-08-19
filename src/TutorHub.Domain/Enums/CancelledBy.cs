namespace TutorHub.Domain.Enums;

public enum CancelledBy
{
    Student,
    Tutor,
    System,      // hệ thống tự hủy do quá hạn
    Admin        // admin hủy do giải quyết khiếu nại
}