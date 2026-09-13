using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Users.DTOs;

namespace TutorHub.Application.Features.Users.UpdateMyProfile;

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, MyProfileDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateMyProfileCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<MyProfileDto> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        // 1. Normalize FullName
        user.FullName = request.FullName.Trim();

        // 2. Canonical Phone Normalization (empty / whitespace to null, +84 / 84 to 0, strip spaces/dashes/dots)
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            user.Phone = null;
        }
        else
        {
            var cleanPhone = request.Phone.Trim().Replace(" ", "").Replace("-", "").Replace(".", "");
            if (cleanPhone.StartsWith("+84"))
            {
                cleanPhone = "0" + cleanPhone.Substring(3);
            }
            else if (cleanPhone.StartsWith("84") && cleanPhone.Length == 11)
            {
                cleanPhone = "0" + cleanPhone.Substring(2);
            }
            user.Phone = cleanPhone;
        }

        // 3. AvatarUrl Normalization (empty / whitespace to null)
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();

        // Note: Protected fields (Email, Role, PasswordHash, Status, CreatedAt) remain strictly untouched.

        await _context.SaveChangesAsync(cancellationToken);

        return new MyProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.AvatarUrl,
            user.Role,
            user.Status,
            user.CreatedAt
        );
    }
}
