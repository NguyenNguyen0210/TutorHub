using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.SubmitProfileReview;

public record SubmitProfileReviewCommand(Guid UserId) : IRequest<TutorProfileDto>;
