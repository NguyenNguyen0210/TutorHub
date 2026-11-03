using FluentAssertions;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.UnitTests.Features.Bookings;

public class SessionMapperPresentationTests
{
    [Fact]
    public void CancellationReason_IsReturnedFromTheSavedCancellation()
    {
        var session = new Session { Id = Guid.NewGuid(), EnrollmentId = Guid.NewGuid(), SessionNumber = 1 };
        SessionMapper.ToDto(session).CancellationReason.Should().BeNull();
        session.Cancel("Learner and tutor agreed to cancel", DateTime.UtcNow);
        SessionMapper.ToDto(session).CancellationReason.Should().Be("Learner and tutor agreed to cancel");
    }
}
