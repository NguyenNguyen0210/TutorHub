using System.Text.Json;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Tutors.Services.DTOs;

/// <summary>
/// Maps <see cref="Service"/> to <see cref="ServiceDto"/>, including TagsJson
/// (de)serialization. Single place so all six ServiceDto producers stay identical.
/// </summary>
public static class ServiceDtoMapper
{
    // Seed SQL stores these columns with camelCase keys, so reads are
    // case-insensitive and writes use camelCase to stay consistent.
    private static readonly JsonSerializerOptions ReadOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly JsonSerializerOptions WriteOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

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
            UpdatedAt: s.UpdatedAt,
            Curriculum: ParseCurriculum(s.CurriculumJson),
            TargetAudience: ParseStringList(s.TargetAudienceJson),
            Prerequisites: ParseStringList(s.PrerequisitesJson),
            Faqs: ParseFaqs(s.FaqsJson)
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

    public static List<CurriculumItemDto> ParseCurriculum(string? curriculumJson)
    {
        if (string.IsNullOrWhiteSpace(curriculumJson))
        {
            return new List<CurriculumItemDto>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<CurriculumItemDto>>(curriculumJson, ReadOptions)
                ?? new List<CurriculumItemDto>();
        }
        catch (JsonException)
        {
            return new List<CurriculumItemDto>();
        }
    }

    public static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, ReadOptions) ?? new List<string>();
        }
        catch (JsonException)
        {
            return new List<string>();
        }
    }

    public static List<FaqItemDto> ParseFaqs(string? faqsJson)
    {
        if (string.IsNullOrWhiteSpace(faqsJson))
        {
            return new List<FaqItemDto>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<FaqItemDto>>(faqsJson, ReadOptions)
                ?? new List<FaqItemDto>();
        }
        catch (JsonException)
        {
            return new List<FaqItemDto>();
        }
    }

    /// <summary>
    /// Serializes curriculum input, defaulting omitted per-session durations to
    /// <paramref name="defaultDurationMinutes"/> (the service's session length).
    /// Null/empty yields null (column stays NULL).
    /// </summary>
    public static string? SerializeCurriculum(IEnumerable<CurriculumItemInput>? items, int defaultDurationMinutes)
    {
        if (items == null)
        {
            return null;
        }

        var list = items
            .Select(i => new CurriculumItemDto(
                i.SessionIndex,
                i.Title,
                i.Description,
                i.KeyTopics,
                i.DurationMinutes ?? defaultDurationMinutes))
            .ToList();

        return list.Count == 0 ? null : JsonSerializer.Serialize(list, WriteOptions);
    }

    public static string? SerializeStringList(IEnumerable<string>? items)
    {
        if (items == null)
        {
            return null;
        }

        var list = items.ToList();
        return list.Count == 0 ? null : JsonSerializer.Serialize(list, WriteOptions);
    }

    public static string? SerializeFaqs(IEnumerable<FaqInput>? items)
    {
        if (items == null)
        {
            return null;
        }

        var list = items.Select(i => new FaqItemDto(i.Question, i.Answer)).ToList();
        return list.Count == 0 ? null : JsonSerializer.Serialize(list, WriteOptions);
    }
}
