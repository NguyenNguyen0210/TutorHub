using MediatR;
using TutorHub.Application.Features.Agreements.DTOs;

namespace TutorHub.Application.Features.Agreements.Commands.AcceptCustomAgreement;

public record AcceptCustomAgreementCommand(
    Guid AgreementId
) : IRequest<CustomAgreementDto>;
