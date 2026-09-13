using MediatR;
using TutorHub.Application.Features.Agreements.DTOs;

namespace TutorHub.Application.Features.Agreements.Queries.GetCustomAgreementById;

public record GetCustomAgreementByIdQuery(
    Guid AgreementId
) : IRequest<CustomAgreementDto>;
