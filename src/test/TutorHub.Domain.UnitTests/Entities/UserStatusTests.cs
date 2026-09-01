using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Entities;

public class UserStatusTests
{
    // ── Default State ──────────────────────────────────────────────────

    [Fact]
    public void NewUser_ShouldHaveActiveStatus()
    {
        var user = new User();
        user.Status.Should().Be(AccountStatus.Active);
    }

    // ── Suspend ────────────────────────────────────────────────────────

    [Fact]
    public void Suspend_FromActive_ShouldSetSuspended()
    {
        var user = new User { Status = AccountStatus.Active };

        user.Suspend();

        user.Status.Should().Be(AccountStatus.Suspended);
    }

    [Fact]
    public void Suspend_FromSuspended_ShouldThrow()
    {
        var user = new User { Status = AccountStatus.Suspended };

        var act = () => user.Suspend();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Active accounts can be suspended*");
    }

    [Fact]
    public void Suspend_FromBanned_ShouldThrow()
    {
        var user = new User { Status = AccountStatus.Banned };

        var act = () => user.Suspend();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Active accounts can be suspended*");
    }

    // ── Reactivate ─────────────────────────────────────────────────────

    [Fact]
    public void Reactivate_FromSuspended_ShouldSetActive()
    {
        var user = new User { Status = AccountStatus.Suspended };

        user.Reactivate();

        user.Status.Should().Be(AccountStatus.Active);
    }

    [Fact]
    public void Reactivate_FromActive_ShouldThrow()
    {
        var user = new User { Status = AccountStatus.Active };

        var act = () => user.Reactivate();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Suspended accounts can be reactivated*");
    }

    [Fact]
    public void Reactivate_FromBanned_ShouldThrow()
    {
        var user = new User { Status = AccountStatus.Banned };

        var act = () => user.Reactivate();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Only Suspended accounts can be reactivated*");
    }

    // ── Ban ────────────────────────────────────────────────────────────

    [Fact]
    public void Ban_FromActive_ShouldSetBanned()
    {
        var user = new User { Status = AccountStatus.Active };

        user.Ban();

        user.Status.Should().Be(AccountStatus.Banned);
    }

    [Fact]
    public void Ban_FromSuspended_ShouldSetBanned()
    {
        var user = new User { Status = AccountStatus.Suspended };

        user.Ban();

        user.Status.Should().Be(AccountStatus.Banned);
    }

    [Fact]
    public void Ban_FromBanned_ShouldThrow()
    {
        var user = new User { Status = AccountStatus.Banned };

        var act = () => user.Ban();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*already banned*");
    }
}
