using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

/// <summary>
/// P0-D3 / P0-F3: brute-force lockout state machine.
///
/// The counter is per ACCOUNT (not per IP) so a distributed credential-stuffing
/// attempt cannot sidestep the per-IP rate limiter. Every failure is counted, the
/// threshold locks the account for the configured window, and a successful
/// authentication clears the state.
/// </summary>
public class UserLockoutTests
{
    private static readonly DateTime Now = new(2026, 9, 14, 12, 0, 0, DateTimeKind.Utc);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private static User CreateUser() => new UserBuilder().WithEmail("lockout@example.com").Build();

    [Fact]
    public void NewAccount_IsNotLockedOut()
    {
        var user = CreateUser();

        user.AccessFailedCount.Should().Be(0);
        user.LockoutEndAt.Should().BeNull();
        user.IsLockedOut(Now).Should().BeFalse();
    }

    [Fact]
    public void BelowThreshold_CountsEveryFailureWithoutLocking()
    {
        var user = CreateUser();

        for (var attempt = 1; attempt < 5; attempt++)
        {
            user.RegisterFailedLogin(Now, maxFailedAttempts: 5, LockoutDuration);

            user.AccessFailedCount.Should().Be(attempt);
            user.LockoutEndAt.Should().BeNull();
            user.IsLockedOut(Now).Should().BeFalse();
        }
    }

    [Fact]
    public void AtThreshold_LocksForTheConfiguredWindowAndResetsTheCounter()
    {
        var user = CreateUser();
        for (var attempt = 0; attempt < 4; attempt++)
        {
            user.RegisterFailedLogin(Now, maxFailedAttempts: 5, LockoutDuration);
        }

        user.RegisterFailedLogin(Now, maxFailedAttempts: 5, LockoutDuration);

        user.LockoutEndAt.Should().Be(Now.Add(LockoutDuration));
        user.AccessFailedCount.Should().Be(0, "the next window starts from a fresh allowance");
        user.IsLockedOut(Now).Should().BeTrue();
        user.IsLockedOut(Now.Add(LockoutDuration).AddSeconds(-1)).Should().BeTrue();
        user.IsLockedOut(Now.Add(LockoutDuration)).Should().BeFalse();
    }

    [Fact]
    public void ResetFailedLogin_ClearsCounterAndLockout()
    {
        var user = CreateUser();
        user.RegisterFailedLogin(Now, maxFailedAttempts: 1, LockoutDuration);
        user.IsLockedOut(Now).Should().BeTrue();

        user.ResetFailedLogin();

        user.AccessFailedCount.Should().Be(0);
        user.LockoutEndAt.Should().BeNull();
        user.IsLockedOut(Now).Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void RegisterFailedLogin_WithANonPositiveThreshold_Throws(int maxFailedAttempts)
    {
        var user = CreateUser();

        Action act = () => user.RegisterFailedLogin(Now, maxFailedAttempts, LockoutDuration);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void RegisterFailedLogin_WithANonPositiveDuration_Throws(int lockedMinutes)
    {
        var user = CreateUser();

        Action act = () => user.RegisterFailedLogin(Now, maxFailedAttempts: 5, TimeSpan.FromMinutes(lockedMinutes));

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
