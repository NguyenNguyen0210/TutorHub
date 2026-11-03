using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorCredentialDto(
    string Id, string Kind, string Type, string Title, string? Institution,
    string? Major, bool IsApproved, DateTime? ReviewedAt)
{
    // Application content is the submission snapshot, never inferred from biography keywords.
    public static List<TutorCredentialDto> FromApplication(TutorApplication? application)
    {
        if (application is null || application.Status != TutorApplicationStatus.Approved)
            return new();
        var reviewed = application.ReviewedAt.HasValue && application.ReviewedByAdminId.HasValue;
        var items = new List<TutorCredentialDto>();
        if (!string.IsNullOrWhiteSpace(application.Education))
            items.Add(new($"degree-{application.Id}", "degree", application.DegreeLevel ?? "Học vấn",
                application.Education, application.University, application.Major, reviewed, application.ReviewedAt));
        if (!string.IsNullOrWhiteSpace(application.Certifications))
            items.Add(new($"certificate-{application.Id}", "certificate", "Chứng chỉ",
                application.Certifications, null, null, reviewed, application.ReviewedAt));
        return items;
    }
}
