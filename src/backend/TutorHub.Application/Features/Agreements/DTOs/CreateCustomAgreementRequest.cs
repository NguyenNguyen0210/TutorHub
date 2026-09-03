using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.DTOs;

public record CreateCustomAgreementRequest(
    Guid StudentProfileId,
    Guid SubjectId,
    Guid? ServiceId,
    Guid? ConversationId,
    string Title,
    string Description,
    decimal TotalPrice,
    int TotalSessions,
    int SessionDurationMinutes,
    TeachingMode TeachingMode,
    int? ValidityDays = 7
);
