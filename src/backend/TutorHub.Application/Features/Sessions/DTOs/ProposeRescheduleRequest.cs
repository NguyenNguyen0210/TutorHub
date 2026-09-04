namespace TutorHub.Application.Features.Sessions.DTOs;

public record ProposeRescheduleRequest(
    DateTime ProposedStartAt,
    DateTime ProposedEndAt,
    string? Reason
);
