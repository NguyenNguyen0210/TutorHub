using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;

public record CreateVnPayTopUpCommand(decimal Amount, string? IpAddress = null) : IRequest<VnPayTopUpRedirectDto>;
