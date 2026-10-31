using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordResetOtpStore _otpStore;
    private readonly IEmailSender? _emailSender;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        IAppDbContext context,
        IPasswordResetOtpStore otpStore,
        ILogger<ForgotPasswordCommandHandler> logger,
        IEmailSender? emailSender = null)
    {
        _context = context;
        _otpStore = otpStore;
        _logger = logger;
        _emailSender = emailSender;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        // Security best practice: User enumeration prevention
        // Always return success even if user does not exist
        if (user == null || user.Status != Domain.Enums.AccountStatus.Active)
        {
            _logger.LogWarning("[AUTH] Forgot password request for non-existent or inactive user: {Email}", normalizedEmail);
            return true;
        }

        // Generate cryptographically secure 6-digit OTP
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");

        // Save to Redis with 5 minutes TTL
        await _otpStore.SetOtpAsync(normalizedEmail, otp, TimeSpan.FromMinutes(5), cancellationToken);

        // Dev logger for rapid terminal verification
        _logger.LogInformation("[DEV AUTH] >>> Password reset OTP for {Email}: {Otp} (Valid for 5 minutes) <<<", normalizedEmail, otp);

        // Send Email via configured email sender
        if (_emailSender != null)
        {
            var subject = "[TutorHub] Mã xác nhận đặt lại mật khẩu";
            var body = $@"Xin chào {user.FullName},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TutorHub của bạn ({user.Email}).

Mã xác thực OTP của bạn là:
=============================
        {otp}
=============================

Mã này có hiệu lực trong vòng 5 phút và chỉ được sử dụng một lần duy nhất.
Vì lý do bảo mật, TUYỆT ĐỐI KHÔNG chia sẻ mã này với bất kỳ ai, kể cả nhân viên TutorHub.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc đổi mật khẩu ngay nếu nghi ngờ tài khoản bị xâm nhập.

Trân trọng,
Đội ngũ TutorHub
https://tutorhub.vn";

            try
            {
                await _emailSender.SendEmailAsync(
                    user.Email,
                    subject,
                    body,
                    $"otp:reset-password:{user.Id}:{DateTime.UtcNow.Ticks}",
                    cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
            }
        }

        return true;
    }
}
