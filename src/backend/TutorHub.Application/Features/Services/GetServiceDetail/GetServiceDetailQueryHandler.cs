using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Services.GetServiceDetail;

public class GetServiceDetailQueryHandler : IRequestHandler<GetServiceDetailQuery, ServiceDetailDto>
{
    private readonly IAppDbContext _context;
    private readonly IServiceDetailCacheService _cache;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public GetServiceDetailQueryHandler(IAppDbContext context, IServiceDetailCacheService? cache = null)
    {
        _context = context;
        _cache = cache ?? NoOpServiceDetailCacheService.Instance;
    }

    public async Task<ServiceDetailDto> Handle(GetServiceDetailQuery request, CancellationToken cancellationToken)
    {
        // 1. Try public cache first
        var cached = await _cache.GetServiceDetailAsync(
            request.Id,
            async () =>
            {
                try
                {
                    return await LoadFromDbAsync(request.Id, null, cancellationToken);
                }
                catch (NotFoundException)
                {
                    return null;
                }
            },
            cancellationToken);

        // 2. If cached and caller is NOT the owner -> return cached data immediately
        bool isOwner = cached is not null && request.CurrentUserId.HasValue && cached.Tutor.UserId == request.CurrentUserId.Value;
        if (cached is not null && !isOwner)
        {
            return cached;
        }

        // 3. Fallback to DB (Owner preview for live edits/metrics, or draft services not in public cache)
        return await LoadFromDbAsync(request.Id, request.CurrentUserId, cancellationToken);
    }

    private async Task<ServiceDetailDto> LoadFromDbAsync(Guid serviceId, Guid? currentUserId, CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .AsNoTracking()
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .Include(s => s.TutorProfile)
                .ThenInclude(tp => tp.User)
                    .ThenInclude(u => u.TutorApplications)
            .FirstOrDefaultAsync(s => s.Id == serviceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", serviceId);
        }

        // Visibility check: Published vs Owner Preview / Admin
        bool isOwner = currentUserId.HasValue && service.TutorProfile.UserId == currentUserId.Value;
        if (!isOwner)
        {
            if (service.Status != ServiceStatus.Published)
            {
                throw new NotFoundException("Service", serviceId);
            }

            if (service.TutorProfile.User.Status != AccountStatus.Active)
            {
                throw new NotFoundException("Service", serviceId);
            }

            bool isApproved = service.TutorProfile.User.TutorApplications
                .Any(a => a.Status == TutorApplicationStatus.Approved);
            if (!isApproved)
            {
                throw new NotFoundException("Service", serviceId);
            }
        }

        // Calculate metrics
        var enrolledCount = await _context.Enrollments
            .AsNoTracking()
            .CountAsync(e => e.ServiceId == service.Id, cancellationToken);

        var completedCount = await _context.Enrollments
            .AsNoTracking()
            .CountAsync(e => e.ServiceId == service.Id && e.Status == EnrollmentStatus.Completed, cancellationToken);

        var totalStudentsTaught = await _context.Enrollments
            .AsNoTracking()
            .Where(e => e.TutorProfileId == service.TutorProfileId)
            .Select(e => e.StudentProfileId)
            .Distinct()
            .CountAsync(cancellationToken);

        // Fetch recent reviews for this service (or fallback to tutor's reviews if brand new service)
        var reviewsQuery = _context.Reviews
            .AsNoTracking()
            .Include(r => r.Enrollment)
                .ThenInclude(e => e.StudentProfile)
                    .ThenInclude(sp => sp.User)
            .Where(r => !r.IsRemoved && r.Enrollment.ServiceId == service.Id);

        var recentReviewsList = await reviewsQuery
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .Select(r => new ServiceReviewItemDto(
                r.Id,
                r.Enrollment.StudentProfile.User.FullName,
                r.Enrollment.StudentProfile.User.AvatarUrl,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.TutorReply,
                r.TutorRepliedAt
            ))
            .ToListAsync(cancellationToken);

        // Only reviews belonging to this package contribute to its metrics.
        var ratings = await reviewsQuery.Select(r => r.Rating).ToListAsync(cancellationToken);

        // Stored curriculum
        var curriculum = ParseCurriculum(service);

        // Deserialize or Fallback for TargetAudience & Prerequisites
        var targetAudience = ParseStringList(service.TargetAudienceJson) ?? new List<string>();
        var prerequisites = ParseStringList(service.PrerequisitesJson) ?? new List<string>();

        // Deserialize or Fallback for FAQs
        var faqs = ParseFaqs(service.FaqsJson) ?? new List<FaqItemDto>();

        // Calculate Pricing
        decimal pricePerSession = service.TotalSessions > 0
            ? Math.Round(service.Price / service.TotalSessions, 0)
            : service.Price;

        double satisfactionRate = ratings.Count == 0 ? 0 : Math.Round(100.0 * ratings.Count(r => r >= 4) / ratings.Count, 1);

        var tutorSnapshot = new ServiceTutorSnapshotDto(
            service.TutorProfileId,
            service.TutorProfile.UserId,
            service.TutorProfile.User.FullName,
            service.TutorProfile.User.AvatarUrl,
            service.TutorProfile.Bio,
            service.TutorProfile.Education,
            service.TutorProfile.ExperienceYears,
            service.TutorProfile.RatingAvg,
            service.TutorProfile.TotalReviews,
            totalStudentsTaught,
            service.TutorProfile.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved)
        );

        var subjectSnapshot = new ServiceSubjectDto(
            service.SubjectId,
            service.Subject.Name,
            service.Subject.CategoryId,
            service.Subject.Category.Name
        );

        var metrics = new ServiceMetricsDto(
            enrolledCount,
            completedCount,
            satisfactionRate
        );

        return new ServiceDetailDto(
            service.Id,
            service.Title,
            service.Description,
            service.CoverImageUrl,
            service.TrialLessonUrl,
            service.LearningScope,
            service.ExpectedOutcome,
            targetAudience,
            prerequisites,
            service.TotalSessions,
            service.SessionDurationMinutes,
            service.Price,
            pricePerSession,
            service.Status.ToString(),
            service.CreatedAt,
            subjectSnapshot,
            tutorSnapshot,
            curriculum,
            faqs,
            metrics,
            recentReviewsList,
            ratings.Count == 0 ? 0 : Math.Round((decimal)ratings.Average(), 2),
            ratings.Count,
            Enumerable.Range(1, 5).Select(star => ratings.Count(r => r == star)).ToList()
        );
    }

    private static List<CurriculumItemDto> ParseCurriculum(Domain.Entities.Service service)
    {
        if (!string.IsNullOrWhiteSpace(service.CurriculumJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<CurriculumItemDto>>(service.CurriculumJson, JsonOptions);
                if (parsed != null && parsed.Count > 0)
                {
                    return parsed;
                }
            }
            catch
            {
                // Fallback on json error
            }
        }

        return new List<CurriculumItemDto>();
    }

    private static List<string>? ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static List<FaqItemDto>? ParseFaqs(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<FaqItemDto>>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

}
