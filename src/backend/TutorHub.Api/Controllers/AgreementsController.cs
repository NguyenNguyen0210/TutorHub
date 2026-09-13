using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Agreements.Commands.AcceptCustomAgreement;
using TutorHub.Application.Features.Agreements.Commands.CancelCustomAgreement;
using TutorHub.Application.Features.Agreements.Commands.CheckoutCustomAgreement;
using TutorHub.Application.Features.Agreements.Commands.CreateCustomAgreement;
using TutorHub.Application.Features.Agreements.Commands.RejectCustomAgreement;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Application.Features.Agreements.Queries.GetCustomAgreementById;
using TutorHub.Application.Features.Agreements.Queries.GetMyAgreements;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/agreements")]
public class AgreementsController : ControllerBase
{
    private readonly ISender _sender;

    public AgreementsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Propose a new custom agreement offer to a student (Tutor only - FR-AGREE-001).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Tutor")]
    [ProducesResponseType(typeof(ApiResponse<CustomAgreementDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAgreement(
        [FromBody] CreateCustomAgreementRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateCustomAgreementCommand(
            StudentProfileId: request.StudentProfileId,
            SubjectId: request.SubjectId,
            ServiceId: request.ServiceId,
            ConversationId: request.ConversationId,
            Title: request.Title,
            Description: request.Description,
            TotalPrice: request.TotalPrice,
            TotalSessions: request.TotalSessions,
            SessionDurationMinutes: request.SessionDurationMinutes,
            TeachingMode: request.TeachingMode,
            ValidityDays: request.ValidityDays ?? 7
        );

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<CustomAgreementDto>.SuccessResult(result, "Custom agreement offer proposed successfully.")
        );
    }

    /// <summary>
    /// Get custom agreement details by ID (Participant student/tutor or Admin - FR-AGREE-003).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CustomAgreementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAgreementById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetCustomAgreementByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<CustomAgreementDto>.SuccessResult(result, "Custom agreement details retrieved successfully."));
    }

    /// <summary>
    /// Get paginated list of custom agreements for the current authenticated user.
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomAgreementDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyAgreements(
        [FromQuery] CustomAgreementStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyAgreementsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);

        return Ok(ApiResponse<PagedResult<CustomAgreementDto>>.SuccessResult(result, "Agreements retrieved successfully."));
    }

    /// <summary>
    /// Accept a proposed custom agreement offer (Designated Student only - FR-AGREE-003).
    /// </summary>
    [HttpPost("{id:guid}/accept")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(ApiResponse<CustomAgreementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AcceptAgreement(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var command = new AcceptCustomAgreementCommand(id);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<CustomAgreementDto>.SuccessResult(result, "Custom agreement accepted successfully. You can now proceed to checkout."));
    }

    /// <summary>
    /// Reject a proposed custom agreement offer (Designated Student only).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(ApiResponse<CustomAgreementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectAgreement(
        [FromRoute] Guid id,
        [FromBody] RejectAgreementRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RejectCustomAgreementCommand(id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<CustomAgreementDto>.SuccessResult(result, "Custom agreement rejected successfully."));
    }

    /// <summary>
    /// Cancel/withdraw a proposed custom agreement offer (Proposing Tutor only).
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Tutor")]
    [ProducesResponseType(typeof(ApiResponse<CustomAgreementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelAgreement(
        [FromRoute] Guid id,
        [FromBody] CancelAgreementRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CancelCustomAgreementCommand(id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);

        return Ok(ApiResponse<CustomAgreementDto>.SuccessResult(result, "Custom agreement cancelled successfully."));
    }

    /// <summary>
    /// Checkout an accepted custom agreement into a canonical 15-minute holding Booking ready for payment (Designated Student only - FR-AGREE-004).
    /// </summary>
    [HttpPost("{id:guid}/checkout")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CheckoutAgreement(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var command = new CheckoutCustomAgreementCommand(id);
        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingDto>.SuccessResult(result, "Booking created from custom agreement with 15-minute checkout hold. Proceed to payment.")
        );
    }
}
