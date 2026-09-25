using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWallet;

public class GetMyStudentWalletQueryHandler : IRequestHandler<GetMyStudentWalletQuery, StudentWalletDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyStudentWalletQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<StudentWalletDto> Handle(GetMyStudentWalletQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var student = await _context.StudentProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students have a student wallet.");
        }

        var wallet = await _context.StudentWallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.StudentProfileId == student.Id, cancellationToken);

        if (wallet == null)
        {
            return new StudentWalletDto
            {
                Id = Guid.Empty,
                StudentProfileId = student.Id,
                AvailableBalance = 0m,
                ReservedBalance = 0m,
                TotalBalance = 0m,
                UpdatedAt = DateTime.MinValue
            };
        }

        return new StudentWalletDto
        {
            Id = wallet.Id,
            StudentProfileId = wallet.StudentProfileId,
            AvailableBalance = wallet.AvailableBalance,
            ReservedBalance = wallet.ReservedBalance,
            TotalBalance = wallet.AvailableBalance + wallet.ReservedBalance,
            UpdatedAt = wallet.UpdatedAt
        };
    }
}
