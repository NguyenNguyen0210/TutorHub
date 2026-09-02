using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServices;

public class GetMyServicesQueryHandler : IRequestHandler<GetMyServicesQuery, List<ServiceDto>>
{
    private readonly IAppDbContext _context;

    public GetMyServicesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ServiceDto>> Handle(GetMyServicesQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        var query = _context.Services
            .AsNoTracking()
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .Where(s => s.TutorProfileId == tutor.Id);

        if (request.Status.HasValue)
        {
            query = query.Where(s => s.Status == request.Status.Value);
        }

        var services = await query
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return services
            .Select(s => new ServiceDto(
                Id: s.Id,
                TutorProfileId: s.TutorProfileId,
                SubjectId: s.SubjectId,
                SubjectName: s.Subject.Name,
                SubjectCategoryName: s.Subject.Category.Name,
                Title: s.Title,
                Description: s.Description,
                LearningScope: s.LearningScope,
                ExpectedOutcome: s.ExpectedOutcome,
                TotalSessions: s.TotalSessions,
                SessionDurationMinutes: s.SessionDurationMinutes,
                Price: s.Price,
                TeachingMode: s.TeachingMode.ToString(),
                TrialLessonUrl: s.TrialLessonUrl,
                Status: s.Status.ToString(),
                CreatedAt: s.CreatedAt,
                UpdatedAt: s.UpdatedAt
            ))
            .ToList();
    }
}
