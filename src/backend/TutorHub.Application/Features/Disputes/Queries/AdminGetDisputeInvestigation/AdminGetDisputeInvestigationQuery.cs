using MediatR;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;

public record AdminGetDisputeInvestigationQuery(Guid DisputeId) : IRequest<DisputeInvestigationDto>;
