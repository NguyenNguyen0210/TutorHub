using FluentAssertions;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Entities;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Tutors.Services.DTOs;

public class ServiceDtoMapperTests
{
    private static Service EmptyService() => new()
    {
        Id = Guid.NewGuid(),
        TutorProfileId = Guid.NewGuid(),
        SubjectId = Guid.NewGuid(),
        Title = "Title",
        Description = "Desc",
        TotalSessions = 5,
        SessionDurationMinutes = 60,
        Price = 1000000m
    };

    [Fact]
    public void FromService_WhenJsonColumnsAreNull_ShouldReturnEmptyLists()
    {
        var result = ServiceDtoMapper.FromService(EmptyService(), "Algebra", "Mathematics");

        result.Curriculum.Should().BeEmpty();
        result.TargetAudience.Should().BeEmpty();
        result.Prerequisites.Should().BeEmpty();
        result.Faqs.Should().BeEmpty();
    }

    [Fact]
    public void FromService_WhenJsonColumnsAreInvalid_ShouldReturnEmptyListsWithoutThrowing()
    {
        var service = EmptyService();
        service.CurriculumJson = "not-json{{{";
        service.TargetAudienceJson = "not-json{{{";
        service.PrerequisitesJson = "not-json{{{";
        service.FaqsJson = "not-json{{{";

        var act = () => ServiceDtoMapper.FromService(service, "Algebra", "Mathematics");

        act.Should().NotThrow();
        var result = act();
        result.Curriculum.Should().BeEmpty();
        result.TargetAudience.Should().BeEmpty();
        result.Prerequisites.Should().BeEmpty();
        result.Faqs.Should().BeEmpty();
    }

    [Fact]
    public void FromService_WhenSeedStyleCamelCaseJson_ShouldParse()
    {
        var service = EmptyService();
        service.CurriculumJson =
            "[{\"sessionIndex\":1,\"title\":\"Intro\",\"description\":\"Desc.\",\"keyTopics\":[\"A\"],\"durationMinutes\":90}]";
        service.TargetAudienceJson = "[\"Beginners\"]";
        service.PrerequisitesJson = "[\"None\"]";
        service.FaqsJson = "[{\"question\":\"Q?\",\"answer\":\"A.\"}]";

        var result = ServiceDtoMapper.FromService(service, "Algebra", "Mathematics");

        result.Curriculum.Should().HaveCount(1);
        result.Curriculum[0].SessionIndex.Should().Be(1);
        result.Curriculum[0].Title.Should().Be("Intro");
        result.Curriculum[0].DurationMinutes.Should().Be(90);
        result.TargetAudience.Should().BeEquivalentTo("Beginners");
        result.Prerequisites.Should().BeEquivalentTo("None");
        result.Faqs.Should().HaveCount(1);
        result.Faqs[0].Question.Should().Be("Q?");
    }

    [Fact]
    public void SerializeCurriculum_WhenDurationOmitted_ShouldApplyDefault()
    {
        var json = ServiceDtoMapper.SerializeCurriculum(
            new List<CurriculumItemInput> { new(SessionIndex: 1, Title: "Intro") }, 60);

        var parsed = ServiceDtoMapper.ParseCurriculum(json);
        parsed.Should().HaveCount(1);
        parsed[0].DurationMinutes.Should().Be(60);
    }

    [Fact]
    public void Serialize_WhenInputsAreNullOrEmpty_ShouldReturnNull()
    {
        ServiceDtoMapper.SerializeCurriculum(null, 60).Should().BeNull();
        ServiceDtoMapper.SerializeCurriculum(new List<CurriculumItemInput>(), 60).Should().BeNull();
        ServiceDtoMapper.SerializeStringList(null).Should().BeNull();
        ServiceDtoMapper.SerializeStringList(new List<string>()).Should().BeNull();
        ServiceDtoMapper.SerializeFaqs(null).Should().BeNull();
        ServiceDtoMapper.SerializeFaqs(new List<FaqInput>()).Should().BeNull();
    }
}
