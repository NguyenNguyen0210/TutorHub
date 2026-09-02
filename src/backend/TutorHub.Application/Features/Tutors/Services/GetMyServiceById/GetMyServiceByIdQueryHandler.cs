using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetMyServiceById;

public class GetMyServiceByIdQueryHandler : IRequestHandler<GetMyServiceByIdQuery, ServiceDto>
{
    private readonly IAppDbContext _context;

    public GetMyServiceByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceDto> Handle(GetMyServiceByIdQuery request, CancellationToken cancellationToken)
    {
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

        if (service.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to view this service.");
        }

        return new ServiceDto(
            Id: service.Id,
            TutorProfileId: service.TutorProfileId,
            SubjectId: service.SubjectId,
            SubjectName: service.Subject.Name,
            SubjectCategoryName: service.Subject.Category.Name,
            Title: service.Title,
            Description: service.Description,
            LearningScope: service.LearningScope,
            ExpectedOutcome: service.ExpectedOutcome,
            TotalSessions: service.TotalSessions,
            SessionDurationMinutes: service.SessionDurationMinutes,
            Price: service.Price,
            TeachingMode: service.TeachingMode.ToString(),
            TrialLessonUrl: service.TrialLessonUrl,
            Status: service.Status.ToString(),
            CreatedAt: service.CreatedAt,
            UpdatedAt: service.UpdatedAt
        );
    }
}
