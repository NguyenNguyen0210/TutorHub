using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.AdminModerateReview;

public class AdminModerateReviewCommandHandler : IRequestHandler<AdminModerateReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public AdminModerateReviewCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<ReviewDto> Handle(AdminModerateReviewCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var review = await _context.Reviews
            .Include(r => r.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(r => r.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
        {
            throw new NotFoundException("Review", request.ReviewId);
        }

        if (review.IsRemoved)
        {
            throw new ConflictException("Review has already been removed by moderation.");
        }

        // 1. Soft moderation domain action
        review.RemoveByAdmin(request.Reason, userId);

        // 2. Recalculate TutorProfile RatingAvg & TotalReviews
        var tutorProfileId = review.Enrollment.TutorProfileId;
        var remainingRatings = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.Enrollment)
            .Where(r => r.Enrollment != null && r.Enrollment.TutorProfileId == tutorProfileId && r.Id != review.Id && !r.IsRemoved)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        var tutorProfile = await _context.TutorProfiles
            .FirstOrDefaultAsync(tp => tp.Id == tutorProfileId, cancellationToken);

        if (tutorProfile != null)
        {
            // F-23: denormalized stats owned by the domain.
            tutorProfile.ApplyReview(remainingRatings);
        }

        // Audit trail for moderation action (INV-LEDGER-006)
        await _auditLogService.LogAsync(
            action: "REVIEW_MODERATED",
            entityName: "Review",
            entityId: review.Id.ToString(),
            userId: userId,
            oldValues: new { rating = review.Rating, comment = review.Comment },
            newValues: new { isRemoved = true, reason = request.Reason, moderatedBy = userId },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var studentUser = review.Enrollment.StudentProfile.User;
        // F-23 (Đợt 4): centralized mapping.
        return ReviewMapper.ToDto(
            review,
            review.Enrollment.TutorProfileId,
            studentUser.Id,
            studentUser.FullName,
            studentUser.AvatarUrl);
    }
}
