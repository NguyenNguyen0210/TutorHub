using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.GetMe;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, RegisterResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMeQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<RegisterResponseDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
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
