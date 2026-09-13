using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Queries.GetMyDisputes;

public record GetMyDisputesQuery : IRequest<List<DisputeDto>>;
