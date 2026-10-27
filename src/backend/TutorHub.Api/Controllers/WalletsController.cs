using TutorHub.Api.Filters;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Application.Features.Wallets.GetMyWallet;
using TutorHub.Application.Features.Wallets.GetMyWithdrawals;
using TutorHub.Application.Features.Wallets.GetWalletStatement;
using TutorHub.Application.Features.Wallets.PayoutAccount.GetPayoutAccount;
using TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/wallets/me")]
[Route("api/v1/tutors/me/wallet")]
[Route("api/v1/students/me/wallet")]
[Authorize]
public class WalletsController : ControllerBase
{
    private readonly ISender _sender;

    public WalletsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get wallet balance and overview (Unified for Tutors and Students).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<WalletDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyWallet(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetMyWalletQuery(), cancellationToken);
        return Ok(ApiResponse<WalletDto>.SuccessResult(result, "Wallet balance retrieved successfully."));
    }

    /// <summary>
    /// Submit a new withdrawal request to payout bank account.
    /// </summary>
    [HttpPost("withdrawals")]
    [Idempotent]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateWithdrawal(
        [FromBody] CreateWithdrawalCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal request submitted successfully and is pending admin approval.")
        );
    }

    /// <summary>
    /// Get paginated withdrawal history for authenticated user.
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WithdrawalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyWithdrawals(
        [FromQuery] WithdrawalStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyWithdrawalsQuery(
            Status: status,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<WithdrawalDto>>.SuccessResult(result, "Withdrawals history retrieved successfully."));
    }

    /// <summary>
    /// Get default payout bank account destination for authenticated tutor.
    /// </summary>
    [HttpGet("payout-account")]
    [Authorize(Roles = "Tutor")]
    [ProducesResponseType(typeof(ApiResponse<TutorPayoutAccountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPayoutAccount(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetPayoutAccountQuery(), cancellationToken);
        return Ok(ApiResponse<TutorPayoutAccountDto>.SuccessResult(result, "Payout bank account retrieved successfully."));
    }

    /// <summary>
    /// Update default payout bank account destination for authenticated tutor.
    /// </summary>
    [HttpPut("payout-account")]
    [Authorize(Roles = "Tutor")]
    [ProducesResponseType(typeof(ApiResponse<TutorPayoutAccountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePayoutAccount(
        [FromBody] UpdatePayoutAccountCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TutorPayoutAccountDto>.SuccessResult(result, "Payout bank account updated successfully."));
    }

    /// <summary>
    /// Get paginated transaction history for authenticated user.
    /// </summary>
    [HttpGet("statement")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WalletTransactionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWalletStatement(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetWalletStatementQuery(
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<WalletTransactionDto>>.SuccessResult(result, "Wallet statement retrieved successfully."));
    }

    /// <summary>
    /// Initiate an automated wallet top-up via VNPay (generates hosted payment URL).
    /// </summary>
    [HttpPost("top-up")]
    [HttpPost("top-up/vnpay")]
    [Idempotent]
    [ProducesResponseType(typeof(ApiResponse<VnPayTopUpRedirectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateVnPayTopUp(
        [FromBody] StudentTopUpApiRequest request,
        CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new CreateVnPayTopUpCommand(request.Amount, clientIp);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<VnPayTopUpRedirectDto>.SuccessResult(result, "VNPay payment URL generated successfully."));
    }

    /// <summary>
    /// Get user's top-up request history.
    /// </summary>
    [HttpGet("top-up")]
    [HttpGet("top-ups")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TopUpRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyTopUpRequests(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyTopUpRequestsQuery(pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TopUpRequestDto>>.SuccessResult(result, "Top-up requests retrieved successfully."));
    }
}
