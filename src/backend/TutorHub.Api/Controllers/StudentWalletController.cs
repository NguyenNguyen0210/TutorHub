using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;
using TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentTransactions;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWallet;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWithdrawals;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/students/me/wallet")]
[Authorize(Roles = "Student")]
public class StudentWalletController : ControllerBase
{
    private readonly ISender _sender;

    public StudentWalletController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get student wallet balance and overview.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<StudentWalletDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyWallet(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetMyStudentWalletQuery(), cancellationToken);
        return Ok(ApiResponse<StudentWalletDto>.SuccessResult(result, "Student wallet retrieved successfully."));
    }

    /// <summary>
    /// Get paginated transaction ledger statement for student wallet.
    /// </summary>
    [HttpGet("statement")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudentWalletTransactionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetWalletStatement(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyStudentTransactionsQuery(pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StudentWalletTransactionDto>>.SuccessResult(result, "Statement retrieved successfully."));
    }

    /// <summary>
    /// Initiate an automated wallet top-up via VNPay Sandbox (generates hosted payment URL).
    /// </summary>
    [HttpPost("top-up")]
    [HttpPost("top-up/vnpay")]
    [ProducesResponseType(typeof(ApiResponse<VnPayTopUpRedirectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
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
    /// Get student's top-up request history.
    /// </summary>
    [HttpGet("top-up")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TopUpRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyTopUpRequests(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyTopUpRequestsQuery(pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TopUpRequestDto>>.SuccessResult(result, "Top-up requests retrieved successfully."));
    }

    /// <summary>
    /// Request a withdrawal from student wallet to a bank account.
    /// </summary>
    [HttpPost("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<StudentWithdrawalDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RequestWithdrawal(
        [FromBody] StudentWithdrawalApiRequest request,
        CancellationToken cancellationToken)
    {
        var command = new StudentRequestWithdrawalCommand(
            request.Amount,
            request.BankName,
            request.BankCode,
            request.AccountNumber,
            request.AccountHolderName,
            request.Note
        );

        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<StudentWithdrawalDto>.SuccessResult(result, "Withdrawal request submitted successfully.")
        );
    }

    /// <summary>
    /// Get student's withdrawal history.
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudentWithdrawalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyWithdrawals(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMyStudentWithdrawalsQuery(pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StudentWithdrawalDto>>.SuccessResult(result, "Withdrawals retrieved successfully."));
    }
}
