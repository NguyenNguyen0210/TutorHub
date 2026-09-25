using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminConfirmTopUp;

public record AdminConfirmTopUpCommand(Guid TopUpRequestId, string? AdminNote = null) : IRequest<TopUpRequestDto>;
