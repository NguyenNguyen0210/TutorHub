using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.UnitTests.TestHelpers;

/// <summary>
/// IClock for unit tests. Defaults to the current UTC instant (matching the
/// production SystemClock) so existing time-relative expectations keep working;
/// pass an explicit instant for deterministic scenarios.
/// </summary>
public sealed class StubClock : IClock
{
    public StubClock(DateTime? now = null)
    {
        UtcNow = now ?? DateTime.UtcNow;
    }

    public DateTime UtcNow { get; }

    /// <summary>A fresh clock snapshot; mirrors production "now".</summary>
    public static StubClock Instance => new();
}
