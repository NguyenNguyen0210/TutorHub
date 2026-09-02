using FluentAssertions;
using TutorHub.Application.Features.Wallets.CreateWithdrawal;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wallets.CreateWithdrawal;

public class CreateWithdrawalCommandValidatorTests
{
    private readonly CreateWithdrawalCommandValidator _validator = new();

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validate_ZeroOrNegativeAmount_Fails(decimal amount)
    {
        // Arrange
        var command = new CreateWithdrawalCommand(
            UserId: Guid.NewGuid(),
            Amount: amount
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateWithdrawalCommand.Amount));
    }

    [Fact]
    public void Validate_PartialDestinationFields_Fails()
    {
        // Arrange (All-or-Nothing Rule: BankName provided, but AccountNumber missing)
        var command = new CreateWithdrawalCommand(
            UserId: Guid.NewGuid(),
            Amount: 100_000m,
            BankName: "VCB",
            AccountNumber: "",
            AccountHolderName: "NGUYEN VAN A"
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateWithdrawalCommand.AccountNumber));
    }

    [Fact]
    public void Validate_ValidCommand_Passes()
    {
        // Arrange
        var command = new CreateWithdrawalCommand(
            UserId: Guid.NewGuid(),
            Amount: 500_000m,
            BankName: "Vietcombank",
            BankCode: "VCB",
            AccountNumber: "0123456789",
            AccountHolderName: "NGUYEN VAN A"
        );

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
