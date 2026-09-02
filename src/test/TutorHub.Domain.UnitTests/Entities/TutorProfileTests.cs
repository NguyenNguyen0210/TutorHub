using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TutorProfileTests
{
    [Fact]
    public void TutorProfile_DefaultInitialization_ShouldHaveExpectedDefaults()
    {
        // Arrange & Act
        var profile = new TutorProfile();

        // Assert
        profile.RatingAvg.Should().Be(0);
        profile.TotalReviews.Should().Be(0);
        profile.TutorSubjects.Should().NotBeNull().And.BeEmpty();
        profile.AvailabilitySlots.Should().NotBeNull().And.BeEmpty();
    }
}
