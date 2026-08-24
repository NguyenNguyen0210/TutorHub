using MediatR;
using TutorHub.Application.Features.Users.DTOs;

namespace TutorHub.Application.Features.Users.UpdateMyProfile;

public record UpdateMyProfileCommand(
    Guid UserId,
    string FullName,
    string? Phone = null,
    string? AvatarUrl = null
) : IRequest<MyProfileDto>;
