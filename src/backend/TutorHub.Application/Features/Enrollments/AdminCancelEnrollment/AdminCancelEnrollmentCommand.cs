using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;

public record AdminCancelEnrollmentCommand(
    Guid AdminUserId,
    UserRole Role,
    Guid EnrollmentId,
    string Reason
) : IRequest<EnrollmentDto>;
