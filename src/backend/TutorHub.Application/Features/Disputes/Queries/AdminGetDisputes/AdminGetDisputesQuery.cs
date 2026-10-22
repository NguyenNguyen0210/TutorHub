using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Queries.AdminGetDisputes;

public record AdminGetDisputesQuery(
    DisputeStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<AdminDisputeListResponseDto>;

public class AdminDisputeListResponseDto
{
    public IReadOnlyList<DisputeDto> Items { get; set; } = Array.Empty<DisputeDto>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}
