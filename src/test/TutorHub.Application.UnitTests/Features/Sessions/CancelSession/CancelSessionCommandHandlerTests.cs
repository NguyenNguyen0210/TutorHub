using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Sessions.CancelSession;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Features.Sessions.CancelSession;

public class CancelSessionCommandHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly StubCurrentUserService _currentUserService = new();
    private readonly IConfiguration _configuration = new ConfigurationBuilder().Build();
    private readonly Mock<IAuditLogService> _auditLogService = new();
    private readonly Mock<IStudentWalletService> _studentWalletService = new();
    private readonly StubClock _clock;
    private readonly DateTime _fixedNow = new(2026, 9, 26, 10, 0, 0, DateTimeKind.Utc);

    public CancelSessionCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(options);
        _clock = new StubClock(_fixedNow);
    }

    public void Dispose() => _context.Dispose();

    private CancelSessionCommandHandler CreateHandler() =>
        new(_context, _clock, _auditLogService.Object, _currentUserService,
            _studentWalletService.Object, _configuration);

    private async Task<(Session session, User studentUser, User tutorUser)> SeedAggregateAsync(
        DateTime? scheduledStart = null)
    {
        var studentUser = new UserBuilder().WithRole(UserRole.Student).Build();
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };

        var tutorUser = new UserBuilder().WithRole(UserRole.Tutor).WithStatus(AccountStatus.Active).Build();
        var tutorProfile = new TutorProfileBuilder().WithUser(tutorUser).Build();

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = Guid.NewGuid(),
            ServiceId = Guid.NewGuid(),
            TotalPrice = 1_000_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online
        };
        enrollment.Activate();

        // EarningAmount = 0 keeps the handler off the finance/wallet path so the
        // InMemory provider never sees the relational FOR UPDATE query.
        var session = new Session
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollment.Id,
            Enrollment = enrollment,
            SessionNumber = 1,
            EarningAmount = 0m
        };
        if (scheduledStart.HasValue)
        {
            session.Schedule(scheduledStart.Value, scheduledStart.Value.AddHours(1));
        }
        enrollment.Sessions.Add(session);

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        return (session, studentUser, tutorUser);
    }

    [Fact]
    public async Task Handle_WhenTutorCancelsScheduledSessionInsideNoticeWindow_ThrowsBadRequestException()
    {
        var start = _fixedNow.AddHours(2);
        var (session, _, tutorUser) = await SeedAggregateAsync(scheduledStart: start);
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new CancelSessionCommand(session.Id, "Change of plans");

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.Which.Errors.Should().Contain(e => e.Contains("24"));
    }

    [Fact]
    public async Task Handle_WhenTutorCancelsUnscheduledSession_SucceedsWithoutNotice()
    {
        var (session, _, tutorUser) = await SeedAggregateAsync();
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new CancelSessionCommand(session.Id, "No longer needed");

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Status.Should().Be(SessionStatus.Cancelled);
    }

    [Fact]
    public async Task Handle_WhenTutorCancelsScheduledSessionBeyondNoticeWindow_Succeeds()
    {
        var start = _fixedNow.AddDays(3);
        var (session, _, tutorUser) = await SeedAggregateAsync(scheduledStart: start);
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new CancelSessionCommand(session.Id, "Travel");

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        result.Status.Should().Be(SessionStatus.Cancelled);
    }

    [Fact]
    public async Task Handle_WhenTutorCancelsAlreadyStartedScheduledSession_StillThrowsConflictException()
    {
        var start = _fixedNow.AddHours(-1);
        var (session, _, tutorUser) = await SeedAggregateAsync(scheduledStart: start);
        _currentUserService.Set(tutorUser.Id, UserRole.Tutor);
        var command = new CancelSessionCommand(session.Id, "Too late");

        var act = () => CreateHandler().Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
