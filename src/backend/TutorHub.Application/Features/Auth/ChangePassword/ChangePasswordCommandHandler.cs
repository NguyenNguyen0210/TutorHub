using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Auth.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;

    public ChangePasswordCommandHandler(
        IAppDbContext context, IClock clock,
        IPasswordHasher passwordHasher, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);

        // Security best practice: Revoke all active refresh tokens when password changes
        var activeTokens = await _context.RefreshTokens
            .Where(r => r.UserId == user.Id && r.RevokedAt == null && r.ExpiresAt > _clock.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = _clock.UtcNow;
        }

        // Security notification & email delivery
        var now = _clock.UtcNow;
        var securityNotif = new Domain.Entities.Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Cảnh báo bảo mật: Mật khẩu tài khoản đã thay đổi",
            Message = $"Mật khẩu tài khoản TutorHub ({user.Email}) của bạn vừa được thay đổi thành công vào lúc {now:dd/MM/yyyy HH:mm:ss} UTC.",
            Type = "PasswordChanged",
            DeepLink = "/settings",
            IsCritical = true,
            DeduplicationKey = $"security:password-changed:{user.Id}:{now.Ticks}",
            CreatedAt = now
        };
        _context.Notifications?.Add(securityNotif);

        var securityEmail = new Domain.Entities.EmailDelivery
        {
            Id = Guid.NewGuid(),
            NotificationId = securityNotif.Id,
            Notification = securityNotif,
            UserId = user.Id,
            ToEmail = user.Email,
            Subject = "Cảnh báo bảo mật: Mật khẩu tài khoản TutorHub vừa được thay đổi",
            Body = $@"Kính gửi {user.FullName},

Hệ thống ghi nhận mật khẩu tài khoản TutorHub của bạn ({user.Email}) vừa được thay đổi thành công vào lúc:
{now:dd/MM/yyyy HH:mm:ss} UTC.

Để bảo đảm an toàn, toàn bộ các phiên đăng nhập khác của bạn đã được thu hồi tự động.

NẾU BẠN KHÔNG THỰC HIỆN YÊU CẦU NÀY:
Vui lòng liên hệ ngay với Quản trị viên hệ thống TutorHub hoặc gửi email khẩn cấp tới support@tutorhub.vn để khóa tài khoản và bảo vệ số dư ví bảo chứng.

Trân trọng,
Trung tâm An toàn & Bảo mật TutorHub",
            Status = Domain.Enums.EmailDeliveryStatus.Pending,
            CreatedAt = now
        };
        _context.EmailDeliveries?.Add(securityEmail);

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
