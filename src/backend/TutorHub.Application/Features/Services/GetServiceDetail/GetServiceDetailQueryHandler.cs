using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Services.GetServiceDetail;

public class GetServiceDetailQueryHandler : IRequestHandler<GetServiceDetailQuery, ServiceDetailDto>
{
    private readonly IAppDbContext _context;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public GetServiceDetailQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceDetailDto> Handle(GetServiceDetailQuery request, CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .AsNoTracking()
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .Include(s => s.TutorProfile)
                .ThenInclude(tp => tp.User)
                    .ThenInclude(u => u.TutorApplications)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.Id);
        }

        // Visibility check: Published vs Owner Preview / Admin
        bool isOwner = request.CurrentUserId.HasValue && service.TutorProfile.UserId == request.CurrentUserId.Value;
        if (!isOwner)
        {
            if (service.Status != ServiceStatus.Published)
            {
                throw new NotFoundException("Service", request.Id);
            }

            if (service.TutorProfile.User.Status != AccountStatus.Active)
            {
                throw new NotFoundException("Service", request.Id);
            }

            bool isApproved = service.TutorProfile.User.TutorApplications
                .Any(a => a.Status == TutorApplicationStatus.Approved);
            if (!isApproved)
            {
                throw new NotFoundException("Service", request.Id);
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

        // If no reviews specifically for this service, include recent reviews for the tutor
        if (recentReviewsList.Count == 0)
        {
            recentReviewsList = await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Enrollment)
                    .ThenInclude(e => e.StudentProfile)
                        .ThenInclude(sp => sp.User)
                .Where(r => !r.IsRemoved && r.Enrollment.TutorProfileId == service.TutorProfileId)
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
        }

        // Deserialize or Fallback for Curriculum
        var curriculum = ParseCurriculum(service);

        // Deserialize or Fallback for TargetAudience & Prerequisites
        var targetAudience = ParseStringList(service.TargetAudienceJson) ?? GenerateDefaultTargetAudience(service);
        var prerequisites = ParseStringList(service.PrerequisitesJson) ?? GenerateDefaultPrerequisites(service);

        // Deserialize or Fallback for FAQs
        var faqs = ParseFaqs(service.FaqsJson) ?? GenerateDefaultFaqs(service);

        // Calculate Pricing
        decimal pricePerSession = service.TotalSessions > 0
            ? Math.Round(service.Price / service.TotalSessions, 0)
            : service.Price;

        double satisfactionRate = service.TutorProfile.RatingAvg > 0
            ? Math.Round((double)service.TutorProfile.RatingAvg / 5.0 * 100, 1)
            : 100.0;

        var tutorSnapshot = new ServiceTutorSnapshotDto(
            service.TutorProfileId,
            service.TutorProfile.UserId,
            service.TutorProfile.User.FullName,
            service.TutorProfile.User.AvatarUrl,
            service.TutorProfile.Bio,
            service.TutorProfile.Education,
            service.TutorProfile.ExperienceYears,
            service.TutorProfile.Address,
            service.TutorProfile.RatingAvg,
            service.TutorProfile.TotalReviews,
            totalStudentsTaught,
            true
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
            service.TeachingMode.ToString(),
            service.Status.ToString(),
            service.CreatedAt,
            subjectSnapshot,
            tutorSnapshot,
            curriculum,
            faqs,
            metrics,
            recentReviewsList
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

        // Graceful Fallback: Generate structured curriculum sessions from TotalSessions & Scope
        var list = new List<CurriculumItemDto>();
        int count = Math.Max(1, service.TotalSessions);
        int duration = service.SessionDurationMinutes > 0 ? service.SessionDurationMinutes : 90;

        for (int i = 1; i <= count; i++)
        {
            string title;
            string desc;
            List<string> topics;

            if (i == 1)
            {
                title = "Khảo sát năng lực, làm quen và thiết lập lộ trình";
                desc = "Đánh giá trình độ hiện tại, làm rõ mục tiêu học tập và củng cố các khái niệm nền tảng trọng tâm.";
                topics = new List<string> { "Khảo sát đầu vào", "Xây dựng mục tiêu chi tiết", "Ôn tập kiến thức cốt lõi" };
            }
            else if (i == count)
            {
                title = "Tổng kết chuyên đề, kiểm tra đầu ra & hướng dẫn tự học";
                desc = "Luyện đề tổng hợp, đánh giá mức độ tiến bộ so với mục tiêu ban đầu và định hướng tự phát triển.";
                topics = new List<string> { "Đánh giá chuẩn đầu ra", "Chiến thuật làm bài", "Kế hoạch duy trì kiến thức" };
            }
            else
            {
                title = $"Chuyên đề chuyên sâu - Phần {i - 1}: Nâng cao kỹ năng và giải quyết bài toán thực tế";
                desc = $"Tiếp cận phương pháp tư duy bài bản, thực hành áp dụng {service.Subject.Name} và sửa lỗi chi tiết.";
                topics = new List<string> { "Phương pháp bản chất", "Bài tập thực chiến", "Q&A giải đáp thắc mắc trực tiếp" };
            }

            list.Add(new CurriculumItemDto(i, title, desc, topics, duration));
        }

        return list;
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

    private static List<string> GenerateDefaultTargetAudience(Domain.Entities.Service service)
    {
        return new List<string>
        {
            $"Học viên muốn nắm vững kiến thức trọng tâm môn {service.Subject.Name} từ cơ bản đến nâng cao.",
            "Người chuẩn bị cho các kỳ thi chuyển cấp, tốt nghiệp hoặc chứng chỉ chuyên môn cần lộ trình tối ưu thời gian.",
            "Học viên cần gia sư đồng hành 1-kèm-1 để giải đáp bài tập tức thì và khắc phục các lỗ hổng kiến thức."
        };
    }

    private static List<string> GenerateDefaultPrerequisites(Domain.Entities.Service service)
    {
        return new List<string>
        {
            "Tinh thần chủ động học tập và hoàn thành bài tập ôn luyện sau mỗi buổi.",
            service.TeachingMode == TeachingMode.Offline
                ? "Không gian học tập yên tĩnh, tập trung."
                : "Máy tính hoặc máy tính bảng kết nối internet ổn định, trang bị micro và webcam."
        };
    }

    private static List<FaqItemDto> GenerateDefaultFaqs(Domain.Entities.Service service)
    {
        return new List<FaqItemDto>
        {
            new("Học phí có được bảo chứng an toàn không?",
                "Có. Mọi khoản thanh toán trên TutorHub đều được giữ trong hệ thống Escrow (ký quỹ bảo đảm). Gia sư chỉ được giải ngân học phí sau khi buổi học hoàn thành và học viên xác nhận hài lòng."),
            new("Nếu tôi bận việc đột xuất thì có được dời lịch học không?",
                "Có. Bạn có thể gửi yêu cầu dời lịch trực tiếp trên hệ thống trước giờ học tối thiểu 12 tiếng để gia sư sắp xếp khung giờ mới thuận tiện cho cả hai."),
            new("Tôi có thể trao đổi với gia sư trước khi quyết định đặt lịch không?",
                "Hoàn toàn được. Bạn có thể nhấn nút 'Nhắn tin với gia sư' để trao đổi về mục tiêu, định hướng học tập và lịch học phù hợp trước khi tiến hành thanh toán."),
            new("Chính sách hoàn tiền khi không hài lòng như thế nào?",
                "Nếu gia sư không đáp ứng đúng cam kết hoặc dịch vụ có sự cố, bạn có quyền mở khiếu nại (Dispute). TutorHub sẽ can thiệp hỗ trợ đổi gia sư khác hoặc hoàn tiền phần buổi học chưa diễn ra theo quy định.")
        };
    }
}
