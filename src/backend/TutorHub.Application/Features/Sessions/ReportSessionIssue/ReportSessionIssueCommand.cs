using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.ReportSessionIssue;

public record ReportSessionIssueCommand(Guid SessionId, string Reason, string Description) : IRequest<SessionDto>;
