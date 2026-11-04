using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Infrastructure.Authentication;

namespace TutorHub.Api.IntegrationTests;

public class PasswordResetAtomicityTests : IntegrationTestBase
{
    public PasswordResetAtomicityTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task ResetToken_ConcurrentConsumptionHasExactlyOneWinner_AndWrongTokenDoesNotConsume()
    {
        var store = new PasswordResetOtpStore(Factory.Services.GetRequiredService<IConnectionMultiplexer>());
        var email = $"audit-{Guid.NewGuid():N}@test.local";
        await store.SetResetTokenAsync(email, "single-use", TimeSpan.FromMinutes(1));
        Assert.False(await store.ValidateAndConsumeResetTokenAsync(email, "wrong"));
        var outcomes = await Task.WhenAll(Enumerable.Range(0, 20)
            .Select(_ => store.ValidateAndConsumeResetTokenAsync(email, "single-use")));
        Assert.Equal(1, outcomes.Count(x => x));
    }

    [Fact]
    public async Task Otp_ConcurrentAttemptsEnforceLimit_AndValidCodeIsSingleUse()
    {
        var redis = Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var store = new PasswordResetOtpStore(redis);
        var email = $"audit-{Guid.NewGuid():N}@test.local";
        await store.SetOtpAsync(email, "123456", TimeSpan.FromMinutes(1));
        var outcomes = await Task.WhenAll(Enumerable.Range(0, 20)
            .Select(_ => store.VerifyAndConsumeOtpAsync(email, "wrong")));
        Assert.Equal(4, outcomes.Count(x => x == OtpVerificationStatus.InvalidOtp));
        Assert.Equal(1, outcomes.Count(x => x == OtpVerificationStatus.MaxAttemptsExceeded));
        Assert.Equal(OtpVerificationStatus.ExpiredOrNotFound, await store.VerifyAndConsumeOtpAsync(email, "123456"));

        await store.SetOtpAsync(email, "123456", TimeSpan.FromMinutes(1));
        var key = $"auth:otp:forgot-password:{email}";
        var ttlBefore = await redis.GetDatabase().KeyTimeToLiveAsync(key);
        Assert.Equal(OtpVerificationStatus.InvalidOtp, await store.VerifyAndConsumeOtpAsync(email, "wrong"));
        var ttlAfter = await redis.GetDatabase().KeyTimeToLiveAsync(key);
        Assert.True(ttlAfter.HasValue && ttlAfter > TimeSpan.Zero && ttlAfter <= ttlBefore);
        var successes = await Task.WhenAll(Enumerable.Range(0, 20)
            .Select(_ => store.VerifyAndConsumeOtpAsync(email, "123456")));
        Assert.Equal(1, successes.Count(x => x == OtpVerificationStatus.Success));
    }
}
