using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Categories.DTOs;

public record PublicCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    List<PublicSubjectDto> Subjects
);
