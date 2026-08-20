using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Application.Features.Wallets.GetMyWallet;
using TutorHub.Application.Features.Wallets.GetMyWithdrawals;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/tutors/me/wallet")]
[Authorize(Roles = "Tutor")]
public class WalletsController : ControllerBase
{
    private readonly ISender _sender;

    public WalletsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get wallet balance and overview (Tutor only).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<WalletDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyWallet(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _sender.Send(new GetMyWalletQuery(userId), cancellationToken);

        return Ok(ApiResponse<WalletDto>.SuccessResult(result, "Wallet balance retrieved successfully."));
    }

    /// <summary>
    /// Submit a new withdrawal request to payout bank account (Tutor only).
    /// </summary>
    [HttpPost("withdraw")]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateWithdrawal(
        [FromBody] CreateWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateWithdrawalCommand(
            UserId: userId,
            Amount: request.Amount,
            BankName: request.BankName,
            AccountNumber: request.AccountNumber,
            AccountHolderName: request.AccountHolderName,
            Note: request.Note
        );

        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal request submitted successfully and is pending admin approval.")
        );
    }

    /// <summary>
    /// Get paginated withdrawal history for authenticated tutor (Tutor only).
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WithdrawalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyWithdrawals(
        [FromQuery] WithdrawalStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyWithdrawalsQuery(
            UserId: userId,
            Status: status,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<WithdrawalDto>>.SuccessResult(result, "Withdrawals history retrieved successfully."));
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
