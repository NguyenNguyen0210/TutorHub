using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.AdminModerateReview;

public class AdminModerateReviewCommandHandler : IRequestHandler<AdminModerateReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _context;

    public AdminModerateReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewDto> Handle(AdminModerateReviewCommand request, CancellationToken cancellationToken)
    {
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
        review.RemoveByAdmin(request.Reason, request.AdminId);

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
            tutorProfile.TotalReviews = remainingRatings.Count;
            tutorProfile.RatingAvg = remainingRatings.Count > 0
                ? Math.Round((decimal)remainingRatings.Average(), 2)
                : 0;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var studentUser = review.Enrollment.StudentProfile.User;
        return new ReviewDto(
            Id: review.Id,
            EnrollmentId: review.EnrollmentId,
            TutorProfileId: review.Enrollment.TutorProfileId,
            ReviewerUserId: studentUser.Id,
            StudentName: studentUser.FullName,
            StudentAvatarUrl: studentUser.AvatarUrl,
            Rating: review.Rating,
            Comment: review.Comment,
            TutorReply: review.TutorReply,
            TutorRepliedAt: review.TutorRepliedAt,
            IsRemoved: review.IsRemoved,
            CreatedAt: review.CreatedAt
        );
    }
}
