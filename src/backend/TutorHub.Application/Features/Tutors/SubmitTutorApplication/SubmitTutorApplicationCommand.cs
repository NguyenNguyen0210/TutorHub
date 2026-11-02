using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.SubmitTutorApplication;

public record SubmitTutorApplicationCommand(
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
    string? DocumentsJson = null,
    List<Guid>? DocumentIds = null
) : IRequest<TutorApplicationDto>;
