using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Availability.CreateAvailabilitySlot;
using TutorHub.Application.Features.Availability.DeleteAvailabilitySlot;
using TutorHub.Application.Features.Availability.DTOs;
using TutorHub.Application.Features.Availability.GetMyAvailabilitySlots;
using TutorHub.Application.Features.Availability.GetTutorAvailability;
using TutorHub.Application.Features.Reviews.DTOs;
using TutorHub.Application.Features.Reviews.GetTutorReviews;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Application.Features.Tutors.GetMyProfile;
using TutorHub.Application.Features.Tutors.GetMyTutorApplication;
using TutorHub.Application.Features.Tutors.GetTutorById;
using TutorHub.Application.Features.Tutors.GetTutors;
using TutorHub.Application.Features.Tutors.Services.CreateService;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Application.Features.Tutors.Services.GetMyServiceById;
using TutorHub.Application.Features.Tutors.Services.GetMyServices;
using TutorHub.Application.Features.Tutors.Services.GetTutorServices;
using TutorHub.Application.Features.Tutors.Services.PublishService;
using TutorHub.Application.Features.Tutors.Services.UnpublishService;
using TutorHub.Application.Features.Tutors.Services.UpdateService;
using TutorHub.Application.Features.Tutors.SubmitTutorApplication;
using TutorHub.Application.Features.Tutors.UpdateMyProfile;
using TutorHub.Application.Features.Tutors.UpdateMySubjects;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/tutors")]
public class TutorsController : ControllerBase
{
    private readonly ISender _sender;

    public TutorsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Search and filter verified tutors with pagination (Public).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTutors(
        [FromQuery] Guid? subjectId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] TeachingMode? teachingMode,
        [FromQuery] decimal? minRating,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetTutorsQuery(
            SubjectId: subjectId,
            MinPrice: minPrice,
            MaxPrice: maxPrice,
            TeachingMode: teachingMode,
            MinRating: minRating,
            Search: search,
            SortBy: sortBy,
            PageNumber: pageNumber,
            PageSize: pageSize
        );

        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TutorSummaryDto>>.SuccessResult(result, "Tutors list retrieved successfully."));
    }

    /// <summary>
    /// Get public profile details of a tutor by ID (Public).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TutorProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTutorById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetTutorByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<TutorProfileDto>.SuccessResult(result, "Tutor profile details retrieved successfully."));
    }

    /// <summary>
    /// Get dynamic availability schedule of a tutor by ID across a specific date range (Public).
    /// Calculates open time ranges by subtracting active bookings.
    /// </summary>
    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(ApiResponse<TutorAvailabilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTutorAvailability(
        [FromRoute] Guid id,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var query = new GetTutorAvailabilityQuery(id, fromDate, toDate);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<TutorAvailabilityDto>.SuccessResult(result, "Tutor availability schedule retrieved successfully."));
    }

    /// <summary>
    /// Get paginated public reviews for a specific tutor (Public).
    /// </summary>
    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorPublicReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTutorReviews(
        [FromRoute] Guid id,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetTutorReviewsQuery(id, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TutorPublicReviewDto>>.SuccessResult(result, "Tutor reviews retrieved successfully."));
    }

    /// <summary>
    /// Submit a new tutor application for admin review (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("me/application")]
    [ProducesResponseType(typeof(ApiResponse<TutorApplicationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitTutorApplication(
        [FromBody] SubmitTutorApplicationRequest request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<TeachingMode>(request.TeachingMode, true, out var parsedMode))
        {
            throw new BadRequestException("Teaching mode must be Online, Offline, or Both.");
        }

        var userId = GetCurrentUserId();
        var command = new SubmitTutorApplicationCommand(
            UserId: userId,
            Bio: request.Bio,
            Education: request.Education,
            ExperienceYears: request.ExperienceYears,
            TeachingMode: parsedMode,
            Address: request.Address,
            Latitude: request.Latitude,
            Longitude: request.Longitude
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TutorApplicationDto>.SuccessResult(result, "Tutor application submitted successfully."));
    }

    /// <summary>
    /// Get the current tutor application status and details (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpGet("me/application")]
    [ProducesResponseType(typeof(ApiResponse<TutorApplicationDto?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyTutorApplication(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyTutorApplicationQuery(userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<TutorApplicationDto?>.SuccessResult(result, "Current tutor application retrieved successfully."));
    }

    /// <summary>
    /// Get the profile details of the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<TutorMyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyProfileQuery(userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<TutorMyProfileDto>.SuccessResult(result, "Current tutor profile retrieved successfully."));
    }

    /// <summary>
    /// Partially update the profile information of the authenticated tutor (Tutor only).
    /// Only non-null provided fields will be updated.
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPatch("me")]
    [ProducesResponseType(typeof(ApiResponse<TutorMyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateMyProfileRequest request,
        CancellationToken cancellationToken)
    {
        TeachingMode? teachingMode = null;
        if (!string.IsNullOrWhiteSpace(request.TeachingMode))
        {
            if (!Enum.TryParse<TeachingMode>(request.TeachingMode, true, out var parsedMode))
            {
                throw new BadRequestException("Teaching mode must be Online, Offline, or Both.");
            }
            teachingMode = parsedMode;
        }

        var userId = GetCurrentUserId();
        var command = new UpdateMyProfileCommand(
            UserId: userId,
            FullName: request.FullName,
            Phone: request.Phone,
            AvatarUrl: request.AvatarUrl,
            Bio: request.Bio,
            Education: request.Education,
            ExperienceYears: request.ExperienceYears,
            HourlyRate: request.HourlyRate,
            TeachingMode: teachingMode,
            Address: request.Address,
            Latitude: request.Latitude,
            Longitude: request.Longitude
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<TutorMyProfileDto>.SuccessResult(result, "Tutor profile updated successfully."));
    }

    /// <summary>
    /// Update the registered subjects for the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPut("me/subjects")]
    [ProducesResponseType(typeof(ApiResponse<List<TutorSubjectDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMySubjects(
        [FromBody] UpdateMySubjectsRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateMySubjectsCommand(userId, request.Subjects);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<List<TutorSubjectDto>>.SuccessResult(result, "Tutor subjects updated successfully."));
    }

    /// <summary>
    /// Get weekly availability slots of the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpGet("me/availability-slots")]
    [ProducesResponseType(typeof(ApiResponse<List<AvailabilitySlotDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyAvailabilitySlots(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyAvailabilitySlotsQuery(userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<AvailabilitySlotDto>>.SuccessResult(result, "Availability slots retrieved successfully."));
    }

    /// <summary>
    /// Create a new weekly availability slot for the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("me/availability-slots")]
    [ProducesResponseType(typeof(ApiResponse<AvailabilitySlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAvailabilitySlot(
        [FromBody] CreateAvailabilitySlotRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateAvailabilitySlotCommand(userId, request.DayOfWeek, request.StartTime, request.EndTime);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<AvailabilitySlotDto>.SuccessResult(result, "Availability slot created successfully."));
    }

    /// <summary>
    /// Delete a weekly availability slot by ID for the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpDelete("me/availability-slots/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvailabilitySlot(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new DeleteAvailabilitySlotCommand(id, userId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Availability slot deleted successfully."));
    }

    /// <summary>
    /// Create a new tutoring service offering (Tutor only). Created in Draft status.
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("me/services")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateService(
        [FromBody] CreateServiceRequest request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<TeachingMode>(request.TeachingMode, true, out var parsedMode))
        {
            throw new BadRequestException("Teaching mode must be Online, Offline, or Both.");
        }

        var userId = GetCurrentUserId();
        var command = new CreateServiceCommand(
            UserId: userId,
            SubjectId: request.SubjectId,
            Title: request.Title,
            Description: request.Description,
            LearningScope: request.LearningScope,
            ExpectedOutcome: request.ExpectedOutcome,
            TotalSessions: request.TotalSessions,
            SessionDurationMinutes: request.SessionDurationMinutes,
            Price: request.Price,
            TeachingMode: parsedMode,
            TrialLessonUrl: request.TrialLessonUrl
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<ServiceDto>.SuccessResult(result, "Service offering created successfully in Draft status."));
    }

    /// <summary>
    /// Get all service offerings owned by the authenticated tutor across all statuses (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpGet("me/services")]
    [ProducesResponseType(typeof(ApiResponse<List<ServiceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyServices(
        [FromQuery] ServiceStatus? status,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyServicesQuery(userId, status);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<ServiceDto>>.SuccessResult(result, "Your service offerings retrieved successfully."));
    }

    /// <summary>
    /// Get details of a specific service offering owned by the authenticated tutor (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpGet("me/services/{serviceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyServiceById(
        [FromRoute] Guid serviceId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyServiceByIdQuery(serviceId, userId);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<ServiceDto>.SuccessResult(result, "Service details retrieved successfully."));
    }

    /// <summary>
    /// Update a service offering owned by the authenticated tutor (Tutor only).
    /// For published services, commercial terms cannot be modified directly (unpublish first).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPatch("me/services/{serviceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateService(
        [FromRoute] Guid serviceId,
        [FromBody] UpdateServiceRequest request,
        CancellationToken cancellationToken)
    {
        TeachingMode? teachingMode = null;
        if (!string.IsNullOrWhiteSpace(request.TeachingMode))
        {
            if (!Enum.TryParse<TeachingMode>(request.TeachingMode, true, out var parsedMode))
            {
                throw new BadRequestException("Teaching mode must be Online, Offline, or Both.");
            }
            teachingMode = parsedMode;
        }

        var userId = GetCurrentUserId();
        var command = new UpdateServiceCommand(
            ServiceId: serviceId,
            UserId: userId,
            Title: request.Title,
            Description: request.Description,
            LearningScope: request.LearningScope,
            ExpectedOutcome: request.ExpectedOutcome,
            TotalSessions: request.TotalSessions,
            SessionDurationMinutes: request.SessionDurationMinutes,
            Price: request.Price,
            TeachingMode: teachingMode,
            TrialLessonUrl: request.TrialLessonUrl
        );

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<ServiceDto>.SuccessResult(result, "Service offering updated successfully."));
    }

    /// <summary>
    /// Publish a draft or unpublished service to make it publicly discoverable on the marketplace (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("me/services/{serviceId:guid}/publish")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PublishService(
        [FromRoute] Guid serviceId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new PublishServiceCommand(serviceId, userId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<ServiceDto>.SuccessResult(result, "Service published successfully to the marketplace."));
    }

    /// <summary>
    /// Unpublish an active service to hide it from the public marketplace (Tutor only).
    /// </summary>
    [Authorize(Roles = "Tutor")]
    [HttpPost("me/services/{serviceId:guid}/unpublish")]
    [ProducesResponseType(typeof(ApiResponse<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnpublishService(
        [FromRoute] Guid serviceId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UnpublishServiceCommand(serviceId, userId);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<ServiceDto>.SuccessResult(result, "Service unpublished successfully."));
    }

    /// <summary>
    /// Get all published service offerings of a specific tutor (Public).
    /// </summary>
    [HttpGet("{id:guid}/services")]
    [ProducesResponseType(typeof(ApiResponse<List<ServiceSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTutorServices(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetTutorServicesQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<List<ServiceSummaryDto>>.SuccessResult(result, "Tutor's published services retrieved successfully."));
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
