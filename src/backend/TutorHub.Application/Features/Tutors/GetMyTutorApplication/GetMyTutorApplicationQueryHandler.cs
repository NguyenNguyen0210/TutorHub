using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetMyTutorApplication;

public class GetMyTutorApplicationQueryHandler
    : IRequestHandler<GetMyTutorApplicationQuery, TutorApplicationDto?>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyTutorApplicationQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TutorApplicationDto?> Handle(
        GetMyTutorApplicationQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var application = await _context.TutorApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderBy(a =>
                a.Status == TutorApplicationStatus.Approved ? 0 :
                a.Status == TutorApplicationStatus.Pending ? 1 : 2)
            .ThenByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return application == null ? null : TutorApplicationDto.From(application);
    }
}
