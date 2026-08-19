using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.GetMyBookings;

public record GetMyBookingsQuery(
    Guid UserId,
    UserRole Role,
    BookingStatus? Status = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<BookingSummaryDto>>;
