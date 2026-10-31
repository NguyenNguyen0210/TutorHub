namespace TutorHub.Application.Common.Interfaces;

public enum OtpVerificationStatus
{
    Success,
    InvalidOtp,
    ExpiredOrNotFound,
    MaxAttemptsExceeded
}

public interface IPasswordResetOtpStore
{
    Task SetOtpAsync(string email, string otp, TimeSpan expiry, CancellationToken cancellationToken = default);

    Task<OtpVerificationStatus> VerifyAndConsumeOtpAsync(string email, string otp, CancellationToken cancellationToken = default);

    Task SetResetTokenAsync(string email, string resetToken, TimeSpan expiry, CancellationToken cancellationToken = default);

    Task<bool> ValidateAndConsumeResetTokenAsync(string email, string resetToken, CancellationToken cancellationToken = default);
}
