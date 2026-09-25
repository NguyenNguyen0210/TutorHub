using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class UserUnbanTests
{
    [Fact]
    public void Unban_WhenUserIsBanned_ShouldTransitionToActive()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "banned@example.com",
            FullName = "Banned User",
            Status = AccountStatus.Banned
        };

        user.Unban();

        user.Status.Should().Be(AccountStatus.Active);
    }

    [Theory]
    [InlineData(AccountStatus.Active)]
    [InlineData(AccountStatus.Suspended)]
    public void Unban_WhenUserIsNotBanned_ShouldThrowInvalidOperationException(AccountStatus status)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FullName = "Regular User",
            Status = status
        };

        var act = () => user.Unban();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot unban account with status '{status}'. Only Banned accounts can be unbanned.");
    }
}
