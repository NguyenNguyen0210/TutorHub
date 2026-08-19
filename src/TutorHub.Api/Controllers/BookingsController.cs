using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Bookings.CancelBooking;
using TutorHub.Application.Features.Bookings.CompleteBooking;
using TutorHub.Application.Features.Bookings.ConfirmBooking;
using TutorHub.Application.Features.Bookings.CreateBooking;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Bookings.GetBookingById;
using TutorHub.Application.Features.Bookings.GetMyBookings;
using TutorHub.Application.Features.Bookings.PayBooking;
using TutorHub.Application.Features.Bookings.RejectBooking;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public class BookingsController : ControllerBase
{
    private readonly ISender _sender;

    public BookingsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Create a new 1-on-1 booking with a 15-minute temporary hold (Student only).
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateBooking(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateBookingCommand(
            UserId: userId,
            TutorProfileId: request.TutorProfileId,
            SubjectId: request.SubjectId,
            StartAt: request.StartAt,
            EndAt: request.EndAt
        );

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingDto>.SuccessResult(result, "Booking created successfully. Please complete payment within 15 minutes to secure your slot.")
        );
    }

    /// <summary>
    /// Pay for a holding booking to transition into Pending confirmation (Student only).
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost("{id:guid}/pay")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PayBooking(
        [FromRoute] Guid id,
        [FromBody] PayBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new PayBookingCommand(id, userId, request.PaymentMethod);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Payment successful. Booking is now pending tutor confirmation."));
    }

    /// <summary>
    /// Get paginated list of bookings for the authenticated user (Student/Tutor/Admin).
    /// </summary>
    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<BookingSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] BookingStatus? status,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var query = new GetMyBookingsQuery(
            UserId: userId,
            Role: role,
            Status: status,
            FromDate: fromDate,
            ToDate: toDate,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<BookingSummaryDto>>.SuccessResult(result, "Bookings list retrieved successfully."));
    }

    /// <summary>
    /// Get detailed booking information by ID (Participant or Admin only).
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBookingById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var query = new GetBookingByIdQuery(id, userId, role);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Booking details retrieved successfully."));
    }

    /// <summary>
    /// Confirm a pending booking within 24 hours of payment (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("{id:guid}/confirm")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ConfirmBooking(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new ConfirmBookingCommand(id, userId);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Booking confirmed successfully."));
    }

    /// <summary>
    /// Reject a pending booking with a reason and process 100% refund (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectBooking(
        [FromRoute] Guid id,
        [FromBody] RejectBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new RejectBookingCommand(id, userId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Booking rejected and full refund processed."));
    }

    /// <summary>
    /// Cancel a booking and process refund according to PRD cancellation policy (Student/Tutor).
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelBooking(
        [FromRoute] Guid id,
        [FromBody] CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var command = new CancelBookingCommand(id, userId, role, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Booking cancelled successfully. Refund processed according to cancellation policy."));
    }

    /// <summary>
    /// Mark a confirmed booking as completed after the session finishes (Participant or Admin).
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompleteBooking(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var command = new CompleteBookingCommand(id, userId, role);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<BookingDto>.SuccessResult(result, "Booking marked as completed successfully. Payment released to tutor."));
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("User ID is invalid or missing from token.");
        }
        return userId;
    }

    private UserRole GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (Enum.TryParse<UserRole>(roleClaim, true, out var role))
        {
            return role;
        }
        throw new UnauthorizedException("User role is invalid or missing from token.");
    }
}
