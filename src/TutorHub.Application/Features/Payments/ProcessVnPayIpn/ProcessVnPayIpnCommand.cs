using MediatR;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.ProcessVnPayIpn;

public record ProcessVnPayIpnCommand(
    IReadOnlyDictionary<string, string> Parameters
) : IRequest<VnPayIpnResponseDto>;
