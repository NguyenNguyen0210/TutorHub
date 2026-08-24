using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.CreateReview;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, BookingReviewDto>
{
    private readonly IAppDbContext _context;

    public CreateReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingReviewDto> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Validate booking is Completed
        if (booking.Status != BookingStatus.Completed)
        {
            throw new BadRequestException("Reviews can only be submitted for completed bookings.");
        }

        // 2. Determine reviewer & reviewee identity from booking participants
        bool isStudent = booking.StudentProfile.UserId == request.UserId;
        bool isTutor = booking.TutorProfile.UserId == request.UserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You do not have permission to review this booking.");
        }

        Guid reviewerUserId;
        User reviewerUser;
        Guid revieweeUserId;
        User revieweeUser;
        bool isPublic;

        if (isStudent)
        {
            reviewerUserId = booking.StudentProfile.UserId;
            reviewerUser = booking.StudentProfile.User;
            revieweeUserId = booking.TutorProfile.UserId;
            revieweeUser = booking.TutorProfile.User;
            isPublic = true; // Student -> Tutor is public
        }
        else
        {
            reviewerUserId = booking.TutorProfile.UserId;
            reviewerUser = booking.TutorProfile.User;
            revieweeUserId = booking.StudentProfile.UserId;
            revieweeUser = booking.StudentProfile.User;
            isPublic = false; // Tutor -> Student is private (admin only)
        }

        // 3. Application-level check for duplicate review
        var alreadyReviewed = await _context.Reviews
            .AnyAsync(r => r.BookingId == request.BookingId && r.ReviewerUserId == request.UserId, cancellationToken);

        if (alreadyReviewed)
        {
            throw new ConflictException("You have already submitted a review for this booking.");
        }

        var now = DateTime.UtcNow;
        var review = new Review
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ReviewerUserId = reviewerUserId,
            RevieweeUserId = revieweeUserId,
            Rating = request.Rating,
            Comment = request.Comment?.Trim(),
            IsPublic = isPublic,
            CreatedAt = now
        };

        _context.Reviews.Add(review);

        // 4. If public review (Student -> Tutor), atomically recalculate TutorProfile aggregates
        if (isPublic)
        {
            var existingRatings = await _context.Reviews
                .Where(r => r.RevieweeUserId == revieweeUserId && r.IsPublic)
                .Select(r => r.Rating)
                .ToListAsync(cancellationToken);

            existingRatings.Add(request.Rating);

            var tutorProfile = await _context.TutorProfiles
                .FirstOrDefaultAsync(tp => tp.Id == booking.TutorProfileId, cancellationToken);

            if (tutorProfile != null)
            {
                tutorProfile.TotalReviews = existingRatings.Count;
                tutorProfile.RatingAvg = Math.Round((decimal)existingRatings.Average(), 2);
            }
        }

        // 5. Atomic Save with Database Unique Constraint violation protection
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var innerMsg = ex.InnerException?.Message ?? string.Empty;
            if (innerMsg.Contains("IX_Reviews_BookingId_ReviewerUserId") || innerMsg.Contains("23505"))
            {
                throw new ConflictException("You have already submitted a review for this booking.");
            }
            throw;
        }

        return new BookingReviewDto(
            Id: review.Id,
            BookingId: review.BookingId,
            ReviewerUserId: review.ReviewerUserId,
            ReviewerName: reviewerUser.FullName,
            RevieweeUserId: review.RevieweeUserId,
            RevieweeName: revieweeUser.FullName,
            Rating: review.Rating,
            Comment: review.Comment,
            IsPublic: review.IsPublic,
            CreatedAt: review.CreatedAt
        );
    }
}
