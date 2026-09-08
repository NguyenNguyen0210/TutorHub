using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.GetTutorReviews;

public class GetTutorReviewsQueryHandler : IRequestHandler<GetTutorReviewsQuery, PagedResult<TutorPublicReviewDto>>
{
    private readonly IAppDbContext _context;

    public GetTutorReviewsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TutorPublicReviewDto>> Handle(GetTutorReviewsQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(tp => tp.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var query = _context.Reviews
            .AsNoTracking()
            .Include(r => r.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(s => s.User)
            .Where(r => r.Enrollment != null && r.Enrollment.TutorProfileId == request.TutorProfileId && !r.IsRemoved);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new TutorPublicReviewDto(
                r.Id,
                r.EnrollmentId,
                r.Enrollment.StudentProfile.User.FullName,
                r.Enrollment.StudentProfile.User.AvatarUrl,
                r.Rating,
                r.Comment,
                r.TutorReply,
                r.TutorRepliedAt,
                r.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<TutorPublicReviewDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
