using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetTutorById;

public class GetTutorByIdQueryHandler : IRequestHandler<GetTutorByIdQuery, TutorProfileDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTutorByIdQueryHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TutorProfileDto> Handle(GetTutorByIdQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .Include(t => t.Services)
                .ThenInclude(s => s.Subject)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var isOwner = _currentUserService.UserId.HasValue && _currentUserService.UserId.Value == tutor.UserId;
        var isAdmin = string.Equals(_currentUserService.Role, "Admin", StringComparison.OrdinalIgnoreCase);

        var isApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        var isEligible = isApproved && tutor.User.Status == AccountStatus.Active;

        if (!isEligible && !isOwner && !isAdmin)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var subjects = tutor.TutorSubjects
            .Where(ts => isOwner || isAdmin || ts.IsActive)
            .Select(ts => new TutorSubjectDto(
                ts.Id,
                ts.SubjectId,
                ts.Subject.Name,
                ts.Subject.CategoryId,
                ts.Subject.Category.Name,
                ts.IsActive
            ))
            .ToList();

        var services = tutor.Services
            .Where(s => isOwner || isAdmin || s.Status == ServiceStatus.Published)
            .Select(s => new ServiceSummaryDto(
                s.Id,
                s.Title,
                s.Subject.Name,
                s.TotalSessions,
                s.SessionDurationMinutes,
                s.Price,
                s.TeachingMode.ToString(),
                !string.IsNullOrWhiteSpace(s.TrialLessonUrl)
            ))
            .ToList();

        return new TutorProfileDto(
            Id: tutor.Id,
            UserId: tutor.UserId,
            FullName: tutor.User.FullName,
            AvatarUrl: tutor.User.AvatarUrl,
            Bio: tutor.Bio,
            Education: tutor.Education,
            ExperienceYears: tutor.ExperienceYears,
            TeachingMode: tutor.TeachingMode.ToString(),
            Address: tutor.Address,
            Latitude: tutor.Latitude,
            Longitude: tutor.Longitude,
            RatingAvg: tutor.RatingAvg,
            TotalReviews: tutor.TotalReviews,
            Subjects: subjects,
            Services: services
        );
    }
}
