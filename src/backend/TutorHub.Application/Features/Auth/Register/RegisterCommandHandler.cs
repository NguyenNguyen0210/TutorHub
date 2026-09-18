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

    public RegisterCommandHandler(
        IAppDbContext context, IClock clock,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _clock = clock;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            throw new ConflictException($"User with email '{request.Email}' already exists.");
        }

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
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

        // Dispatched account verification & welcome notification + email delivery
        var welcomeNotif = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Chào mừng bạn đến với TutorHub — Xác thực tài khoản",
            Message = $"Xin chào {user.FullName}! Tài khoản của bạn đã được khởi tạo thành công trên TutorHub với vai trò {user.Role}. Hãy đăng nhập để hoàn tất hồ sơ và trải nghiệm các khóa học chất lượng cao.",
            Type = "AccountVerification",
            DeepLink = "/auth/login",
            IsCritical = true,
            DeduplicationKey = $"account:welcome:{user.Id}",
            CreatedAt = _clock.UtcNow
        };
        _context.Notifications?.Add(welcomeNotif);

        var welcomeEmail = new EmailDelivery
        {
            Id = Guid.NewGuid(),
            NotificationId = welcomeNotif.Id,
            Notification = welcomeNotif,
            UserId = user.Id,
            ToEmail = user.Email,
            Subject = "Chào mừng bạn đến với TutorHub — Xác thực tài khoản",
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
        _context.EmailDeliveries?.Add(welcomeEmail);

        await _context.SaveChangesAsync(cancellationToken);

        return new RegisterResponseDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString()
        );
    }
}
