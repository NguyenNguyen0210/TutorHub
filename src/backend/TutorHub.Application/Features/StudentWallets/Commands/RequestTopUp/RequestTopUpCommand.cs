using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Commands.RequestTopUp;

public record RequestTopUpCommand(decimal Amount) : IRequest<TopUpRequestDto>;
