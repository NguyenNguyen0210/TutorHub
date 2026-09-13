using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;

namespace TutorHub.Application.Features.Reviews.ReplyReview;

public class ReplyReviewCommandHandler : IRequestHandler<ReplyReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ReplyReviewCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ReviewDto> Handle(ReplyReviewCommand request, CancellationToken cancellationToken)
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

        // 1. Authorization Guard: Only the Tutor belonging to this Enrollment can reply
        if (review.Enrollment.TutorProfile.UserId != userId)
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
        // F-23 (Đợt 4): centralized mapping.
        return ReviewMapper.ToDto(
            review,
            review.Enrollment.TutorProfileId,
            studentUser.Id,
            studentUser.FullName,
            studentUser.AvatarUrl);
    }
}
