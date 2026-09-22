using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentTransactions;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyStudentWallet;
using TutorHub.Application.Features.StudentWallets.Queries.GetMyTopUpRequests;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.StudentWallets;

public class StudentWalletHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly StubCurrentUserService _currentUser = new();
    private readonly StubClock _clock = new(new DateTime(2026, 9, 22, 10, 0, 0, DateTimeKind.Utc));

    [Fact]
    public async Task GetMyStudentWallet_ReturnsZeroBalance_WhenWalletDoesNotExistYet()
    {
        var studentUserId = Guid.NewGuid();
        var studentProfile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId
        };

        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.StudentWallets)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWallet>()).Object);

        _currentUser.Set(studentUserId, UserRole.Student);

        var handler = new GetMyStudentWalletQueryHandler(_contextMock.Object, _currentUser);
        var result = await handler.Handle(new GetMyStudentWalletQuery(), CancellationToken.None);

        result.Should().NotBeNull();
        result.AvailableBalance.Should().Be(0m);
        result.ReservedBalance.Should().Be(0m);
        result.TotalBalance.Should().Be(0m);
    }

    [Fact]
    public async Task GetMyStudentWallet_ReturnsCurrentBalance_WhenWalletExists()
    {
        var studentUserId = Guid.NewGuid();
        var studentProfile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId
        };
        var wallet = new StudentWallet
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            AvailableBalance = 750_000m,
            ReservedBalance = 200_000m,
            UpdatedAt = _clock.UtcNow
        };

        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.StudentWallets)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWallet> { wallet }).Object);

        _currentUser.Set(studentUserId, UserRole.Student);

        var handler = new GetMyStudentWalletQueryHandler(_contextMock.Object, _currentUser);
        var result = await handler.Handle(new GetMyStudentWalletQuery(), CancellationToken.None);

        result.Should().NotBeNull();
        result.AvailableBalance.Should().Be(750_000m);
        result.ReservedBalance.Should().Be(200_000m);
        result.TotalBalance.Should().Be(950_000m);
    }

    [Fact]
    public async Task GetMyStudentWallet_ThrowsForbiddenException_WhenNotStudent()
    {
        var userId = Guid.NewGuid();
        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile>()).Object);

        _currentUser.Set(userId, UserRole.Tutor);

        var handler = new GetMyStudentWalletQueryHandler(_contextMock.Object, _currentUser);
        var act = () => handler.Handle(new GetMyStudentWalletQuery(), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetMyStudentTransactions_ReturnsEmptyPagedResult_WhenNoWallet()
    {
        var studentUserId = Guid.NewGuid();
        var studentProfile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId
        };

        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.StudentWallets)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWallet>()).Object);

        _currentUser.Set(studentUserId, UserRole.Student);

        var handler = new GetMyStudentTransactionsQueryHandler(_contextMock.Object, _currentUser);
        var result = await handler.Handle(new GetMyStudentTransactionsQuery(1, 20), CancellationToken.None);

        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetMyStudentTransactions_ReturnsPaginatedTransactions_WhenWalletExists()
    {
        var studentUserId = Guid.NewGuid();
        var studentProfile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId
        };
        var wallet = new StudentWallet
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id
        };
        var tx1 = new StudentWalletTransaction
        {
            Id = Guid.NewGuid(),
            StudentWalletId = wallet.Id,
            Type = StudentWalletTransactionType.TopUpCredit,
            Direction = FinancialDirection.Credit,
            Amount = 500_000m,
            BalanceBefore = 0m,
            BalanceAfter = 500_000m,
            ReferenceType = "TopUpRequest",
            CreatedAt = _clock.UtcNow.AddMinutes(-10)
        };
        var tx2 = new StudentWalletTransaction
        {
            Id = Guid.NewGuid(),
            StudentWalletId = wallet.Id,
            Type = StudentWalletTransactionType.CoursePaymentDebit,
            Direction = FinancialDirection.Debit,
            Amount = 200_000m,
            BalanceBefore = 500_000m,
            BalanceAfter = 300_000m,
            ReferenceType = "Booking",
            CreatedAt = _clock.UtcNow
        };

        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.StudentWallets)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWallet> { wallet }).Object);
        _contextMock.Setup(c => c.StudentWalletTransactions)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWalletTransaction> { tx1, tx2 }).Object);

        _currentUser.Set(studentUserId, UserRole.Student);

        var handler = new GetMyStudentTransactionsQueryHandler(_contextMock.Object, _currentUser);
        var result = await handler.Handle(new GetMyStudentTransactionsQuery(1, 20), CancellationToken.None);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(2);
        result.Items.First().Type.Should().Be(StudentWalletTransactionType.CoursePaymentDebit);
    }

    [Fact]
    public async Task GetMyTopUpRequests_ReturnsPagedResult_WhenRequestsExist()
    {
        var studentUserId = Guid.NewGuid();
        var studentProfile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUserId
        };
        var wallet = new StudentWallet
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id
        };
        var topUp = new TopUpRequest
        {
            Id = Guid.NewGuid(),
            StudentWalletId = wallet.Id,
            Amount = 200_000m,
            TransferReference = "TUTORHUB NAP 11223344 AABB",
            Status = TopUpRequestStatus.Pending,
            RequestedAt = _clock.UtcNow
        };

        _contextMock.Setup(c => c.StudentProfiles)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentProfile> { studentProfile }).Object);
        _contextMock.Setup(c => c.StudentWallets)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<StudentWallet> { wallet }).Object);
        _contextMock.Setup(c => c.TopUpRequests)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<TopUpRequest> { topUp }).Object);
        _contextMock.Setup(c => c.PlatformSettings)
            .Returns(MockDbSetHelper.CreateMockDbSet(new List<PlatformSetting>()).Object);

        _currentUser.Set(studentUserId, UserRole.Student);

        var handler = new GetMyTopUpRequestsQueryHandler(_contextMock.Object, _currentUser);
        var result = await handler.Handle(new GetMyTopUpRequestsQuery(1, 20), CancellationToken.None);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.First().TransferReference.Should().Be("TUTORHUB NAP 11223344 AABB");
    }
}
