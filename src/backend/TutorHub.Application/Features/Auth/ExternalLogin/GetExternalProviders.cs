using MediatR;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>Which external sign-in buttons the client should render.</summary>
public record ExternalProvidersDto(IReadOnlyList<string> Providers, bool Enabled);

public record GetExternalProvidersQuery : IRequest<ExternalProvidersDto>;
