using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.GetEnrollmentReview;

public class GetEnrollmentReviewQueryHandler : IRequestHandler<GetEnrollmentReviewQuery, ReviewDto>
{
    private readonly IAppDbContext _context;

    public GetEnrollmentReviewQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewDto> Handle(GetEnrollmentReviewQuery request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .Include(e => e.Review)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // Authorization Guard: Only Student owner, Tutor owner, or Admin
        bool isStudent = enrollment.StudentProfile.UserId == request.UserId;
        bool isTutor = enrollment.TutorProfile.UserId == request.UserId;
        bool isAdmin = request.Role == UserRole.Admin;

        if (!isStudent && !isTutor && !isAdmin)
        {
            throw new ForbiddenException("You do not have permission to view the review for this enrollment.");
        }

        var review = enrollment.Review;
        if (review == null)
        {
            throw new NotFoundException("Review for this enrollment was not found.");
        }

        var studentUser = enrollment.StudentProfile.User;
        return new ReviewDto(
            Id: review.Id,
            EnrollmentId: enrollment.Id,
            TutorProfileId: enrollment.TutorProfileId,
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
