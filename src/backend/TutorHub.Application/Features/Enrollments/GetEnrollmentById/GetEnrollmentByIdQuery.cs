using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Enrollments.GetEnrollmentById;

public record GetEnrollmentByIdQuery(
    Guid EnrollmentId
) : IRequest<EnrollmentDto>;
