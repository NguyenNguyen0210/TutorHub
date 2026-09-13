using MediatR;
using TutorHub.Application.Features.PlatformSettings.DTOs;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpdatePlatformFee;

public record AdminUpdatePlatformFeeCommand(
    decimal NewFeeRate,
    string Reason
) : IRequest<PlatformSettingDto>;
