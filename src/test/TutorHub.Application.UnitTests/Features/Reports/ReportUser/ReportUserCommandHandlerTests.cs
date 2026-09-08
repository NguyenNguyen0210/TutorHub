using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Reports.ReportUser;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Reports.ReportUser;

public class ReportUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly ReportUserCommandHandler _handler;

    private readonly List<User> _users = new();
    private readonly List<Report> _reports = new();
    private readonly List<OutboxMessage> _outboxMessages = new();

    public ReportUserCommandHandlerTests()
    {
        _contextMock.Setup(c => c.Users).Returns(MockDbSetHelper.CreateMockDbSet(_users).Object);
        _contextMock.Setup(c => c.Reports).Returns(MockDbSetHelper.CreateMockDbSet(_reports).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(_outboxMessages).Object);

        _handler = new ReportUserCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenReporterNotFound_ShouldThrowNotFoundException()
    {
        var command = new ReportUserCommand(Guid.NewGuid(), Guid.NewGuid(), "Inappropriate language");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("User"));
    }

    [Fact]
    public async Task Handle_WhenTargetUserNotFound_ShouldThrowNotFoundException()
    {
        var reporter = new User { Id = Guid.NewGuid(), FullName = "Reporter", Role = UserRole.Student };
        _users.Add(reporter);

        var command = new ReportUserCommand(reporter.Id, Guid.NewGuid(), "Inappropriate language");

        var act = () => _handler.Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<NotFoundException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("User"));
    }

    [Fact]
    public async Task Handle_WhenValidUserReport_ShouldCreateReportAndEmitOutboxEvent()
    {
        var reporter = new User { Id = Guid.NewGuid(), FullName = "Student Reporter", Role = UserRole.Student };
        var targetUser = new User { Id = Guid.NewGuid(), FullName = "Bad Tutor", Role = UserRole.Tutor };
        _users.Add(reporter);
        _users.Add(targetUser);

        var command = new ReportUserCommand(reporter.Id, targetUser.Id, "Soliciting off-platform payment", "https://evidence.com/proof.png");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.ReporterUserId.Should().Be(reporter.Id);
        result.ReportedUserId.Should().Be(targetUser.Id);
        result.ReportType.Should().Be(TrustReportType.UserConduct);
        result.TargetId.Should().Be(targetUser.Id.ToString());
        result.BookingId.Should().BeNull();
        result.Description.Should().Be("Soliciting off-platform payment");
        result.EvidenceUrl.Should().Be("https://evidence.com/proof.png");
        result.Status.Should().Be(ReportStatus.Open);

        _reports.Should().HaveCount(1);
        _outboxMessages.Should().HaveCount(1);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
