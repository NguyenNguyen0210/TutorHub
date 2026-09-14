using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Enrollments.Common;

/// <summary>
/// P0-A1: the enrollment platform-fee snapshot (DEC-S8-020) must come from the
/// configured PlatformSetting and must NEVER fall back to a guessed rate.
/// </summary>
public class EnrollmentActivationServiceTests
{
    private static readonly DateTime Now = new(2030, 2, 1, 9, 0, 0, DateTimeKind.Utc);

    private readonly Mock<IAppDbContext> _contextMock = new();
    private readonly List<PlatformSetting> _platformSettings = new();
    private readonly List<Wallet> _wallets = new();
    private readonly EnrollmentActivationService _sut;

    public EnrollmentActivationServiceTests()
    {
        _contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(_platformSettings).Object);
        _contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(_wallets).Object);
        _contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        _contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage>()).Object);
        _sut = new EnrollmentActivationService(_contextMock.Object);
    }

    private static Domain.Entities.Booking CreateBooking(decimal totalPrice = 300_000m, int totalSessions = 3) =>
        new BookingBuilder()
            .WithServiceId(Guid.NewGuid())
            .WithSnapshot(totalPrice, totalSessions)
            .Build();

    private void SeedFeeSetting(string value, int version = 2) =>
        _platformSettings.Add(new PlatformSetting
        {
            Id = Guid.NewGuid(),
            Key = "PlatformFeeRate",
            Value = value,
            Description = "test",
            CurrentVersion = version
        });

    [Fact]
    public async Task ActivateAsync_WhenPlatformFeeSettingIsMissing_ThrowsInsteadOfGuessing()
    {
        var act = () => _sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PlatformFeeRate*missing*");
    }

    [Theory]
    [InlineData("not-a-number")]
    [InlineData("")]
    [InlineData("1.5")]      // >= 1 (100%+)
    [InlineData("-0.1")]     // negative
    [InlineData("0,12")]     // comma decimal: only valid under a comma culture, never invariant
    public async Task ActivateAsync_WhenPlatformFeeValueIsInvalid_Throws(string settingValue)
    {
        SeedFeeSetting(settingValue);

        var act = () => _sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PlatformFeeRate*invalid*");
    }

    [Fact]
    public async Task ActivateAsync_SnapshotsConfiguredRateExactly_NotTheFormerTenPercentDefault()
    {
        SeedFeeSetting("0.1200", version: 5);

        var enrollment = await _sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        enrollment.PlatformFeeRate.Should().Be(0.12m);
        enrollment.FeePolicyVersion.Should().Be(5);
    }

    [Fact]
    public async Task ActivateAsync_WhenConfiguredRateIsZero_KeepsZero()
    {
        // A legitimate 0% must stay 0% (it is a policy decision, not "unset").
        SeedFeeSetting("0.0000", version: 3);

        var enrollment = await _sut.ActivateAsync(CreateBooking(), Now, CancellationToken.None);

        enrollment.PlatformFeeRate.Should().Be(0m);
        enrollment.FeePolicyVersion.Should().Be(3);
    }

    [Fact]
    public async Task ActivateAsync_AllocatesSessionsAndEscrowsGrossAmount()
    {
        SeedFeeSetting("0.1200");

        var booking = CreateBooking(totalPrice: 300_000m, totalSessions: 3);

        var enrollment = await _sut.ActivateAsync(booking, Now, CancellationToken.None);

        enrollment.Sessions.Should().HaveCount(3);
        enrollment.Sessions.Sum(s => s.EarningAmount).Should().Be(300_000m);
        _wallets.Should().ContainSingle();
        _wallets[0].PendingBalance.Should().Be(300_000m);
    }
}
