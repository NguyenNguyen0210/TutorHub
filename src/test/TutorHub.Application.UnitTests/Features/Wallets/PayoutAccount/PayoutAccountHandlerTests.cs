using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wallets.PayoutAccount.GetPayoutAccount;
using TutorHub.Application.Features.Wallets.PayoutAccount.UpdatePayoutAccount;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Domain.UnitTests.Common.Builders;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wallets.PayoutAccount;

public class PayoutAccountHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock = new();

    [Fact]
    public async Task GetPayoutAccount_TutorExists_ReturnsDetails()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            BankName = "Techcombank",
            BankCode = "TCB",
            AccountNumber = "123456",
            AccountHolderName = "LE VAN C"
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        var handler = new GetPayoutAccountQueryHandler(_contextMock.Object);

        // Act
        var result = await handler.Handle(new GetPayoutAccountQuery(user.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.BankName.Should().Be("Techcombank");
        result.BankCode.Should().Be("TCB");
        result.AccountNumber.Should().Be("123456");
        result.AccountHolderName.Should().Be("LE VAN C");
    }

    [Fact]
    public async Task UpdatePayoutAccount_ValidDetails_UpdatesTutorProfile()
    {
        // Arrange
        var user = new UserBuilder().WithRole(UserRole.Tutor).Build();
        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id
        };

        _contextMock.Setup(c => c.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        var handler = new UpdatePayoutAccountCommandHandler(_contextMock.Object);

        var command = new UpdatePayoutAccountCommand(
            UserId: user.Id,
            BankName: "MB Bank",
            BankCode: "MBB",
            AccountNumber: "99998888",
            AccountHolderName: "HOANG VAN D"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        tutor.BankName.Should().Be("MB Bank");
        tutor.BankCode.Should().Be("MBB");
        tutor.AccountNumber.Should().Be("99998888");
        tutor.AccountHolderName.Should().Be("HOANG VAN D");
    }
}
