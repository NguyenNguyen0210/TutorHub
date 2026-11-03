using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Security;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordResetOtpStore _otpStore;

    public ResetPasswordCommandHandler(
        IAppDbContext context,
        IClock clock,
        IPasswordHasher passwordHasher,
        IPasswordResetOtpStore otpStore)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
        _otpStore = otpStore;
    }

    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // 1. Validate & consume reset token in Redis
        var isValidToken = await _otpStore.ValidateAndConsumeResetTokenAsync(normalizedEmail, request.ResetToken, cancellationToken);
        if (!isValidToken)
        {
            throw new BadRequestException("Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại mã OTP từ đầu.");
        }

        // 2. Fetch User
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("Không tìm thấy tài khoản người dùng.");
        }

        // 3. Update password & invalidate old sessions
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.TokenVersion++;

        // Revoke all existing refresh tokens
        var now = _clock.UtcNow;
        var activeTokens = await _context.RefreshTokens
            .Where(r => r.UserId == user.Id && r.RevokedAt == null && r.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = now;
        }

        // 4. Record security notification & email delivery
        var securityNotif = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Cảnh báo bảo mật: Mật khẩu tài khoản đã được đặt lại thành công",
            Message = $"Mật khẩu tài khoản TutorHub ({user.Email}) của bạn vừa được đặt lại qua mã xác thực OTP vào lúc {now:dd/MM/yyyy HH:mm:ss} UTC.",
            Type = "PasswordReset",
            DeepLink = "/settings",
            IsCritical = true,
            DeduplicationKey = $"security:password-reset:{user.Id}:{now.Ticks}",
            CreatedAt = now
        };
        _context.Notifications.Add(securityNotif);

        var securityEmail = new EmailDelivery
        {
            Id = Guid.NewGuid(),
            NotificationId = securityNotif.Id,
            Notification = securityNotif,
            UserId = user.Id,
            ToEmail = user.Email,
            Subject = "Cảnh báo bảo mật: Mật khẩu tài khoản TutorHub vừa được đặt lại thành công",
            Body = $@"Kính gửi {user.FullName},

Hệ thống ghi nhận mật khẩu tài khoản TutorHub của bạn ({user.Email}) vừa được đặt lại thành công qua mã xác thực OTP vào lúc:
{now:dd/MM/yyyy HH:mm:ss} UTC.

Để bảo đảm an toàn, toàn bộ các phiên đăng nhập khác của bạn đã được thu hồi tự động.

NẾU BẠN KHÔNG THỰC HIỆN YÊU CẦU NÀY:
Vui lòng liên hệ ngay với Quản trị viên hệ thống TutorHub hoặc gửi email khẩn cấp tới support@tutorhub.vn để khóa tài khoản và bảo vệ số dư ví bảo chứng.

Trân trọng,
Trung tâm An toàn & Bảo mật TutorHub",
            Status = EmailDeliveryStatus.Pending,
            CreatedAt = now
        };
        _context.EmailDeliveries.Add(securityEmail);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
