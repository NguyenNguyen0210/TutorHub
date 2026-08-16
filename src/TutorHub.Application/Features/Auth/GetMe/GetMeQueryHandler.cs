using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.GetMe;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, UserDto>
{
    private readonly IAppDbContext _context;

    public GetMeQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.TutorProfile)
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.AvatarUrl,
            user.TutorProfile?.Id,
            user.StudentProfile?.Id
        );
    }
}
