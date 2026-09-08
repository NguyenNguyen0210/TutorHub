using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Sessions.Reschedule.DTOs;

public record SessionRescheduleRequestDto(
    Guid Id,
    Guid SessionId,
    Guid ProposerUserId,
    Guid RecipientUserId,
    DateTime ProposedStartAt,
    DateTime ProposedEndAt,
    string? Reason,
    RescheduleRequestStatus Status,
    string? RejectionReason,
    DateTime CreatedAt,
    DateTime? RespondedAt
)
{
    public static SessionRescheduleRequestDto FromEntity(SessionRescheduleRequest entity) =>
        new(
            entity.Id,
            entity.SessionId,
            entity.ProposerUserId,
            entity.RecipientUserId,
            entity.ProposedStartAt,
            entity.ProposedEndAt,
            entity.Reason,
            entity.Status,
            entity.RejectionReason,
            entity.CreatedAt,
            entity.RespondedAt
        );
}
