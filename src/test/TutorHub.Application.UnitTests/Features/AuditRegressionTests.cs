using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Notifications;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Application.Features.Transactions.GetMyTransactions;
using TutorHub.Application.Features.Tutors.GetTutors;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Features;

public class AuditRegressionTests
{
    [Theory]
    [InlineData("Toán")]
    [InlineData("toan")]
    [InlineData("TOÁN")]
    public async Task SubjectSearch_ExcludesUnrelatedCategoryAndIncidentalTitleMatches(string search)
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Toán và khoa học tự nhiên" };
        var math = new Subject { Id = Guid.NewGuid(), Name = "Toán", Category = category };
        var physics = new Subject { Id = Guid.NewGuid(), Name = "Vật lý", Category = category };
        TutorApplication Approved()
        {
            var application = new TutorApplication();
            application.Approve(Guid.NewGuid());
            return application;
        }
        TutorProfile Tutor(string name, Subject subject) => new()
        {
            Id = Guid.NewGuid(), User = new User
            {
                FullName = name, Status = AccountStatus.Active,
                TutorApplications = new List<TutorApplication> { Approved() }
            },
            TutorSubjects = new List<TutorSubject> { new() { Subject = subject, SubjectId = subject.Id, IsActive = true } },
            Services = new List<Service> { new() { Title = "Hoàn toàn cá nhân hóa", Status = ServiceStatus.Published, Subject = subject, SubjectId = subject.Id, Price = 500000 } }
        };
        var mathTutor = Tutor("Math tutor", math);
        var physicsTutor = Tutor("Physics tutor", physics);
        // An inactive registration must not advertise a subject either.
        physicsTutor.TutorSubjects.Add(new TutorSubject { Subject = math, SubjectId = math.Id, IsActive = false });
        var db = new Mock<IAppDbContext>();
        db.Setup(x => x.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(new List<Review>()).Object);
        db.Setup(x => x.Subjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<Subject> { math, physics }).Object);
        db.Setup(x => x.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { mathTutor, physicsTutor }).Object);
        var result = await new GetTutorsQueryHandler(db.Object).Handle(new GetTutorsQuery(Search: search), default);
        result.TotalCount.Should().Be(1);
        result.Items.Single().FullName.Should().Be("Math tutor");
    }

    [Theory]
    [InlineData(null, true, "StudentWallet", false)]
    [InlineData(null, true, "StudentWallet", true)]
    [InlineData(null, false, null, false)]
    [InlineData("STUDENT_WALLET:booking", false, "StudentWallet", false)]
    [InlineData("VNPAY:reference", false, "VnPay", false)]
    public async Task CoursePayments_ExposeEvidenceBasedSource(string? reference, bool hasWalletDebit, string? expected, bool ownsByUserId)
    {
        var userId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = Guid.NewGuid(), StudentProfileId = Guid.NewGuid(),
            StudentProfile = new StudentProfile { UserId = userId, User = new User { FullName = "Student" } },
            TutorProfile = new TutorProfile { User = new User { FullName = "Tutor" } },
            Subject = new Subject { Name = "Math" }, Service = new Service { Title = "Math" }
        };
        var transaction = new Transaction { Id = Guid.NewGuid(), Booking = booking, BookingId = booking.Id,
            Type = TransactionType.BookingPayment, Status = TransactionStatus.Held, Amount = 3700000,
            PaymentGatewayRef = reference, CreatedAt = DateTime.UtcNow };
        var ledger = new List<WalletTransaction>();
        if (hasWalletDebit) ledger.Add(new WalletTransaction
        {
            Wallet = new Wallet { UserId = ownsByUserId ? userId : Guid.Empty, StudentProfileId = ownsByUserId ? null : booking.StudentProfileId },
            Type = WalletTransactionType.CoursePaymentDebit, ReferenceType = "Booking", ReferenceId = booking.Id,
            Amount = transaction.Amount, CreatedAt = transaction.CreatedAt
        });
        var db = new Mock<IAppDbContext>();
        db.Setup(x => x.Transactions).Returns(MockDbSetHelper.CreateMockDbSet(new List<Transaction> { transaction }).Object);
        db.Setup(x => x.WalletTransactions).Returns(MockDbSetHelper.CreateMockDbSet(ledger).Object);
        db.Setup(x => x.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        var current = new Mock<ICurrentUserService>();
        current.Setup(x => x.UserId).Returns(userId);
        current.Setup(x => x.UserIdOrThrow()).Returns(userId);
        current.Setup(x => x.Role).Returns(UserRole.Student);
        var result = await new GetMyTransactionsQueryHandler(db.Object, current.Object)
            .Handle(new GetMyTransactionsQuery(), default);
        result.Items.Single().PaymentSource.Should().Be(expected);
    }

    [Fact]
    public void EnrollmentDetail_ProvidesUserIdsForBothChatParticipants()
    {
        var enrollment = new Enrollment
        {
            TutorProfile = new TutorProfile { UserId = Guid.NewGuid() },
            StudentProfile = new StudentProfile { UserId = Guid.NewGuid() }
        };
        var dto = EnrollmentMapper.ToDto(enrollment, "Math");
        dto.TutorUserId.Should().Be(enrollment.TutorProfile.UserId);
        dto.StudentUserId.Should().Be(enrollment.StudentProfile.UserId);
    }

    [Fact]
    public void GraceReminderIdentity_UsesSessionAndDeadlineRatherThanDeliveryEventId()
    {
        var session = Guid.NewGuid(); var end = DateTime.UtcNow;
        var first = new GracePeriodStartedEvent(session, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), end);
        var retry = first with { EventId = Guid.NewGuid() };
        NotificationIdentity.ForEvent(first).Should().Be(NotificationIdentity.ForEvent(retry));
        NotificationIdentity.ForEvent(first).Should().NotBe(NotificationIdentity.ForEvent(first with { GracePeriodEndsAt = end.AddDays(1) }));
    }

    [Fact]
    public void GraceFeed_HidesLegacyDuplicatesBeforePagingAndCountingWithoutHidingDistinctEvents()
    {
        var user = Guid.NewGuid(); var now = DateTime.UtcNow;
        Notification Row(string type, int minute, string link = "/sessions/one") => new()
        {
            Id = Guid.NewGuid(), UserId = user, Type = type, CreatedAt = now.AddMinutes(minute),
            DeepLink = link, Message = "Reminder"
        };
        var rows = new List<Notification>
        {
            Row("GracePeriodStarted", 0), Row("GracePeriodStarted", 1),
            Row("GracePeriodClosingSoon", 600), Row("GracePeriodClosingSoon", 600),
            Row("GracePeriodStarted", 0, "/sessions/two"), Row("PaymentSucceeded", 0), Row("PaymentSucceeded", 0)
        };
        var visible = rows.AsQueryable().VisibleToUser(user).ToList();
        visible.Should().HaveCount(5);
        visible.Should().Contain(rows[1]);
        visible.Should().NotContain(rows[0]);
        rows.AsQueryable().VisibleToUser(Guid.NewGuid()).Should().BeEmpty();
        rows.Add(Row("GracePeriodStarted", 1440));
        rows.AsQueryable().VisibleToUser(user).Should().HaveCount(6);
    }

    [Fact]
    public void GraceFeed_DeduplicationTranslatesToPostgresWithoutClientEvaluation()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused").Options);
        var sql = db.Notifications.VisibleToUser(Guid.NewGuid()).Where(n => !n.IsRead).ToQueryString();
        sql.Should().Contain("NOT EXISTS");
    }
}
