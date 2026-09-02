using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Enrollments.TutorCannotContinue;

public record TutorCannotContinueCommand(
    Guid UserId,
    Guid EnrollmentId,
    string Reason
) : IRequest<EnrollmentDto>;
