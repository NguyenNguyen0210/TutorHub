using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class AccountStatusAuditLog
{
    public Guid Id { get; set; }

    public Guid TargetUserId { get; set; }
    public User TargetUser { get; set; } = default!;

    public Guid AdminUserId { get; set; }
    public User AdminUser { get; set; } = default!;

    public AccountStatus PreviousStatus { get; set; }
    public AccountStatus NewStatus { get; set; }

    public string? Reason { get; set; }

    public DateTime Timestamp { get; set; }
}
