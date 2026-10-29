namespace TutorHub.Application.Features.Tutors.DTOs;

public record SubmitTutorApplicationRequest(
    string Bio,
    string Education,
    int ExperienceYears
);
