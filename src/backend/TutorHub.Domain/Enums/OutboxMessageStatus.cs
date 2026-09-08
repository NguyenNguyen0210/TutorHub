namespace TutorHub.Domain.Enums;

public enum OutboxMessageStatus
{
    Pending,
    Processing,
    Processed,
    DeadLettered
}
