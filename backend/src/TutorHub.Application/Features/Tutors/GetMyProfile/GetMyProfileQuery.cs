using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetMyProfile;

public record GetMyProfileQuery(Guid UserId) : IRequest<TutorProfileDto>;
