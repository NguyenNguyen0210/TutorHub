using MediatR;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWallet;

public record GetMyStudentWalletQuery : IRequest<StudentWalletDto>;
