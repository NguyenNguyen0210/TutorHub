using FluentAssertions;
using TutorHub.Domain.Entities;

namespace TutorHub.Domain.UnitTests.Entities;

public class UserTokenVersionTests
{
    [Fact]
    public void NewUser_ShouldHaveTokenVersionZero()
    {
        var user = new User();

        user.TokenVersion.Should().Be(0);
    }

    [Fact]
    public void BumpTokenVersion_ShouldIncrementByOne()
    {
        var user = new User();

        user.BumpTokenVersion();

        user.TokenVersion.Should().Be(1);

        user.BumpTokenVersion();

        user.TokenVersion.Should().Be(2);
    }
}
