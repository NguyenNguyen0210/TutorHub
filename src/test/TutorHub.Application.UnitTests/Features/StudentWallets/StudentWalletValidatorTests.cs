using FluentAssertions;
using TutorHub.Application.Features.StudentWallets.Commands.AdminAdjustWallet;
using TutorHub.Application.Features.StudentWallets.Commands.AdminFailWithdrawal;
using TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;
using TutorHub.Application.Features.StudentWallets.Commands.RequestTopUp;
using TutorHub.Application.Features.StudentWallets.Commands.RequestWithdrawal;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.StudentWallets;

public class StudentWalletValidatorTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-1000)]
    [InlineData(5000)]
    public void RequestTopUpValidator_Fails_WhenAmountIsLessThan10000(decimal amount)
    {
        var validator = new RequestTopUpCommandValidator();
        var result = validator.Validate(new RequestTopUpCommand(amount));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Amount");
    }

    [Fact]
    public void RequestTopUpValidator_Passes_WhenAmountIs10000OrMore()
    {
        var validator = new RequestTopUpCommandValidator();
        var result = validator.Validate(new RequestTopUpCommand(10_000m));

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(49_999)]
    [InlineData(-50_000)]
    public void StudentRequestWithdrawalValidator_Fails_WhenAmountIsLessThan50000(decimal amount)
    {
        var validator = new StudentRequestWithdrawalCommandValidator();
        var command = new StudentRequestWithdrawalCommand(
            Amount: amount,
            BankName: "Vietcombank",
            BankCode: "VCB",
            AccountNumber: "1234567890",
            AccountHolderName: "NGUYEN VAN A"
        );
        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Amount");
    }

    [Theory]
    [InlineData("", "1234567890", "NGUYEN VAN A")]
    [InlineData("Vietcombank", "", "NGUYEN VAN A")]
    [InlineData("Vietcombank", "1234567890", "")]
    public void StudentRequestWithdrawalValidator_Fails_WhenBankDetailsMissing(
        string bankName, string accountNumber, string accountHolderName)
    {
        var validator = new StudentRequestWithdrawalCommandValidator();
        var command = new StudentRequestWithdrawalCommand(
            Amount: 100_000m,
            BankName: bankName,
            BankCode: "VCB",
            AccountNumber: accountNumber,
            AccountHolderName: accountHolderName
        );
        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void StudentRequestWithdrawalValidator_Passes_WhenAllFieldsValid()
    {
        var validator = new StudentRequestWithdrawalCommandValidator();
        var command = new StudentRequestWithdrawalCommand(
            Amount: 100_000m,
            BankName: "Vietcombank",
            BankCode: "VCB",
            AccountNumber: "1234567890",
            AccountHolderName: "NGUYEN VAN A"
        );
        var result = validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void AdminRejectTopUpValidator_Fails_WhenReasonEmpty(string reason)
    {
        var validator = new AdminRejectTopUpCommandValidator();
        var result = validator.Validate(new AdminRejectTopUpCommand(Guid.NewGuid(), reason));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void AdminFailWithdrawalValidator_Fails_WhenReasonEmpty(string reason)
    {
        var validator = new AdminFailStudentWithdrawalCommandValidator();
        var result = validator.Validate(new AdminFailStudentWithdrawalCommand(Guid.NewGuid(), reason));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void AdminAdjustStudentWalletValidator_Fails_WhenAmountIsZeroOrNegative()
    {
        var validator = new AdminAdjustStudentWalletCommandValidator();
        var command = new AdminAdjustStudentWalletCommand(
            StudentWalletId: Guid.NewGuid(),
            Amount: 0m,
            Direction: FinancialDirection.Credit,
            Reason: "Correction"
        );
        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Amount");
    }

    [Fact]
    public void AdminAdjustStudentWalletValidator_Fails_WhenReasonEmpty()
    {
        var validator = new AdminAdjustStudentWalletCommandValidator();
        var command = new AdminAdjustStudentWalletCommand(
            StudentWalletId: Guid.NewGuid(),
            Amount: 50_000m,
            Direction: FinancialDirection.Credit,
            Reason: ""
        );
        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
