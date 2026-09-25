using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;

public record AdminRejectTopUpCommand(Guid TopUpRequestId, string Reason) : IRequest<TopUpRequestDto>;
