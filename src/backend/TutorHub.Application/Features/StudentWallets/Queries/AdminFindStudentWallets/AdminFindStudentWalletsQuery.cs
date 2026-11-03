using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Queries.AdminFindStudentWallets;

public record AdminStudentWalletDto(Guid Id, Guid StudentProfileId, Guid UserId, string StudentName,
    string StudentEmail, decimal AvailableBalance, decimal WithdrawingBalance, DateTime UpdatedAt);

public record AdminFindStudentWalletsQuery(string Search, int PageNumber = 1) : IRequest<PagedResult<AdminStudentWalletDto>>;

public class AdminFindStudentWalletsQueryHandler(IAppDbContext context)
    : IRequestHandler<AdminFindStudentWalletsQuery, PagedResult<AdminStudentWalletDto>>
{
    public async Task<PagedResult<AdminStudentWalletDto>> Handle(AdminFindStudentWalletsQuery request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.PageNumber);
        if (string.IsNullOrWhiteSpace(request.Search)) return new([], 0, page, 10);
        var term = request.Search.Trim();
        var id = Guid.TryParse(term, out var parsed) ? parsed : Guid.Empty;
        var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(term)) + "%";
        var query = context.Wallets.AsNoTracking().Where(w => w.StudentProfile != null
            && w.StudentProfile.User.Role == UserRole.Student
            && (w.Id == id || w.StudentProfileId == id || w.StudentProfile.UserId == id
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(w.StudentProfile.User.FullName)!.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(w.StudentProfile.User.Email)!.ToLower(), pattern, @"\")));
        return await PagedResult<AdminStudentWalletDto>.CreateAsync(query.OrderBy(w => w.StudentProfile!.User.FullName).ThenBy(w => w.Id)
            .Select(w => new AdminStudentWalletDto(w.Id, w.StudentProfileId!.Value, w.StudentProfile!.UserId,
                w.StudentProfile.User.FullName, w.StudentProfile.User.Email, w.AvailableBalance, w.WithdrawingBalance, w.UpdatedAt)), page, 10, cancellationToken);
    }
}
