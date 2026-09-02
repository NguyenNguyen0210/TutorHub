using FluentAssertions;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class TutorProfilePayoutTests
{
    [Fact]
    public void SetPayoutAccount_ValidDetails_SetsNormalizedValues()
    {
        // Arrange
        var profile = new TutorProfile { Id = Guid.NewGuid() };

        // Act
        profile.SetPayoutAccount(
            bankName: " Vietcombank ",
            accountNumber: " 0123456789 ",
            accountHolderName: " nguyen van a ",
            bankCode: " vcb "
        );

        // Assert
        profile.BankName.Should().Be("Vietcombank");
        profile.AccountNumber.Should().Be("0123456789");
        profile.AccountHolderName.Should().Be("NGUYEN VAN A");
        profile.BankCode.Should().Be("VCB");
    }

    [Theory]
    [InlineData("", "123", "HOLDER")]
    [InlineData("VCB", "", "HOLDER")]
    [InlineData("VCB", "123", "")]
    public void SetPayoutAccount_MissingMandatoryFields_ThrowsArgumentException(string bank, string acc, string name)
    {
        // Arrange
        var profile = new TutorProfile { Id = Guid.NewGuid() };

        // Act
        var act = () => profile.SetPayoutAccount(bank, acc, name);

        // Assert
        act.Should().Throw<ArgumentException>();
    }
}
