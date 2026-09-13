using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.CreateEnrollmentReview;

public class CreateEnrollmentReviewCommandHandler : IRequestHandler<CreateEnrollmentReviewCommand, ReviewDto>
{
    private const int DefaultReviewWindowDays = 30;
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CreateEnrollmentReviewCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<ReviewDto> Handle(CreateEnrollmentReviewCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // 1. Participant Ownership Check: Only Student of this Enrollment can review
        if (enrollment.StudentProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the student enrolled in this service can submit a review.");
        }

        // 2. Eligibility Guard (DEC-REV-002): Must be Completed
        if (enrollment.Status != EnrollmentStatus.Completed)
        {
            throw new ConflictException("Reviews can only be submitted for completed enrollments.");
        }

        var now = _clock.UtcNow;

        // 3. Review Window Guard (FR-OPEN-006 / DEC-REV-008: Default 30 days post-completion)
        if (enrollment.CompletedAt.HasValue && now > enrollment.CompletedAt.Value.AddDays(DefaultReviewWindowDays))
        {
            throw new ConflictException($"The {DefaultReviewWindowDays}-day review window for this completed enrollment has expired.");
        }

        // 4. Cardinality / Uniqueness Guard (DEC-REV-001): Max 1 review per enrollment
        var alreadyReviewed = await _context.Reviews
            .AnyAsync(r => r.EnrollmentId == request.EnrollmentId, cancellationToken);

        if (alreadyReviewed)
        {
            throw new ConflictException("A review has already been submitted for this enrollment.");
        }

        Review review;
        try
        {
            // F-23: validated construction lives in the domain (also enforces 1-5 range).
            review = Review.Create(enrollment.Id, request.Rating, request.Comment);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        review.Enrollment = enrollment;

        // 5. Rating Aggregation / Projection (DEC-REV-007)
        var existingRatings = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.Enrollment)
            .Where(r => r.Enrollment != null && r.Enrollment.TutorProfileId == enrollment.TutorProfileId && !r.IsRemoved)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        _context.Reviews.Add(review);

        var allRatings = existingRatings.Append(request.Rating).ToList();
        var tutorProfile = await _context.TutorProfiles
            .FirstOrDefaultAsync(tp => tp.Id == enrollment.TutorProfileId, cancellationToken);

        if (tutorProfile != null)
        {
            // F-23: denormalized stats owned by the domain.
            tutorProfile.ApplyReview(allRatings);
        }

        // Enqueue ReviewCreated Outbox Message (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new ReviewCreatedEvent(
            review.Id,
            enrollment.Id,
            enrollment.TutorProfileId,
            enrollment.TutorProfile.UserId,
            enrollment.StudentProfile.UserId,
            review.Rating));

        await _context.SaveChangesAsync(cancellationToken);

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
