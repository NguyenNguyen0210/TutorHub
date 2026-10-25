using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Settings;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.Common;

/// <summary>
/// The enrollment platform-fee snapshot (DEC-S8-020) must come from the
/// configured PlatformFeeOptions and must NEVER fall back to a guessed rate.
/// </summary>
public class EnrollmentActivationServiceTests
{
    private static readonly DateTime Now = new(2030, 2, 1, 9, 0, 0, DateTimeKind.Utc);

    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly List<Wallet> _wallets = new();

    public EnrollmentActivationServiceTests()
    {
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(_wallets).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage>()).Object);
    }

    private static IOptions<PlatformFeeOptions> CreateOptions(decimal? feeRate) =>
        Options.Create(new PlatformFeeOptions { Rate = feeRate });

    private static Domain.Entities.Booking CreateBooking(decimal totalPrice = 300_000m, int totalSessions = 3) =>
        new BookingBuilder()
            .WithServiceId(Guid.NewGuid())
            .WithSnapshot(totalPrice, totalSessions)
            .Build();

    [Fact]
    public async Task ActivateAsync_WhenPlatformFeeSettingIsMissing_ThrowsInsteadOfGuessing()
    {
        var sut = new EnrollmentActivationService(_contextMock.Object, CreateOptions(null));
        var act = () => sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PlatformFeeRate*missing*");
    }

    [Theory]
    [InlineData(1.5)]      // >= 1 (100%+)
    [InlineData(-0.1)]     // negative
    public async Task ActivateAsync_WhenPlatformFeeValueIsInvalid_Throws(double settingValue)
    {
        var sut = new EnrollmentActivationService(_contextMock.Object, CreateOptions((decimal)settingValue));

        var act = () => sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PlatformFeeRate*invalid*");
    }

    [Fact]
    public async Task ActivateAsync_SnapshotsConfiguredRateExactly_NotTheFormerTenPercentDefault()
    {
        var sut = new EnrollmentActivationService(_contextMock.Object, CreateOptions(0.12m));

        var enrollment = await sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        enrollment.PlatformFeeRate.Should().Be(0.12m);
    }

    [Fact]
    public async Task ActivateAsync_WhenConfiguredRateIsZero_KeepsZero()
    {
        // A legitimate 0% must stay 0% (it is a policy decision, not "unset").
        var sut = new EnrollmentActivationService(_contextMock.Object, CreateOptions(0m));

        var enrollment = await sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        enrollment.PlatformFeeRate.Should().Be(0m);
    }

    [Fact]
    public async Task ActivateAsync_AllocatesSessionsAndEscrowsGrossAmount()
    {
        var sut = new EnrollmentActivationService(_contextMock.Object, CreateOptions(0.12m));

        var booking = CreateBooking(totalPrice: 300_000m, totalSessions: 3);

        var enrollment = await sut.ActivateAsync(booking, Now, CancellationToken.None);

        enrollment.Sessions.Should().HaveCount(3);
        enrollment.Sessions.Sum(s => s.SessionPrice).Should().Be(300_000m);
        _wallets.Should().ContainSingle();
        _wallets[0].PendingBalance.Should().Be(300_000m);
    }
}
