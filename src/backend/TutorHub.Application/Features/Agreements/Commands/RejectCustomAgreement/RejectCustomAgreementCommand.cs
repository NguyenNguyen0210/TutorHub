using MediatR;
using TutorHub.Application.Features.Agreements.DTOs;

namespace TutorHub.Application.Features.Agreements.Commands.RejectCustomAgreement;

public record RejectCustomAgreementCommand(
    Guid AgreementId,
    Guid StudentUserId,
    string Reason
) : IRequest<CustomAgreementDto>;
