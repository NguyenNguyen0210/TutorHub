using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Enrollments.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.GetMyEnrollments;

public record GetMyEnrollmentsQuery(
    Guid UserId,
    UserRole Role,
    EnrollmentStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<EnrollmentSummaryDto>>;
