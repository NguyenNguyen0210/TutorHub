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
using TutorHub.Application.Features.Admin.Dashboard.DTOs;
using TutorHub.Application.Features.Admin.Dashboard.GetAdminDashboardStats;
using TutorHub.Application.Features.Admin.Dashboard.GetAdminRevenueChart;
using TutorHub.Application.Features.Admin.Reports.DTOs;
using TutorHub.Application.Features.Admin.Reports.GetAdminReportById;
using TutorHub.Application.Features.Admin.Reports.GetAdminReports;
using TutorHub.Application.Features.Admin.Reports.ResolveReport;
using TutorHub.Application.Features.Admin.Subjects.CreateSubject;
using TutorHub.Application.Features.Admin.Subjects.DeleteSubject;
using TutorHub.Application.Features.Admin.Subjects.GetAdminSubjects;
using TutorHub.Application.Features.Admin.Subjects.UpdateSubject;
using TutorHub.Application.Features.Admin.Transactions.DTOs;
using TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;
using TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Application.Features.Admin.TutorApplications.GetAdminTutorApplications;
using TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;
using TutorHub.Application.Features.Admin.Tutors.GetAdminTutors;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Application.Features.Admin.Users.GetAdminUserById;
using TutorHub.Application.Features.Admin.Users.GetAdminUsers;
using TutorHub.Application.Features.Admin.Users.SuspendUser;
using TutorHub.Application.Features.Admin.Users.ReactivateUser;
using TutorHub.Application.Features.Admin.Users.BanUser;
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
    /// Get paginated list of tutor applications with status and search filters (Admin only).
    /// </summary>
    [HttpGet("tutor-applications")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTutorApplicationListItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminTutorApplications(
        [FromQuery] TutorApplicationStatus? status,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminTutorApplicationsQuery(
            Status: status,
            Search: search,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminTutorApplicationListItemDto>>.SuccessResult(result, "Admin tutor applications list retrieved successfully."));
    }

    /// <summary>
    /// Approve a pending tutor application (Admin only).
    /// </summary>
    [HttpPost("tutor-applications/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorApplicationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveTutorApplication([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ApproveTutorApplicationCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorApplicationDto>.SuccessResult(result, "Tutor application approved successfully."));
    }

    /// <summary>
    /// Reject a tutor application with a reason (Admin only).
    /// </summary>
    [HttpPost("tutor-applications/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AdminTutorApplicationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectTutorApplication(
        [FromRoute] Guid id,
        [FromBody] RejectTutorApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new RejectTutorApplicationCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminTutorApplicationDto>.SuccessResult(result, "Tutor application rejected successfully."));
    }

    /// <summary>
    /// Get paginated list of tutor profiles with status and search filters (Admin only).
    /// </summary>
    [HttpGet("tutors")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTutorProfileDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminTutors(
        [FromQuery] TutorApplicationStatus? status,
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
        return Ok(ApiResponse<PagedResult<AdminTutorProfileDto>>.SuccessResult(result, "Admin tutors list retrieved successfully."));
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

    /// <summary>
    /// Get real-time overview metrics for the Admin Dashboard (Admin only).
    /// </summary>
    [HttpGet("dashboard/stats")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var query = new GetAdminDashboardStatsQuery();
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminDashboardStatsDto>.SuccessResult(result, "Dashboard stats retrieved successfully."));
    }

    /// <summary>
    /// Get monthly revenue and booking analytics chart data (Admin only).
    /// </summary>
    [HttpGet("dashboard/revenue-chart")]
    [ProducesResponseType(typeof(ApiResponse<RevenueChartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRevenueChart(
        [FromQuery] int months = 6,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminRevenueChartQuery(months);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<RevenueChartDto>.SuccessResult(result, "Revenue chart retrieved successfully."));
    }

    /// <summary>
    /// Get paginated list of all users on the platform with search and filters (Admin only).
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] AccountStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminUsersQuery(search, role, status, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminUserSummaryDto>>.SuccessResult(result, "Users retrieved successfully."));
    }

    /// <summary>
    /// Get detailed profile, teaching/learning stats, and recent bookings for a specific user (Admin only).
    /// </summary>
    [HttpGet("users/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetAdminUserByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<AdminUserDetailDto>.SuccessResult(result, "User detail retrieved successfully."));
    }

    /// <summary>
    /// Suspend a user account with session revocation and audit logging (Admin only).
    /// </summary>
    [HttpPost("users/{id:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SuspendUser(
        [FromRoute] Guid id,
        [FromBody] SuspendUserRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new SuspendUserCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminUserSummaryDto>.SuccessResult(result, "User account suspended successfully."));
    }

    /// <summary>
    /// Reactivate a suspended user account with audit logging (Admin only).
    /// </summary>
    [HttpPost("users/{id:guid}/reactivate")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReactivateUser(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new ReactivateUserCommand(id, adminId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminUserSummaryDto>.SuccessResult(result, "User account reactivated successfully."));
    }

    /// <summary>
    /// Ban a user account with session revocation and audit logging (Admin only).
    /// </summary>
    [HttpPost("users/{id:guid}/ban")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BanUser(
        [FromRoute] Guid id,
        [FromBody] BanUserRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        var command = new BanUserCommand(id, adminId, request.Reason);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AdminUserSummaryDto>.SuccessResult(result, "User account banned successfully."));
    }

    /// <summary>
    /// Get paginated list of all financial transactions across the platform with filters (Admin only).
    /// </summary>
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminTransactionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAdminTransactions(
        [FromQuery] string? search,
        [FromQuery] TransactionStatus? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminTransactionsQuery(search, status, fromDate, toDate, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminTransactionDto>>.SuccessResult(result, "Transactions retrieved successfully."));
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
