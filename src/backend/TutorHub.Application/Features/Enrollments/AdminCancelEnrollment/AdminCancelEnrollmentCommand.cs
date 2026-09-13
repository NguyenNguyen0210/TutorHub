using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Enrollments.AdminCancelEnrollment;

public record AdminCancelEnrollmentCommand(
    Guid EnrollmentId,
    string Reason
) : IRequest<EnrollmentDto>;
