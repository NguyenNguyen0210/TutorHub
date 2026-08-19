using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Reviews.GetBookingReviews;

public class GetBookingReviewsQueryHandler : IRequestHandler<GetBookingReviewsQuery, IReadOnlyList<BookingReviewDto>>
{
    private readonly IAppDbContext _context;

    public GetBookingReviewsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<BookingReviewDto>> Handle(GetBookingReviewsQuery request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        // 1. Authorization check
        bool isStudent = booking.StudentProfile.UserId == request.UserId;
        bool isTutor = booking.TutorProfile.UserId == request.UserId;
        bool isAdmin = request.Role == UserRole.Admin;

        if (!isStudent && !isTutor && !isAdmin)
        {
            throw new ForbiddenException("You do not have permission to view reviews for this booking.");
        }

        var query = _context.Reviews
            .AsNoTracking()
            .Include(r => r.ReviewerUser)
            .Include(r => r.RevieweeUser)
            .Where(r => r.BookingId == request.BookingId)
            .AsQueryable();

        // 2. Privacy-first projection based on role
        if (!isAdmin)
        {
            if (isStudent)
            {
                // Student can see their own review (Student -> Tutor), but CANNOT see private Tutor -> Student review
                query = query.Where(r => r.ReviewerUserId == request.UserId || r.IsPublic);
            }
            else if (isTutor)
            {
                // Tutor can see their own review and reviews received
                query = query.Where(r => r.ReviewerUserId == request.UserId || r.RevieweeUserId == request.UserId);
            }
        }

        var reviews = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new BookingReviewDto(
                r.Id,
                r.BookingId,
                r.ReviewerUserId,
                r.ReviewerUser.FullName,
                r.RevieweeUserId,
                r.RevieweeUser.FullName,
                r.Rating,
                r.Comment,
                r.IsPublic,
                r.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return reviews;
    }
}
