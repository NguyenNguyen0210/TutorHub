using MediatR;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.ExternalLogin;

namespace TutorHub.Application.Features.Auth.ExternalLogin;

/// <summary>
/// Reports which providers have credentials configured, so the client renders only
/// the buttons that can actually work. A half-configured provider is excluded.
/// </summary>
public class GetExternalProvidersQueryHandler : IRequestHandler<GetExternalProvidersQuery, ExternalProvidersDto>
{
    private readonly IEnumerable<IExternalAuthProvider> _providers;

    public GetExternalProvidersQueryHandler(IEnumerable<IExternalAuthProvider> providers)
    {
        _providers = providers;
    }

    public Task<ExternalProvidersDto> Handle(GetExternalProvidersQuery request, CancellationToken cancellationToken)
    {
        var enabled = _providers
            .Where(p => p.IsConfigured)
            .Select(p => p.Provider.ToString())
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(new ExternalProvidersDto(enabled, enabled.Count > 0));
    }
}
