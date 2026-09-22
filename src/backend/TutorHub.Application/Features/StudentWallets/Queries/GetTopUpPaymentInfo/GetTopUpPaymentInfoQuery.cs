using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetTopUpPaymentInfo;

public record GetTopUpPaymentInfoQuery : IRequest<TopUpPaymentInfoDto>;
