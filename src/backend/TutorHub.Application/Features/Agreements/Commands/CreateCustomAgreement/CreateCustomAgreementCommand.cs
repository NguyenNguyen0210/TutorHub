using MediatR;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Commands.CreateCustomAgreement;

public record CreateCustomAgreementCommand(
    Guid TutorUserId,
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
    int ValidityDays = 7
) : IRequest<CustomAgreementDto>;
