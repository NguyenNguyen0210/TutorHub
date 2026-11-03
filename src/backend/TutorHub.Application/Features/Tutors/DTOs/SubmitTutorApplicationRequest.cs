namespace TutorHub.Application.Features.Tutors.DTOs;

public record SubmitTutorApplicationRequest(
    string Bio,
    string Education,
    int ExperienceYears,
    string? University = null,
    string? Major = null,
    string? DegreeLevel = null,
    string? Certifications = null,
    string? Subject = null,
    string? SubjectSub = null,
    string? Methodology = null,
    string? Achievements = null,
    List<Guid>? DocumentIds = null
);
