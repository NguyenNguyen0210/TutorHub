using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;
using TutorHub.Application.Features.StudentWallets.Commands.AdminCompleteWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.AdminConfirmTopUp;
using TutorHub.Application.Features.StudentWallets.Commands.AdminFailWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.AdminProcessWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Queries.AdminGetTopUpRequests;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/admin/student-wallets")]
[Authorize(Roles = "Admin")]
public class AdminStudentWalletController : ControllerBase
{
    private readonly ISender _sender;

    public AdminStudentWalletController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get paginated list of student top-up requests (Admin only).
    /// </summary>
    [HttpGet("top-ups")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TopUpRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopUpRequests(
        [FromQuery] TopUpRequestStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new AdminGetTopUpRequestsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TopUpRequestDto>>.SuccessResult(result, "Top-up requests retrieved successfully."));
    }

    /// <summary>
    /// Confirm student top-up request and credit wallet balance atomically (Admin only).
    /// </summary>
    [HttpPost("top-ups/{id:guid}/confirm")]
    [ProducesResponseType(typeof(ApiResponse<TopUpRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmTopUp(
        [FromRoute] Guid id,
        [FromBody] AdminConfirmTopUpApiRequest? request,
        CancellationToken cancellationToken)
    {
        var command = new AdminConfirmTopUpCommand(id, request?.AdminNote);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TopUpRequestDto>.SuccessResult(result, "Top-up request confirmed and balance credited."));
    }

    /// <summary>
    /// Reject student top-up request with reason (Admin only).
    /// </summary>
    [HttpPost("top-ups/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<TopUpRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTopUp(
        [FromRoute] Guid id,
        [FromBody] AdminRejectTopUpApiRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AdminRejectTopUpCommand(id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TopUpRequestDto>.SuccessResult(result, "Top-up request rejected."));
    }

    /// <summary>
    /// Get paginated list of student withdrawal requests (Admin only).
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudentWithdrawalDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWithdrawals(
        [FromQuery] WithdrawalStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new AdminGetStudentWithdrawalsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StudentWithdrawalDto>>.SuccessResult(result, "Withdrawal requests retrieved successfully."));
    }

    /// <summary>
    /// Mark pending student withdrawal as processing (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/process")]
    [ProducesResponseType(typeof(ApiResponse<StudentWithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessWithdrawal(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var command = new AdminProcessStudentWithdrawalCommand(id);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<StudentWithdrawalDto>.SuccessResult(result, "Withdrawal marked as processing."));
    }

    /// <summary>
    /// Complete student withdrawal and finalize debit (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/complete")]
    [ProducesResponseType(typeof(ApiResponse<StudentWithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteWithdrawal(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var command = new AdminCompleteStudentWithdrawalCommand(id);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<StudentWithdrawalDto>.SuccessResult(result, "Withdrawal completed successfully."));
    }

    /// <summary>
    /// Fail student withdrawal and release reserved balance back to available (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/fail")]
    [ProducesResponseType(typeof(ApiResponse<StudentWithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FailWithdrawal(
        [FromRoute] Guid id,
        [FromBody] AdminFailWithdrawalApiRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AdminFailStudentWithdrawalCommand(id, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<StudentWithdrawalDto>.SuccessResult(result, "Withdrawal failed and funds returned to student available balance."));
    }

    /// <summary>
    /// Admin financial adjustment on student wallet (credit/debit with reason and audit trail).
    /// </summary>
    [HttpPost("adjust")]
    [ProducesResponseType(typeof(ApiResponse<StudentWalletDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdjustWallet(
        [FromBody] AdminAdjustWalletApiRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AdminAdjustStudentWalletCommand(
            request.StudentWalletId,
            request.Amount,
            request.Direction,
            request.Reason,
            request.ReferenceId
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<StudentWalletDto>.SuccessResult(result, "Student wallet balance adjusted successfully."));
    }
}
