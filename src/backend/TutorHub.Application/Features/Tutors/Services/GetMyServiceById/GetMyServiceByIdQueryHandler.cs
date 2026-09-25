using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServiceById;

public class GetMyServiceByIdQueryHandler : IRequestHandler<GetMyServiceByIdQuery, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyServiceByIdQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(GetMyServiceByIdQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var service = await _context.Services
            .AsNoTracking()
            .Include(s => s.TutorProfile)
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        if (service.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to view this service.");
        }

        // Per-service engagement stats (see GetMyServicesQueryHandler for the
        // schema note): distinct enrolled students via Enrollment.ServiceId,
        // visible reviews via Review -> Enrollment.ServiceId.
        var studentCount = await _context.Enrollments
            .AsNoTracking()
            .Where(e => e.ServiceId == service.Id)
            .Select(e => e.StudentProfileId)
            .Distinct()
            .CountAsync(cancellationToken);

        var ratings = await _context.Reviews
            .AsNoTracking()
            .Where(r => !r.IsRemoved && r.Enrollment.ServiceId == service.Id)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name,
            studentCount: studentCount,
            averageRating: ratings.Count > 0 ? ratings.Average() : null,
            reviewCount: ratings.Count
        );
    }
}
