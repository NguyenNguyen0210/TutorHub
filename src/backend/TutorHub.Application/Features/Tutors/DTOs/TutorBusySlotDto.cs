namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorBusySlotDto
{
    public DateTime StartAt { get; init; }
    public DateTime EndAt { get; init; }
}

