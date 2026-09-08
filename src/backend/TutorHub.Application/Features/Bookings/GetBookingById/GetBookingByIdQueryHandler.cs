using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.GetBookingById;

public class GetBookingByIdQueryHandler : IRequestHandler<GetBookingByIdQuery, BookingDto>
{
    private readonly IAppDbContext _context;

    public GetBookingByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException("Booking", request.BookingId);
        }

        var paymentTx = await _context.GetPaymentTransactionAsync(booking.Id, cancellationToken);

        // Resource Authorization Check
        var isOwner = (request.Role == UserRole.Student && booking.StudentProfile.UserId == request.UserId) ||
                      (request.Role == UserRole.Tutor && booking.TutorProfile.UserId == request.UserId) ||
                      (request.Role == UserRole.Admin);

        if (!isOwner)
        {
            throw new ForbiddenException("You do not have permission to view this booking.");
        }

        // F-23 (Đợt 4): centralized mapping.
        return BookingMapper.ToDto(booking, BookingMapper.ToTransactionDto(paymentTx));
    }
}
