using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;

public class DisputeInvestigationDto
{
    public DisputeDto Dispute { get; set; } = default!;

    public SessionInvestigationDto Session { get; set; } = default!;

    public EnrollmentInvestigationDto Enrollment { get; set; } = default!;

    public List<InvestigationMessageDto> ConversationSnippet { get; set; } = new();

    public FinancialInvestigationDto FinancialSummary { get; set; } = default!;
}

public class SessionInvestigationDto
{
    public Guid Id { get; set; }
    public int SessionNumber { get; set; }
    public SessionStatus Status { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public decimal EarningAmount { get; set; }
    public bool IsPayoutReleased { get; set; }
    public AttendanceStatus? StudentAttendance { get; set; }
    public DateTime? StudentAttendanceSubmittedAt { get; set; }
    public AttendanceStatus? TutorAttendance { get; set; }
    public DateTime? TutorAttendanceSubmittedAt { get; set; }
    public bool HasAttendanceConflict { get; set; }
}

public class EnrollmentInvestigationDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public EnrollmentStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public int FeePolicyVersion { get; set; }
}

public class InvestigationMessageDto
{
    public Guid Id { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}

public class FinancialInvestigationDto
{
    public decimal DisputedGrossAmount { get; set; }
    public decimal OriginalPlatformFee { get; set; }
    public decimal OriginalTutorNet { get; set; }
    public decimal TutorAvailableBalance { get; set; }
    public decimal TutorHeldBalance { get; set; }
    public decimal TutorWithdrawableBalance { get; set; }
    public bool IsPayoutReleased { get; set; }
}
