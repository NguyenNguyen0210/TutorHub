using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServices;

public class GetMyServicesQueryHandler : IRequestHandler<GetMyServicesQuery, List<ServiceDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyServicesQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ServiceDto>> Handle(GetMyServicesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

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

        // Per-service engagement stats. No per-tutor fallback is needed:
        // Enrollment.ServiceId is a required FK to the purchased service, and
        // Review hangs off Enrollment (1:0..1), so both aggregates join
        // directly per service. Removed reviews are excluded. No new tables.
        var serviceIds = services.Select(s => s.Id).ToList();

        var studentCounts = await _context.Enrollments
            .AsNoTracking()
            .Where(e => serviceIds.Contains(e.ServiceId))
            .GroupBy(e => e.ServiceId)
            .Select(g => new { ServiceId = g.Key, Count = g.Select(e => e.StudentProfileId).Distinct().Count() })
            .ToDictionaryAsync(g => g.ServiceId, g => g.Count, cancellationToken);

        var reviewStats = await _context.Reviews
            .AsNoTracking()
            .Where(r => !r.IsRemoved && serviceIds.Contains(r.Enrollment.ServiceId))
            .GroupBy(r => r.Enrollment.ServiceId)
            .Select(g => new { ServiceId = g.Key, Count = g.Count(), Avg = g.Average(r => r.Rating) })
            .ToDictionaryAsync(g => g.ServiceId, cancellationToken);

        return services
            .Select(s => ServiceDtoMapper.FromService(
                s,
                s.Subject.Name,
                s.Subject.Category.Name,
                studentCount: studentCounts.TryGetValue(s.Id, out var sc) ? sc : 0,
                averageRating: reviewStats.TryGetValue(s.Id, out var rs) ? rs.Avg : null,
                reviewCount: reviewStats.TryGetValue(s.Id, out var rs2) ? rs2.Count : 0
            ))
            .ToList();
    }
}
