using MediatR;
using TutorHub.Application.Features.PlatformSettings.DTOs;

namespace TutorHub.Application.Features.PlatformSettings.Queries.AdminGetPlatformSettings;

public record AdminGetPlatformSettingsQuery : IRequest<List<PlatformSettingDto>>;
