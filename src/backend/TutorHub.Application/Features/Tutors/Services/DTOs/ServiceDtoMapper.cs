using System.Text.Json;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Tutors.Services.DTOs;

/// <summary>
/// Maps <see cref="Service"/> to <see cref="ServiceDto"/>, including TagsJson
/// (de)serialization. Single place so all six ServiceDto producers stay identical.
/// </summary>
public static class ServiceDtoMapper
{
    public static ServiceDto FromService(
        Service s,
        string subjectName,
        string subjectCategoryName,
        int studentCount = 0,
        double? averageRating = null,
        int reviewCount = 0)
    {
        return new ServiceDto(
            Id: s.Id,
            TutorProfileId: s.TutorProfileId,
            SubjectId: s.SubjectId,
            SubjectName: subjectName,
            SubjectCategoryName: subjectCategoryName,
            Title: s.Title,
            Description: s.Description,
            ShortDescription: s.ShortDescription,
            Tags: ParseTags(s.TagsJson),
            LearningScope: s.LearningScope,
            ExpectedOutcome: s.ExpectedOutcome,
            TotalSessions: s.TotalSessions,
            SessionDurationMinutes: s.SessionDurationMinutes,
            Price: s.Price,
            TeachingMode: s.TeachingMode.ToString(),
            TrialLessonUrl: s.TrialLessonUrl,
            CoverImageUrl: s.CoverImageUrl,
            Status: s.Status.ToString(),
            StudentCount: studentCount,
            AverageRating: averageRating,
            ReviewCount: reviewCount,
            CreatedAt: s.CreatedAt,
            UpdatedAt: s.UpdatedAt
        );
    }

    public static List<string> ParseTags(string? tagsJson)
    {
        if (string.IsNullOrWhiteSpace(tagsJson))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(tagsJson) ?? new List<string>();
        }
        catch (JsonException)
        {
            return new List<string>();
        }
    }

    public static string? SerializeTags(string[]? tags)
    {
        if (tags == null || tags.Length == 0)
        {
            return null;
        }

        return JsonSerializer.Serialize(tags);
    }
}
