using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.DTOs;

public record CustomAgreementDto(
    Guid Id,
    Guid? ServiceId,
    string? ServiceTitle,
    Guid? ConversationId,
    Guid TutorProfileId,
    Guid TutorUserId,
    string TutorName,
    Guid StudentProfileId,
    Guid StudentUserId,
    string StudentName,
    Guid SubjectId,
    string SubjectName,
    string Title,
    string Description,
    decimal TotalPrice,
    int TotalSessions,
    int SessionDurationMinutes,
    TeachingMode TeachingMode,
    CustomAgreementStatus Status,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? RejectedAt,
    string? RejectionReason,
    DateTime? CancelledAt,
    string? CancellationReason,
    Guid? BookingId
);
