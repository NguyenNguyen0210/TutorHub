using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
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
    private readonly ITutorProfileCacheService _cache;

    public GetTutorByIdQueryHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        ITutorProfileCacheService? cache = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _cache = cache ?? NoOpTutorProfileCacheService.Instance;
    }

    public async Task<TutorProfileDto> Handle(GetTutorByIdQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        var isAdmin = _currentUserService.Role == UserRole.Admin;

        if (isAdmin)
        {
            return await LoadFromDbAsync(request.TutorProfileId, isOwner: false, isAdmin: true, cancellationToken);
        }

        // 1. Try public cache first
        var cached = await _cache.GetTutorProfileAsync(
            request.TutorProfileId,
            async () =>
            {
                try
                {
                    return await LoadFromDbAsync(request.TutorProfileId, isOwner: false, isAdmin: false, cancellationToken);
                }
                catch (NotFoundException)
                {
                    return null;
                }
            },
            cancellationToken);

        // 2. If cached and caller is NOT the owner -> return cached immediately
        bool isOwner = cached != null
            ? (currentUserId.HasValue && cached.UserId == currentUserId.Value)
            : (currentUserId.HasValue && await _context.TutorProfiles.AnyAsync(t => t.Id == request.TutorProfileId && t.UserId == currentUserId.Value, cancellationToken));

        if (cached is not null && !isOwner)
        {
            return cached;
        }

        // 3. Fallback to DB (Owner preview for unlisted services / pending profiles, or cache miss)
        return await LoadFromDbAsync(request.TutorProfileId, isOwner, isAdmin: false, cancellationToken);
    }

    private async Task<TutorProfileDto> LoadFromDbAsync(Guid tutorProfileId, bool isOwner, bool isAdmin, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .Include(t => t.Services)
                .ThenInclude(s => s.Subject)
            .FirstOrDefaultAsync(t => t.Id == tutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", tutorProfileId);
        }

        var isApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        var isEligible = isApproved && tutor.User.Status == AccountStatus.Active;

        if (!isEligible && !isOwner && !isAdmin)
        {
            throw new NotFoundException("TutorProfile", tutorProfileId);
        }

        var subjects = tutor.TutorSubjects
            .Where(ts => isOwner || isAdmin || ts.IsActive)
            .Select(ts => TutorSubjectMapper.ToDto(ts))
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
