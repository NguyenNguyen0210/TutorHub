using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.GetTutorServices;

public class GetTutorServicesQueryHandler : IRequestHandler<GetTutorServicesQuery, List<ServiceSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetTutorServicesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ServiceSummaryDto>> Handle(GetTutorServicesQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var isApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApproved || tutor.User.Status != AccountStatus.Active)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var services = await _context.Services
            .AsNoTracking()
            .Include(s => s.Subject)
            .Where(s => s.TutorProfileId == request.TutorProfileId && s.Status == ServiceStatus.Published)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return services
            .Select(s => new ServiceSummaryDto(
                Id: s.Id,
                Title: s.Title,
                SubjectName: s.Subject.Name,
                TotalSessions: s.TotalSessions,
                SessionDurationMinutes: s.SessionDurationMinutes,
                Price: s.Price,
                TeachingMode: s.TeachingMode.ToString(),
                HasTrialLesson: !string.IsNullOrWhiteSpace(s.TrialLessonUrl)
            ))
            .ToList();
    }
}
