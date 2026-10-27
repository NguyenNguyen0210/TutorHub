using TutorHub.Application.Features.Tutors.Services.DTOs;
using System.Collections.Concurrent;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;

using Microsoft.Extensions.Logging.Abstractions;


using TutorHub.Application.Common.Caching;






using TutorHub.Application.Features.Services.DTOs;

using TutorHub.Application.Features.Services.GetServiceDetail;


using TutorHub.Application.Features.Tutors.DTOs;

using TutorHub.Application.Features.Tutors.GetTutorById;





using TutorHub.Infrastructure.Caching;



namespace TutorHub.Application.UnitTests.Caching;



public class PublicEntitiesCacheTests

{

    private sealed class FakeDistributedCache : IDistributedCache

    {

        public readonly ConcurrentDictionary<string, byte[]> Store = new();

        public int SetCount;



        public byte[]? Get(string key) => Store.TryGetValue(key, out var value) ? value : null;



        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) =>

            Task.FromResult(Get(key));



        public void Refresh(string key) { }

        public Task RefreshAsync(string key, CancellationToken token = default) => Task.CompletedTask;



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



    // ─── 2. ServiceDetailCacheService Tests ─────────────────────────────────────



    [Fact]

    public async Task ServiceDetailCache_SecondCallServedFromCache()

    {

        var cache = new FakeDistributedCache();

        var cacheService = new ServiceDetailCacheService(cache, NullLogger<ServiceDetailCacheService>.Instance);

        var serviceId = Guid.NewGuid();

        var factoryInvoked = 0;



        Task<ServiceDetailDto?> Factory()

        {

            factoryInvoked++;

            return Task.FromResult<ServiceDetailDto?>(CreateSampleServiceDetail(serviceId));

        }



        var first = await cacheService.GetServiceDetailAsync(serviceId, Factory);

        var second = await cacheService.GetServiceDetailAsync(serviceId, Factory);



        first.Should().NotBeNull();

        second.Should().BeEquivalentTo(first);

        factoryInvoked.Should().Be(1);

    }



    [Fact]

    public async Task ServiceDetailCache_Invalidate_DropsEntryAndRequeries()

    {

        var cache = new FakeDistributedCache();

        var cacheService = new ServiceDetailCacheService(cache, NullLogger<ServiceDetailCacheService>.Instance);

        var serviceId = Guid.NewGuid();

        var factoryInvoked = 0;



        Task<ServiceDetailDto?> Factory()

        {

            factoryInvoked++;

            return Task.FromResult<ServiceDetailDto?>(CreateSampleServiceDetail(serviceId));

        }



        await cacheService.GetServiceDetailAsync(serviceId, Factory);

        factoryInvoked.Should().Be(1);



        await cacheService.InvalidateServiceDetailAsync(serviceId);



        await cacheService.GetServiceDetailAsync(serviceId, Factory);

        factoryInvoked.Should().Be(2);

    }



    [Fact]

    public async Task ServiceDetailCache_FailOpen_WhenRedisThrows_FallsBackToFactory()

    {

        var cacheService = new ServiceDetailCacheService(new ThrowingDistributedCache(), NullLogger<ServiceDetailCacheService>.Instance);

        var serviceId = Guid.NewGuid();



        var result = await cacheService.GetServiceDetailAsync(serviceId, () => Task.FromResult<ServiceDetailDto?>(CreateSampleServiceDetail(serviceId)));



        result.Should().NotBeNull();

        result!.Id.Should().Be(serviceId);

    }



    // ─── 3. TutorProfileCacheService Tests ──────────────────────────────────────



    [Fact]

    public async Task TutorProfileCache_SecondCallServedFromCache()

    {

        var cache = new FakeDistributedCache();

        var cacheService = new TutorProfileCacheService(cache, NullLogger<TutorProfileCacheService>.Instance);

        var tutorId = Guid.NewGuid();

        var factoryInvoked = 0;



        Task<TutorProfileDto?> Factory()

        {

            factoryInvoked++;

            return Task.FromResult<TutorProfileDto?>(CreateSampleTutorProfile(tutorId));

        }



        var first = await cacheService.GetTutorProfileAsync(tutorId, Factory);

        var second = await cacheService.GetTutorProfileAsync(tutorId, Factory);



        first.Should().NotBeNull();

        second.Should().BeEquivalentTo(first);

        factoryInvoked.Should().Be(1);

    }



    [Fact]

    public async Task TutorProfileCache_Invalidate_DropsEntryAndRequeries()

    {

        var cache = new FakeDistributedCache();

        var cacheService = new TutorProfileCacheService(cache, NullLogger<TutorProfileCacheService>.Instance);

        var tutorId = Guid.NewGuid();

        var factoryInvoked = 0;



        Task<TutorProfileDto?> Factory()

        {

            factoryInvoked++;

            return Task.FromResult<TutorProfileDto?>(CreateSampleTutorProfile(tutorId));

        }



        await cacheService.GetTutorProfileAsync(tutorId, Factory);

        factoryInvoked.Should().Be(1);



        await cacheService.InvalidateTutorProfileAsync(tutorId);



        await cacheService.GetTutorProfileAsync(tutorId, Factory);

        factoryInvoked.Should().Be(2);

    }



    // ─── Helper Factory Methods ─────────────────────────────────────────────────



    private static ServiceDetailDto CreateSampleServiceDetail(Guid serviceId)

    {

        return new ServiceDetailDto(

            Id: serviceId,

            Title: "Master .NET 8",

            Description: "Clean Architecture course",

            CoverImageUrl: null,

            TrialLessonUrl: null,

            LearningScope: null,

            ExpectedOutcome: null,

            TargetAudience: new List<string>(),

            Prerequisites: new List<string>(),

            TotalSessions: 10,

            SessionDurationMinutes: 90,

            Price: 3000000m,

            PricePerSession: 300000m,

            TeachingMode: "Online",

            Status: "Published",

            CreatedAt: DateTime.UtcNow,

            Subject: new ServiceSubjectDto(Guid.NewGuid(), "Backend", Guid.NewGuid(), "IT"),

            Tutor: new ServiceTutorSnapshotDto(

                Guid.NewGuid(),

                Guid.NewGuid(),

                "Nguyen Van A",

                null,

                "Senior Dev",

                "Computer Science",

                5,

                "Hanoi",

                4.9m,

                20,

                50,

                true

            ),

            Curriculum: new List<CurriculumItemDto>(),

            Faqs: new List<FaqItemDto>(),

            Metrics: new ServiceMetricsDto(10, 5, 98.0),

            RecentReviews: new List<ServiceReviewItemDto>()

        );

    }



    private static TutorProfileDto CreateSampleTutorProfile(Guid tutorProfileId)

    {

        return new TutorProfileDto(

            Id: tutorProfileId,

            UserId: Guid.NewGuid(),

            FullName: "Tran Thi B",

            AvatarUrl: null,

            Bio: "Experienced Tutor",

            Education: "Pedagogy",

            ExperienceYears: 4,

            TeachingMode: "Both",

            Address: "HCMC",

            Latitude: null,

            Longitude: null,

            RatingAvg: 4.8m,

            TotalReviews: 15,

            Subjects: new List<TutorSubjectDto>(),

            Services: new List<ServiceSummaryDto>()

        );

    }

}



