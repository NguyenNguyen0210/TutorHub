using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Enrollments.CancelEnrollment;

public record CancelEnrollmentCommand(
    Guid UserId,
    Guid EnrollmentId,
    string Reason
) : IRequest<EnrollmentDto>;
