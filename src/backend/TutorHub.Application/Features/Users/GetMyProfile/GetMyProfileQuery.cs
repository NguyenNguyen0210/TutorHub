using MediatR;
using TutorHub.Application.Features.Users.DTOs;

namespace TutorHub.Application.Features.Users.GetMyProfile;

public record GetMyProfileQuery(
    Guid UserId
) : IRequest<MyProfileDto>;
