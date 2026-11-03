using MediatR;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.VerifyResetOtp;

public class VerifyResetOtpCommandHandler : IRequestHandler<VerifyResetOtpCommand, string>
{
    private readonly IPasswordResetOtpStore _otpStore;

    public VerifyResetOtpCommandHandler(IPasswordResetOtpStore otpStore)
    {
        _otpStore = otpStore;
    }

    public async Task<string> Handle(VerifyResetOtpCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var status = await _otpStore.VerifyAndConsumeOtpAsync(normalizedEmail, request.Otp, cancellationToken);

        switch (status)
        {
            case OtpVerificationStatus.Success:
                // Generate a secure single-use token for the reset step
                var resetToken = Guid.NewGuid().ToString("N");
                // Reset token valid for 10 minutes
                await _otpStore.SetResetTokenAsync(normalizedEmail, resetToken, TimeSpan.FromMinutes(10), cancellationToken);
                return resetToken;

            case OtpVerificationStatus.InvalidOtp:
                throw new BadRequestException("Mã OTP không chính xác. Vui lòng kiểm tra lại.");

            case OtpVerificationStatus.MaxAttemptsExceeded:
                throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Mã đã bị hủy để bảo vệ tài khoản, vui lòng yêu cầu mã mới.");

            case OtpVerificationStatus.ExpiredOrNotFound:
            default:
                throw new BadRequestException("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.");
        }
    }
}
