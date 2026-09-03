using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Queries.GetMyAgreements;

public record GetMyAgreementsQuery(
    Guid UserId,
    CustomAgreementStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<CustomAgreementDto>>;
