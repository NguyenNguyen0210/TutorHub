using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailSender? _emailSender;

    public RegisterCommandHandler(
        IAppDbContext context, IClock clock,
        IPasswordHasher passwordHasher,
        IEmailSender? emailSender = null)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
        _emailSender = emailSender;
    }

    public async Task<RegisterResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException("Email này đã được đăng ký tài khoản. Vui lòng sử dụng email khác hoặc đăng nhập.");
        }

        string? cleanPhone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            cleanPhone = request.Phone.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
            if (cleanPhone.StartsWith("+84"))
            {
                cleanPhone = "0" + cleanPhone.Substring(3);
            }
            else if (cleanPhone.StartsWith("84") && cleanPhone.Length == 11)
            {
                cleanPhone = "0" + cleanPhone.Substring(2);
            }
        }

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = cleanPhone,
            Role = request.Role,
            Status = AccountStatus.Active,
            CreatedAt = _clock.UtcNow
        };

        if (request.Role == UserRole.Student)
        {
            var studentProfileId = Guid.NewGuid();
            var studentProfile = new StudentProfile
            {
                Id = studentProfileId,
                UserId = userId
            };

            user.StudentProfile = studentProfile;
            _context.StudentProfiles.Add(studentProfile);
        }

        _context.Users.Add(user);

        // Dispatched welcome notification + email delivery
        var welcomeNotif = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Chào mừng bạn đến với TutorHub — Đăng ký tài khoản thành công",
            Message = $"Xin chào {user.FullName}! Tài khoản của bạn đã được khởi tạo thành công trên TutorHub với vai trò {user.Role}. Hãy đăng nhập để hoàn tất hồ sơ và trải nghiệm các khóa học chất lượng cao.",
            Type = "Welcome",
            DeepLink = "/auth/login",
            IsCritical = true,
            DeduplicationKey = $"account:welcome:{user.Id}",
            CreatedAt = _clock.UtcNow
        };
        _context.Notifications.Add(welcomeNotif);

        var welcomeEmail = new EmailDelivery
        {
            Id = Guid.NewGuid(),
            NotificationId = welcomeNotif.Id,
            Notification = welcomeNotif,
            UserId = user.Id,
            ToEmail = user.Email,
            Subject = "Chào mừng bạn đến với TutorHub — Đăng ký tài khoản thành công",
            Body = $@"Kính gửi {user.FullName},

Chào mừng bạn đã gia nhập nền tảng học tập trực tuyến TutorHub!

Thông tin tài khoản đã đăng ký:
- Họ và tên: {user.FullName}
- Email định danh: {user.Email}
- Vai trò: {user.Role}
- Thời gian tạo: {_clock.UtcNow:dd/MM/yyyy HH:mm:ss} UTC

Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay tại:
https://tutorhub.vn/login

Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ chăm sóc khách hàng TutorHub.

Trân trọng,
Đội ngũ TutorHub",
            Status = EmailDeliveryStatus.Pending,
            CreatedAt = _clock.UtcNow
        };
        _context.EmailDeliveries.Add(welcomeEmail);

        await _context.SaveChangesAsync(cancellationToken);

        if (_emailSender != null)
        {
            try
            {
                await _emailSender.SendEmailAsync(user.Email, welcomeEmail.Subject, welcomeEmail.Body, $"email:{welcomeEmail.Id}", cancellationToken);
                welcomeEmail.Status = EmailDeliveryStatus.Sent;
                welcomeEmail.SentAt = _clock.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // Non-blocking welcome email delivery
            }
        }

        return new RegisterResponseDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.Status.ToString()
        );
    }
}
