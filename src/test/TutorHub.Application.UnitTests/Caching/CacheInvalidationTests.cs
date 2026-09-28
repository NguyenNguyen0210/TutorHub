using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Subjects.UpdateSubject;
using TutorHub.Application.Features.PlatformSettings.EventHandlers;
using TutorHub.Application.Features.Subjects.GetPublicSubjectById;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Infrastructure.Caching;

namespace TutorHub.Application.UnitTests.Caching;

/// <summary>
/// WP5: subjects + platform-setting read-through cache with invalidation.
/// </summary>
public class CacheInvalidationTests
{
    private sealed class FakeDistributedCache : IDistributedCache
    {
        public readonly Dictionary<string, byte[]> Store = new();
        public int SetCount;

        public byte[]? Get(string key) => Store.TryGetValue(key, out var value) ? value : null;

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) =>
            Task.FromResult(Get(key));

        public void Refresh(string key)
        {
        }

        public Task RefreshAsync(string key, CancellationToken token = default) =>
            Task.CompletedTask;

        public void Remove(string key) => Store.Remove(key);

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Store.Remove(key);
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            Store[key] = value;
            SetCount++;
        }

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }
    }

    private static (Mock<IAppDbContext> Context, Category Category, Subject Subject) CreateSubjectContext()
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Math",
            IsActive = true
        };
        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = "Algebra",
            CategoryId = category.Id,
            Category = category,
            IsActive = true
        };

        var contextMock = new Mock<IAppDbContext>();
        contextMock.Setup(c => c.Subjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<Subject> { subject }).Object);
        contextMock.Setup(c => c.Categories).Returns(MockDbSetHelper.CreateMockDbSet(new List<Category> { category }).Object);
        contextMock.Setup(c => c.TutorSubjects).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorSubject>()).Object);
        contextMock.Setup(c => c.Bookings).Returns(MockDbSetHelper.CreateMockDbSet(new List<Booking>()).Object);
        return (contextMock, category, subject);
    }

    [Fact]
    public async Task GetPublicSubjects_SecondCallWithSameFilter_ServedFromCache()
    {
        var (contextMock, _, _) = CreateSubjectContext();
        var cache = new FakeDistributedCache();
        var cacheService = new SubjectCacheService(cache, NullLogger<SubjectCacheService>.Instance);
        var handler = new GetPublicSubjectsQueryHandler(contextMock.Object, cacheService);
        var query = new GetPublicSubjectsQuery(PageNumber: 1, PageSize: 20);

        var first = await handler.Handle(query, CancellationToken.None);
        var second = await handler.Handle(query, CancellationToken.None);

        first.Items.Should().HaveCount(1);
        second.Should().BeEquivalentTo(first);
        cache.SetCount.Should().Be(1);
    }

    [Fact]
    public async Task UpdateSubject_InvalidatesListAndDetailCache()
    {
        var (contextMock, category, subject) = CreateSubjectContext();
        var cache = new FakeDistributedCache();
        var cacheService = new SubjectCacheService(cache, NullLogger<SubjectCacheService>.Instance);
        var listHandler = new GetPublicSubjectsQueryHandler(contextMock.Object, cacheService);
        var detailHandler = new GetPublicSubjectByIdQueryHandler(contextMock.Object, cacheService);

        var query = new GetPublicSubjectsQuery(PageNumber: 1, PageSize: 20);
        await listHandler.Handle(query, CancellationToken.None);
        await detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);
        var setsBeforeUpdate = cache.SetCount;

        var updateHandler = new UpdateSubjectCommandHandler(contextMock.Object, cacheService);
        await updateHandler.Handle(
            new UpdateSubjectCommand(subject.Id, "Geometry", category.Id, IsActive: true),
            CancellationToken.None);

        var listAfter = await listHandler.Handle(query, CancellationToken.None);
        var detailAfter = await detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);

        // Both entries were misses after invalidation, so both re-populated:
        // +1 version-counter bump, +1 list, +1 detail.
        cache.SetCount.Should().Be(setsBeforeUpdate + 3);
        listAfter.Items.Should().ContainSingle(s => s.Name == "Geometry");
        detailAfter.Name.Should().Be("Geometry");
    }

    [Fact]
    public async Task PlatformSettingChangedEvent_ClearsCachedFeeRate()
    {
        var contextMock = new Mock<IAppDbContext>();
        contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(new List<PlatformSetting>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Key = "PlatformFeeRate",
                Value = "0.1000",
                Description = "test",
                CurrentVersion = 1
            }
        }).Object);

        var cache = new FakeDistributedCache();
        var cacheService = new PlatformSettingCacheService(cache, NullLogger<PlatformSettingCacheService>.Instance);
        var dbReads = 0;
        Task<PlatformSettingSnapshot?> Factory(CancellationToken ct)
        {
            dbReads++;
            return Task.FromResult<PlatformSettingSnapshot?>(new PlatformSettingSnapshot("PlatformFeeRate", "0.1000", 1));
        }

        await cacheService.GetSettingAsync("PlatformFeeRate", Factory);
        await cacheService.GetSettingAsync("PlatformFeeRate", Factory);
        dbReads.Should().Be(1);

        var eventHandler = new PlatformSettingChangedEventHandler(cacheService);
        await eventHandler.Handle(
            new PlatformSettingChangedEvent("PlatformFeeRate", "0.1000", "0.1200", 2, Guid.NewGuid()),
            CancellationToken.None);

        await cacheService.GetSettingAsync("PlatformFeeRate", Factory);
        dbReads.Should().Be(2);
    }
}
