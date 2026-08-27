using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TutorProfileTests
{
    [Fact]
    public void TutorProfile_DefaultInitialization_ShouldHaveExpectedDefaults()
    {
        // Arrange & Act
        var tutor = new TutorProfile();

        // Assert
        tutor.RatingAvg.Should().Be(0);
        tutor.TotalReviews.Should().Be(0);
        tutor.TutorSubjects.Should().NotBeNull().And.BeEmpty();
        tutor.AvailabilitySlots.Should().NotBeNull().And.BeEmpty();
        tutor.Bookings.Should().NotBeNull().And.BeEmpty();
    }
}
