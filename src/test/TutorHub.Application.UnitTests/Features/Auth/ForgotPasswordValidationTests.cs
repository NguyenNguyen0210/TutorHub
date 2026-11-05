using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.ForgotPassword;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Auth;

public class ForgotPasswordValidationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("owner@")]
    [InlineData("@example.com")]
    [InlineData("owner@example")]
    [InlineData("owner@@example.com")]
    [InlineData("owner name@example.com")]
    [InlineData("owner@example..com")]
    [InlineData("owner@-example.com")]
    [InlineData("owner@example/com")]
    public async Task InvalidEmail_IsRejectedByValidator(string? email)
    {
        var result = await new ForgotPasswordCommandValidator().ValidateAsync(new ForgotPasswordCommand(email!));
        Assert.False(result.IsValid);
        Assert.All(result.Errors, failure => Assert.Equal("Email", failure.PropertyName));
    }

    [Theory]
    [InlineData("owner@example.com")]
    [InlineData(" OWNER@EXAMPLE.COM ")]
    [InlineData("owner+reset@mail.example.com")]
    public async Task ValidEmail_IsAcceptedByValidator(string email)
    {
        Assert.True((await new ForgotPasswordCommandValidator().ValidateAsync(new ForgotPasswordCommand(email))).IsValid);
    }

    [Fact]
    public async Task ExcessiveEmailLength_IsRejected()
    {
        var result = await new ForgotPasswordCommandValidator().ValidateAsync(new ForgotPasswordCommand(new string('a', 250) + "@example.com"));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage.Contains("256"));
    }

    [Fact]
    public async Task UnknownEmail_DoesNotCreateOtpOrSendEmail()
    {
        var (handler, store, email) = CreateHandler(new List<User>());
        var error = await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new ForgotPasswordCommand("missing@example.com"), CancellationToken.None));
        Assert.Contains("Email này chưa được đăng ký trên TutorHub.", error.Errors);
        store.VerifyNoOtherCalls();
        email.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(AccountStatus.Suspended)]
    [InlineData(AccountStatus.Banned)]
    public async Task InactiveAccount_DoesNotCreateOtpOrSendEmail(AccountStatus status)
    {
        var (handler, store, email) = CreateHandler(new List<User> { new() { Id = Guid.NewGuid(), Email = "owner@example.com", Status = status } });
        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(new ForgotPasswordCommand("owner@example.com"), CancellationToken.None));
        store.VerifyNoOtherCalls();
        email.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RegisteredEmail_IsNormalizedAndSendsOtpOnlyToAccountOwner()
    {
        var (handler, store, email) = CreateHandler(new List<User> { new() { Id = Guid.NewGuid(), Email = "owner@example.com", FullName = "Owner" } });
        string? issuedCode = null;
        store.Setup(s => s.SetOtpAsync("owner@example.com", It.IsAny<string>(), TimeSpan.FromMinutes(5), It.IsAny<CancellationToken>()))
            .Callback<string, string, TimeSpan, CancellationToken>((_, code, _, _) => issuedCode = code).Returns(Task.CompletedTask);
        Assert.True(await handler.Handle(new ForgotPasswordCommand(" OWNER@EXAMPLE.COM "), CancellationToken.None));
        Assert.Matches(@"^\d{6}$", issuedCode!);
        store.Verify(s => s.SetOtpAsync("owner@example.com", issuedCode!, TimeSpan.FromMinutes(5), It.IsAny<CancellationToken>()), Times.Once);
        email.Verify(s => s.SendEmailAsync("owner@example.com", It.IsAny<string>(), It.Is<string>(body => body.Contains(issuedCode!)), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    private static (ForgotPasswordCommandHandler Handler, Mock<IPasswordResetOtpStore> Store, Mock<IEmailSender> Email) CreateHandler(List<User> users)
    {
        var db = new Mock<IAppDbContext>();
        db.SetupGet(d => d.Users).Returns(MockDbSetHelper.CreateMockDbSet(users).Object);
        var store = new Mock<IPasswordResetOtpStore>();
        var email = new Mock<IEmailSender>();
        return (new ForgotPasswordCommandHandler(db.Object, store.Object, NullLogger<ForgotPasswordCommandHandler>.Instance, email.Object), store, email);
    }
}
