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
    private readonly ICurrentUserService _currentUserService;

    public GetEnrollmentReviewQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ReviewDto> Handle(GetEnrollmentReviewQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        var role = _currentUserService.Role;

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
        bool isStudent = enrollment.StudentProfile.UserId == userId;
        bool isTutor = enrollment.TutorProfile.UserId == userId;
        bool isAdmin = role == UserRole.Admin;

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
        // F-23 (Đợt 4): centralized mapping.
        return ReviewMapper.ToDto(
            review,
            enrollment.TutorProfileId,
            studentUser.Id,
            studentUser.FullName,
            studentUser.AvatarUrl);
    }
}
