using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Services.GetAdminServices;

public record GetAdminServicesQuery(string? Search = null, ServiceStatus? Status = null, Guid? TutorUserId = null,
    Guid? ServiceId = null, int PageNumber = 1, int PageSize = 10) : IRequest<PagedResult<AdminServiceDto>>;
public record AdminServiceDto(Guid Id, string Title, string Description, string? LearningScope, string? ExpectedOutcome,
    string? CurriculumJson, Guid TutorUserId, Guid TutorProfileId, string TutorName, string SubjectName,
    decimal Price, int TotalSessions, int SessionDurationMinutes, ServiceStatus Status, DateTime CreatedAt,
    int ActiveEnrollmentCount);

public class GetAdminServicesQueryHandler(IAppDbContext context) : IRequestHandler<GetAdminServicesQuery, PagedResult<AdminServiceDto>>
{
    public async Task<PagedResult<AdminServiceDto>> Handle(GetAdminServicesQuery request, CancellationToken ct)
    {
        var query = context.Services.AsNoTracking();
        if (request.Status.HasValue) query = query.Where(s => s.Status == request.Status);
        if (request.TutorUserId.HasValue) query = query.Where(s => s.TutorProfile.UserId == request.TutorUserId);
        if (request.ServiceId.HasValue) query = query.Where(s => s.Id == request.ServiceId);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(term)) + "%";
            var isId = Guid.TryParse(term, out var id);
            query = query.Where(s => (isId && s.Id == id)
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Title)!.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.TutorProfile.User.FullName)!.ToLower(), pattern, @"\")
                || EF.Functions.Like(VietnameseSearch.UnaccentImmutable(s.Subject.Name)!.ToLower(), pattern, @"\"));
        }
        var total = await query.CountAsync(ct);
        var page = Math.Max(1, request.PageNumber); var size = Math.Clamp(request.PageSize, 1, 100);
        var items = await query.OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id)
            .Skip((page - 1) * size).Take(size)
            .Select(s => new AdminServiceDto(s.Id, s.Title, s.Description, s.LearningScope, s.ExpectedOutcome,
                s.CurriculumJson, s.TutorProfile.UserId, s.TutorProfileId, s.TutorProfile.User.FullName, s.Subject.Name,
                s.Price, s.TotalSessions, s.SessionDurationMinutes, s.Status, s.CreatedAt,
                context.Enrollments.Count(e => e.ServiceId == s.Id && e.Status == EnrollmentStatus.Active)))
            .ToListAsync(ct);
        return new(items, total, page, size);
    }
}
