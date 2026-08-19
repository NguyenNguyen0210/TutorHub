using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Admin.Categories.CreateCategory;
using TutorHub.Application.Features.Admin.Categories.DeleteCategory;
using TutorHub.Application.Features.Admin.Categories.GetAdminCategories;
using TutorHub.Application.Features.Admin.Categories.UpdateCategory;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Admin.Reports.GetAdminReportById;
using TutorHub.Application.Features.Admin.Reports.GetAdminReports;
using TutorHub.Application.Features.Admin.Reports.ResolveReport;
using TutorHub.Application.Features.Admin.Subjects.CreateSubject;
using TutorHub.Application.Features.Admin.Subjects.DeleteSubject;
using TutorHub.Application.Features.Admin.Subjects.GetAdminSubjects;
using TutorHub.Application.Features.Admin.Subjects.UpdateSubject;
using TutorHub.Application.Features.Admin.Tutors.ApproveTutor;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;
using TutorHub.Application.Features.Admin.Tutors.RejectTutor;
using TutorHub.Application.Features.Admin.Tutors.SuspendTutor;
using TutorHub.Application.Features.Admin.Withdrawals.ApproveWithdrawal;
using TutorHub.Application.Features.Admin.Withdrawals.GetAdminWithdrawals;
using TutorHub.Application.Features.Admin.Withdrawals.RejectWithdrawal;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Reports.DTOs;
using TutorHub.Application.Features.Subjects.DTOs;
using TutorHub.Application.Features.Wallets.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly ISender _sender;

    public AdminController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Get paginated list of tutor profiles with status and search filters (Admin only).
    /// </summary>
    [HttpGet("tutors")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTutorDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminTutors(
        [FromQuery] TutorProfileStatus? status,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminTutorsQuery(
            Status: status,
            Search: search,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminTutorDto>>.SuccessResult(result, "Admin tutors list retrieved successfully."));
    }

    /// <summary>
    /// Approve a pending tutor profile (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveTutor([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ApproveTutorCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile approved successfully."));
    }

    /// <summary>
    /// Reject a tutor profile with a reason (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTutor(
        [FromRoute] Guid id,
        [FromBody] AdminReviewRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new RejectTutorCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile rejected successfully."));
    }

    /// <summary>
    /// Suspend a tutor profile with a reason (Admin only).
    /// </summary>
    [HttpPost("tutors/{id:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendTutor(
        [FromRoute] Guid id,
        [FromBody] AdminReviewRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new SuspendTutorCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorDto>.SuccessResult(result, "Tutor profile suspended successfully."));
    }

    /// <summary>
    /// Get paginated list of all withdrawal requests in the platform (Admin only).
    /// </summary>
    [HttpGet("withdrawals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WithdrawalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminWithdrawals(
        [FromQuery] WithdrawalStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminWithdrawalsQuery(
            Status: status,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<WithdrawalDto>>.SuccessResult(result, "Admin withdrawals list retrieved successfully."));
    }

    /// <summary>
    /// Approve a pending withdrawal request and mark payout completed (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveWithdrawal([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ApproveWithdrawalCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal approved and completed successfully."));
    }

    /// <summary>
    /// Reject a pending withdrawal request and refund amount to tutor's available balance (Admin only).
    /// </summary>
    [HttpPost("withdrawals/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<WithdrawalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectWithdrawal(
        [FromRoute] Guid id,
        [FromBody] RejectWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new RejectWithdrawalCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WithdrawalDto>.SuccessResult(result, "Withdrawal rejected and amount refunded to tutor's wallet."));
    }

    /// <summary>
    /// Get paginated list of all dispute reports with status filter (Admin only).
    /// </summary>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReportSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminReports(
        [FromQuery] ReportStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminReportsQuery(status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ReportSummaryDto>>.SuccessResult(result, "Admin dispute reports list retrieved successfully."));
    }

    /// <summary>
    /// Get full detail of a dispute report by ID (Admin only).
    /// </summary>
    [HttpGet("reports/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdminReportById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetAdminReportByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Dispute report details retrieved successfully."));
    }

    /// <summary>
    /// Resolve a dispute report with decision and optional financial refund (Admin only).
    /// </summary>
    [HttpPost("reports/{id:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<AdminReportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ResolveReport(
        [FromRoute] Guid id,
        [FromBody] ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ResolveReportCommand(id, adminId, request.Decision, request.Resolution);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminReportDetailDto>.SuccessResult(result, "Dispute report resolved successfully."));
    }

    // ==========================================
    // CATEGORIES MANAGEMENT (Admin)
    // ==========================================

    /// <summary>
    /// Get paginated list of all categories with active filter and search (Admin only).
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminCategories(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminCategoriesQuery(search, isActive, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminCategoryDto>>.SuccessResult(result, "Admin categories retrieved successfully."));
    }

    /// <summary>
    /// Create a new category (Admin only).
    /// </summary>
    [HttpPost("categories")]
    [ProducesResponseType(typeof(ApiResponse<AdminCategoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCategory(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateCategoryCommand(request.Name, request.Description);
        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<AdminCategoryDto>.SuccessResult(result, "Category created successfully."));
    }

    /// <summary>
    /// Update an existing category (Admin only).
    /// </summary>
    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateCategory(
        [FromRoute] Guid id,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateCategoryCommand(id, request.Name, request.Description, request.IsActive);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminCategoryDto>.SuccessResult(result, "Category updated successfully."));
    }

    /// <summary>
    /// Delete a category (Admin only - must contain no subjects).
    /// </summary>
    [HttpDelete("categories/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteCategory([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteCategoryCommand(id);
        await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<object?>.SuccessResult(null, "Category deleted successfully."));
    }

    // ==========================================
    // SUBJECTS MANAGEMENT (Admin)
    // ==========================================

    /// <summary>
    /// Get paginated list of all subjects with category, active, and search filters (Admin only).
    /// </summary>
    [HttpGet("subjects")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminSubjectDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminSubjects(
        [FromQuery] Guid? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminSubjectsQuery(categoryId, isActive, search, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminSubjectDto>>.SuccessResult(result, "Admin subjects retrieved successfully."));
    }

    /// <summary>
    /// Create a new subject within an active category (Admin only).
    /// </summary>
    [HttpPost("subjects")]
    [ProducesResponseType(typeof(ApiResponse<AdminSubjectDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSubject(
        [FromBody] CreateSubjectRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateSubjectCommand(request.Name, request.CategoryId);
        var result = await _sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<AdminSubjectDto>.SuccessResult(result, "Subject created successfully."));
    }

    /// <summary>
    /// Update an existing subject (Admin only).
    /// </summary>
    [HttpPut("subjects/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminSubjectDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateSubject(
        [FromRoute] Guid id,
        [FromBody] UpdateSubjectRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateSubjectCommand(id, request.Name, request.CategoryId, request.IsActive);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminSubjectDto>.SuccessResult(result, "Subject updated successfully."));
    }

    /// <summary>
    /// Delete a subject (Admin only - must not be associated with tutors or bookings).
    /// </summary>
    [HttpDelete("subjects/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteSubject([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteSubjectCommand(id);
        await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<object?>.SuccessResult(null, "Subject deleted successfully."));
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
