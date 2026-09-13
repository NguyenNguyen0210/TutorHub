using MediatR;
using TutorHub.Application.Features.Agreements.DTOs;

namespace TutorHub.Application.Features.Agreements.Commands.CancelCustomAgreement;

public record CancelCustomAgreementCommand(
    Guid AgreementId,
    string Reason
) : IRequest<CustomAgreementDto>;
