using MediatR;
using TutorHub.Application.Features.PlatformSettings.DTOs;

namespace TutorHub.Application.Features.PlatformSettings.Commands.AdminUpsertPlatformSetting;

/// <summary>
/// Generic versioned setting upsert (F-17 plumbing).
/// Allowed keys are whitelisted; values stay opaque strings so policy
/// semantics (D-01..D-08) can be decided later without schema changes.
/// </summary>
public record AdminUpsertPlatformSettingCommand(
    string Key,
    string Value,
    string Reason
) : IRequest<PlatformSettingDto>;
