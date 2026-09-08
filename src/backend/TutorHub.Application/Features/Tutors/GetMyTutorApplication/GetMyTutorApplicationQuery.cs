using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetMyTutorApplication;

public record GetMyTutorApplicationQuery(Guid UserId) : IRequest<TutorApplicationDto?>;
