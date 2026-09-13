using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// IClock for integration tests that exercises real DB time ordering.
/// </summary>
public sealed class StubIntegrationClock : IClock
{
    public static StubIntegrationClock Instance { get; } = new();

    public DateTime UtcNow => DateTime.UtcNow;
}
