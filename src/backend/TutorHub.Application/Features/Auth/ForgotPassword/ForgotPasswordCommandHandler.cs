using TutorHub.Application.Common.Email;
using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Exceptions;

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

        // This flow explicitly confirms registration before moving to OTP entry.
        // Neither missing nor inactive accounts may receive a reset credential.
        if (user == null)
        {
            throw new NotFoundException("Email này chưa được đăng ký trên TutorHub.");
        }

        if (user.Status != Domain.Enums.AccountStatus.Active)
        {
            throw new ForbiddenException("Tài khoản này hiện chưa thể đặt lại mật khẩu. Vui lòng liên hệ hỗ trợ.");
        }

        // Generate cryptographically secure 6-digit OTP
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");

        // Save to Redis with 5 minutes TTL
        await _otpStore.SetOtpAsync(normalizedEmail, otp, TimeSpan.FromMinutes(5), cancellationToken);

        // OTPs are credentials and must never be included in logs.

        // Send Email via configured email sender
        if (_emailSender != null)
        {
            var emailContent = EmailTemplates.PasswordResetCode(user.FullName, otp);
            var subject = emailContent.Subject;
            var body = emailContent.Html;

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
