using MediatR;
using Microsoft.EntityFrameworkCore;
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

    public CreateEnrollmentReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewDto> Handle(CreateEnrollmentReviewCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.StudentProfile).ThenInclude(s => s.User)
            .Include(e => e.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", request.EnrollmentId);
        }

        // 1. Participant Ownership Check: Only Student of this Enrollment can review
        if (enrollment.StudentProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("Only the student enrolled in this service can submit a review.");
        }

        // 2. Eligibility Guard (DEC-REV-002): Must be Completed
        if (enrollment.Status != EnrollmentStatus.Completed)
        {
            throw new ConflictException("Reviews can only be submitted for completed enrollments.");
        }

        var now = DateTime.UtcNow;

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

        var review = new Review
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            Rating = request.Rating,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            CreatedAt = now
        };

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
            tutorProfile.TotalReviews = allRatings.Count;
            tutorProfile.RatingAvg = Math.Round((decimal)allRatings.Average(), 2);
        }

        await _context.SaveChangesAsync(cancellationToken);

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
