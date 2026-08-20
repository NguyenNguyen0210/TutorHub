using MediatR;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.ProcessVnPayReturn;

public record ProcessVnPayReturnQuery(
    IReadOnlyDictionary<string, string> Parameters
) : IRequest<VnPayReturnResultDto>;
