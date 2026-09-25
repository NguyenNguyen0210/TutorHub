using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.ResubmitTutorApplication;

public record ResubmitTutorApplicationCommand(
    string Bio,
    string Education,
    int ExperienceYears,
    TeachingMode TeachingMode,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null,
    string? University = null,
    string? Major = null,
    string? DegreeLevel = null,
    string? Certifications = null,
    string? Subject = null,
    string? SubjectSub = null,
    string? Methodology = null,
    string? Achievements = null,
    string? DocumentsJson = null
) : IRequest<TutorApplicationDto>;
