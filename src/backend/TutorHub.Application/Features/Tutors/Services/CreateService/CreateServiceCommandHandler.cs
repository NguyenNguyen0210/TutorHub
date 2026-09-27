using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.CreateService;

public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public CreateServiceCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        // 1. Verify TutorProfile exists
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        // 2. Verify Approved TutorApplication
        var isApprovedTutor = await _context.TutorApplications
            .AnyAsync(a => a.UserId == userId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApprovedTutor)
        {
            throw new ForbiddenException("Only approved tutors can create services.");
        }

        // 3. Verify Subject is in tutor's active TutorSubjects
        var tutorSubject = await _context.TutorSubjects
            .Include(ts => ts.Subject)
                .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(ts => ts.TutorProfileId == tutor.Id && ts.SubjectId == request.SubjectId && ts.IsActive, cancellationToken);

        if (tutorSubject == null)
        {
            throw new BadRequestException("The selected subject is not registered or active in your teaching subjects list.");
        }

        // 4. Create Service entity in Draft state
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            SubjectId = request.SubjectId,
            Title = request.Title,
            Description = request.Description,
            ShortDescription = request.ShortDescription,
            TagsJson = ServiceDtoMapper.SerializeTags(request.Tags),
            LearningScope = request.LearningScope,
            ExpectedOutcome = request.ExpectedOutcome,
            TotalSessions = request.TotalSessions,
            SessionDurationMinutes = request.SessionDurationMinutes,
            Price = request.Price,
            TeachingMode = request.TeachingMode,
            TrialLessonUrl = request.TrialLessonUrl,
            CoverImageUrl = request.CoverImageUrl,
            CurriculumJson = ServiceDtoMapper.SerializeCurriculum(request.Curriculum, request.SessionDurationMinutes),
            TargetAudienceJson = ServiceDtoMapper.SerializeStringList(request.TargetAudience),
            PrerequisitesJson = ServiceDtoMapper.SerializeStringList(request.Prerequisites),
            FaqsJson = ServiceDtoMapper.SerializeFaqs(request.Faqs),
            Status = ServiceStatus.Draft,
            CreatedAt = _clock.UtcNow
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            tutorSubject.Subject.Name,
            tutorSubject.Subject.Category.Name
        );
    }
}
