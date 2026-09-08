using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Enrollments.GetEnrollmentById;

public record GetEnrollmentByIdQuery(
    Guid UserId,
    UserRole Role,
    Guid EnrollmentId
) : IRequest<EnrollmentDto>;
