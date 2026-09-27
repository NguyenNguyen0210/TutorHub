using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Auth.GetMe;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, GetMeResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMeQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<GetMeResponseDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .Include(u => u.TutorProfile)
            .Include(u => u.StudentProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var idProfile = user.Role == UserRole.Tutor
            ? user.TutorProfile?.Id
            : user.StudentProfile?.Id;

        return new GetMeResponseDto(
            user.Id,
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.Status.ToString(),
            user.AvatarUrl,
            idProfile
        );
    }
}
