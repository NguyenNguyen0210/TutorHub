namespace TutorHub.Domain.Enums;

public enum IdempotencyRecordStatus
{
    Processing = 1,
    Completed = 2,
    Failed = 3
}
