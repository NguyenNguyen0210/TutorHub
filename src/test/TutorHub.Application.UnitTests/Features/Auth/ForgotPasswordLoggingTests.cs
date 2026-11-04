using Microsoft.Extensions.Logging;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.ForgotPassword;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.UnitTests.Features.Auth;

public class ForgotPasswordLoggingTests
{
    [Fact]
    public async Task GeneratedOtpIsSentToOwnerButNeverWrittenToLogState()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "owner@test.local", FullName = "Owner" };
        var db = new Mock<IAppDbContext>();
        db.SetupGet(d => d.Users).Returns(MockDbSetHelper.CreateMockDbSet(new List<User> { user }).Object);
        var store = new Mock<IPasswordResetOtpStore>();
        string? otp = null;
        store.Setup(s => s.SetOtpAsync(user.Email, It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, TimeSpan, CancellationToken>((_, code, _, _) => otp = code).Returns(Task.CompletedTask);
        var sender = new Mock<IEmailSender>();
        var logger = new Mock<ILogger<ForgotPasswordCommandHandler>>();
        var handler = new ForgotPasswordCommandHandler(db.Object, store.Object, logger.Object, sender.Object);
        Assert.True(await handler.Handle(new ForgotPasswordCommand(user.Email), CancellationToken.None));
        Assert.NotNull(otp);
        sender.Verify(s => s.SendEmailAsync(user.Email, It.IsAny<string>(), It.Is<string>(body => body.Contains(otp!)), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.DoesNotContain(logger.Invocations, call => call.Method.Name == "Log" && call.Arguments[2].ToString()!.Contains(otp!));
    }
}
