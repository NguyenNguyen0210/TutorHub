using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Disputes.Commands.AdminMoveDisputeUnderReview;
using TutorHub.Application.Features.Disputes.Commands.AdminResolveDispute;
using TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Application.Features.Disputes.Queries.AdminGetDisputeInvestigation;
using TutorHub.Application.Features.Disputes.Queries.AdminGetDisputes;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin/disputes")]
public class AdminDisputesController : ControllerBase
{
    private readonly ISender _sender;

    public AdminDisputesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Admin: List disputes with optional status filter and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<AdminDisputeListResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDisputes(
        [FromQuery] DisputeStatus? status = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new AdminGetDisputesQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminDisputeListResponseDto>.SuccessResult(result, "Disputes retrieved successfully."));
    }

    /// <summary>
    /// Admin: Get 360-degree investigation packet for a dispute.
    /// </summary>
    [HttpGet("{id:guid}/investigation")]
    [ProducesResponseType(typeof(ApiResponse<DisputeInvestigationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvestigation(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new AdminGetDisputeInvestigationQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<DisputeInvestigationDto>.SuccessResult(result, "Investigation details retrieved successfully."));
    }

    /// <summary>
    /// Admin: Transition dispute to UnderReview.
    /// </summary>
    [HttpPost("{id:guid}/under-review")]
    [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MoveUnderReview(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new AdminMoveDisputeUnderReviewCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<DisputeDto>.SuccessResult(result, "Dispute is now under active review."));
    }

    /// <summary>
    /// Admin: Terminal resolution with financial settlement and explicit ledger adjustments.
    /// </summary>
    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolveDispute(
        [FromRoute] Guid id,
        [FromBody] AdminResolveDisputeRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new AdminResolveDisputeCommand(
            DisputeId: id,
            AdminUserId: adminId,
            Decision: request.Decision,
            CustomRefundAmount: request.CustomRefundAmount,
            AdminNotes: request.AdminNotes
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<DisputeDto>.SuccessResult(result, "Dispute has been resolved."));
    }

    /// <summary>
    /// Admin: Process external settlement callback for student refund.
    /// </summary>
    [HttpPost("refunds/{transactionId:guid}/callback")]
    [ProducesResponseType(typeof(ApiResponse<RefundCallbackResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessRefundCallback(
        [FromRoute] Guid transactionId,
        [FromBody] ProcessRefundCallbackRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new TutorHub.Application.Features.Disputes.Commands.AdminProcessRefundCallback.AdminProcessRefundCallbackCommand(
            RefundTransactionId: transactionId,
            Outcome: request.Outcome,
            ProviderReference: request.ProviderReference,
            FailureReason: request.FailureReason,
            AdminUserId: adminId
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<RefundCallbackResultDto>.SuccessResult(result, result.Message));
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
}

public record AdminResolveDisputeRequest(
    DisputeResolutionDecision Decision,
    decimal? CustomRefundAmount,
    string AdminNotes
);

public record ProcessRefundCallbackRequest(
    TransactionStatus Outcome,
    string? ProviderReference,
    string? FailureReason
);
