namespace TutorHub.Application.Features.Admin.TutorApplications.DTOs;

public record AdminTutorApplicationListItemDto(
    Guid Id,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    string? UserPhone,
    string? UserAvatarUrl,
    string Status,
    DateTime SubmittedAt,
    DateTime? ReviewedAt,
    string? RejectionReason,
    string? Bio = null,
    string? Education = null,
    string? University = null,
    string? Major = null,
    string? DegreeLevel = null,
    string? Certifications = null,
    string? Subject = null,
    string? SubjectSub = null,
    int ExperienceYears = 0,
    string? TeachingMode = null,
    string? Address = null,
    string? Methodology = null,
    string? Achievements = null,
    string? DocumentsJson = null
);
