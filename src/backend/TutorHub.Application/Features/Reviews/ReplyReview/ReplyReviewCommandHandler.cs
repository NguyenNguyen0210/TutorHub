using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.ReplyReview;

public class ReplyReviewCommandHandler : IRequestHandler<ReplyReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _context;

    public ReplyReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewDto> Handle(ReplyReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .Include(r => r.Enrollment).ThenInclude(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(r => r.Enrollment).ThenInclude(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
        {
            throw new NotFoundException("Review", request.ReviewId);
        }

        // 1. Authorization Guard: Only the Tutor belonging to this Enrollment can reply
        if (review.Enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to reply to this review.");
        }

        // 2. Removal State Guard
        if (review.IsRemoved)
        {
            throw new ConflictException("Cannot reply to a review that has been removed.");
        }

        // 3. Apply reply via domain method
        review.SetTutorReply(request.Reply);
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
