using System.Collections.Concurrent;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Categories.UpdateCategory;
using TutorHub.Application.Features.Admin.Subjects.UpdateSubject;
using TutorHub.Application.Features.Enrollments.Common;
using TutorHub.Application.Features.PlatformSettings.EventHandlers;
using TutorHub.Application.Features.Subjects.GetPublicSubjectById;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.UnitTests.Common.Builders;
using TutorHub.Infrastructure.Caching;

namespace TutorHub.Application.UnitTests.Caching;

/// <summary>
/// WP5: subjects + platform-setting read-through cache with invalidation.
/// </summary>
public class CacheInvalidationTests
{
    private sealed class FakeDistributedCache : IDistributedCache
    {
        public readonly ConcurrentDictionary<string, byte[]> Store = new();
        public int SetCount;

        /// <summary>When true, reads return corrupt bytes instead of stored values.</summary>
        public bool ReturnGarbage { get; set; }

        public byte[]? Get(string key)
        {
            if (ReturnGarbage)
            {
                return new byte[] { 0xFF, 0x00, 0x7B };
            }

            return Store.TryGetValue(key, out var value) ? value : null;
        }

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) =>
            Task.FromResult(Get(key));

        public void Refresh(string key)
        {
        }

        public Task RefreshAsync(string key, CancellationToken token = default) =>
            Task.CompletedTask;

        public void Remove(string key) => Store.TryRemove(key, out _);

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Store.TryRemove(key, out _);
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            Store[key] = value;
            Interlocked.Increment(ref SetCount);
        }

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingDistributedCache : IDistributedCache
    {
        private static Exception Outage() => new InvalidOperationException("redis down");

        public byte[]? Get(string key) => throw Outage();

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) => throw Outage();

        public void Refresh(string key) => throw Outage();

        public Task RefreshAsync(string key, CancellationToken token = default) => throw Outage();

        public void Remove(string key) => throw Outage();

        public Task RemoveAsync(string key, CancellationToken token = default) => throw Outage();

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options) => throw Outage();

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default) => throw Outage();
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
        category.Subjects.Add(subject);

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
    public async Task UpdateCategory_InvalidatesSubjectDetailCache()
    {
        var (contextMock, category, subject) = CreateSubjectContext();
        var cache = new FakeDistributedCache();
        var cacheService = new SubjectCacheService(cache, NullLogger<SubjectCacheService>.Instance);
        var detailHandler = new GetPublicSubjectByIdQueryHandler(contextMock.Object, cacheService);

        var before = await detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);
        before.CategoryName.Should().Be("Math");

        var updateHandler = new UpdateCategoryCommandHandler(contextMock.Object, cacheService);
        await updateHandler.Handle(
            new UpdateCategoryCommand(category.Id, "Physics", IsActive: true),
            CancellationToken.None);

        var after = await detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);
        after.CategoryName.Should().Be("Physics");
    }

    [Fact]
    public async Task UpdateCategory_WhenDeactivated_CachedDetailBecomesNotFound()
    {
        var (contextMock, category, subject) = CreateSubjectContext();
        var cache = new FakeDistributedCache();
        var cacheService = new SubjectCacheService(cache, NullLogger<SubjectCacheService>.Instance);
        var detailHandler = new GetPublicSubjectByIdQueryHandler(contextMock.Object, cacheService);

        await detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);

        var updateHandler = new UpdateCategoryCommandHandler(contextMock.Object, cacheService);
        await updateHandler.Handle(
            new UpdateCategoryCommand(category.Id, "Math", IsActive: false),
            CancellationToken.None);

        var act = () => detailHandler.Handle(new GetPublicSubjectByIdQuery(subject.Id), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CacheOutage_GetPublicSubjects_FallsBackToDatabase()
    {
        var (contextMock, _, _) = CreateSubjectContext();
        var cacheService = new SubjectCacheService(new ThrowingDistributedCache(), NullLogger<SubjectCacheService>.Instance);
        var handler = new GetPublicSubjectsQueryHandler(contextMock.Object, cacheService);

        var result = await handler.Handle(new GetPublicSubjectsQuery(PageNumber: 1, PageSize: 20), CancellationToken.None);

        result.Items.Should().ContainSingle(s => s.Name == "Algebra");
    }

    [Fact]
    public async Task CorruptCacheEntry_GetPublicSubjects_FallsBackToDatabase()
    {
        var (contextMock, _, _) = CreateSubjectContext();
        var cache = new FakeDistributedCache { ReturnGarbage = true };
        var cacheService = new SubjectCacheService(cache, NullLogger<SubjectCacheService>.Instance);
        var handler = new GetPublicSubjectsQueryHandler(contextMock.Object, cacheService);

        var result = await handler.Handle(new GetPublicSubjectsQuery(PageNumber: 1, PageSize: 20), CancellationToken.None);

        result.Items.Should().ContainSingle(s => s.Name == "Algebra");
    }

    [Fact]
    public async Task CacheOutage_EnrollmentActivation_SnapshotsFeeFromDatabase()
    {
        var platformSettings = new List<PlatformSetting>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Key = "PlatformFeeRate",
                Value = "0.1200",
                Description = "test",
                CurrentVersion = 5
            }
        };
        var contextMock = new Mock<IAppDbContext>();
        contextMock.Setup(c => c.PlatformSettings).Returns(MockDbSetHelper.CreateMockDbSet(platformSettings).Object);
        contextMock.Setup(c => c.Wallets).Returns(MockDbSetHelper.CreateMockDbSet(new List<Wallet>()).Object);
        contextMock.Setup(c => c.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        contextMock.Setup(c => c.OutboxMessages).Returns(MockDbSetHelper.CreateMockDbSet(new List<OutboxMessage>()).Object);

        var cacheService = new PlatformSettingCacheService(new ThrowingDistributedCache(), NullLogger<PlatformSettingCacheService>.Instance);
        var sut = new EnrollmentActivationService(contextMock.Object, cacheService);
        var booking = new BookingBuilder()
            .WithServiceId(Guid.NewGuid())
            .WithSnapshot(300_000m, 3)
            .Build();

        var enrollment = await sut.ActivateAsync(
            booking,
            new DateTime(2030, 2, 1, 9, 0, 0, DateTimeKind.Utc),
            CancellationToken.None);

        enrollment.PlatformFeeRate.Should().Be(0.12m);
        enrollment.FeePolicyVersion.Should().Be(5);
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
