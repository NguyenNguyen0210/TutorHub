using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Auth.DTOs;

namespace TutorHub.Application.Features.Auth.GetMe;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, RegisterResponseDto>
{
    private readonly IAppDbContext _context;

    public GetMeQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<RegisterResponseDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return new RegisterResponseDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString()
        );
    }
}
