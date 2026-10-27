using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using TutorHub.Api.Filters;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

public class IdempotentAttributeTests
{
    private static ActionExecutingContext CreateActionExecutingContext(HttpContext httpContext)
    {
        var actionContext = new ActionContext(
            httpContext,
            new RouteData(),
            new ActionDescriptor(),
            new ModelStateDictionary());

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenNoIdempotencyKeyHeader_ExecutesNextDelegate()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();
        var nextExecuted = false;

        ActionExecutionDelegate next = () =>
        {
            nextExecuted = true;
            return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new object()));
        };

        // Act
        await attribute.OnActionExecutionAsync(context, next);

        // Assert
        nextExecuted.Should().BeTrue();
        context.Result.Should().BeNull();
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenKeyExceeds128Characters_ReturnsBadRequest400()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["Idempotency-Key"] = new string('x', 129);
        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();
        var nextExecuted = false;

        ActionExecutionDelegate next = () =>
        {
            nextExecuted = true;
            return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new object()));
        };

        // Act
        await attribute.OnActionExecutionAsync(context, next);

        // Assert
        nextExecuted.Should().BeFalse();
        var badRequest = context.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        var apiResponse = badRequest.Value.Should().BeAssignableTo<ApiResponse<object>>().Subject;
        apiResponse.Message.Should().Contain("Must be non-empty ASCII up to 128 characters");
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenStoreReturnsInFlight_ReturnsConflict409()
    {
        // Arrange
        var storeMock = new Mock<IIdempotencyStore>();
        storeMock.Setup(s => s.TryAcquireAsync(
                It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdempotencyAcquireResult(
                IdempotencyStatus.InFlight,
                ErrorMessage: "A request with the same Idempotency-Key is currently in progress."));

        var services = new ServiceCollection();
        services.AddSingleton(storeMock.Object);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Headers["Idempotency-Key"] = "KEY-INFLIGHT-TEST";
        httpContext.Request.Path = "/api/v1/bookings";

        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();
        var nextExecuted = false;

        ActionExecutionDelegate next = () =>
        {
            nextExecuted = true;
            return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new object()));
        };

        // Act
        await attribute.OnActionExecutionAsync(context, next);

        // Assert
        nextExecuted.Should().BeFalse();
        var conflict = context.Result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        var apiResponse = conflict.Value.Should().BeAssignableTo<ApiResponse<object>>().Subject;
        apiResponse.Message.Should().Contain("currently in progress");
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenStoreReturnsPayloadMismatch_ReturnsUnprocessableEntity422()
    {
        // Arrange
        var storeMock = new Mock<IIdempotencyStore>();
        storeMock.Setup(s => s.TryAcquireAsync(
                It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdempotencyAcquireResult(
                IdempotencyStatus.PayloadMismatch,
                ErrorMessage: "Idempotency-Key has already been used with a different request payload."));

        var services = new ServiceCollection();
        services.AddSingleton(storeMock.Object);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Headers["Idempotency-Key"] = "KEY-MISMATCH-TEST";
        httpContext.Request.Path = "/api/v1/students/me/wallet/withdrawals";

        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();

        // Act
        await attribute.OnActionExecutionAsync(context, () => Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new object())));

        // Assert
        var objectResult = context.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
        var apiResponse = objectResult.Value.Should().BeAssignableTo<ApiResponse<object>>().Subject;
        apiResponse.Message.Should().Contain("different request payload");
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenStoreReturnsCachedAvailable_ReturnsCachedContentAndReplayHeader()
    {
        // Arrange
        const string key = "KEY-CACHED-TEST";
        const string cachedJson = "{\"success\":true,\"bookingId\":\"test-id\"}";

        var storeMock = new Mock<IIdempotencyStore>();
        storeMock.Setup(s => s.TryAcquireAsync(
                It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdempotencyAcquireResult(
                IdempotencyStatus.CachedAvailable,
                CachedStatusCode: StatusCodes.Status201Created,
                CachedContentType: "application/json; charset=utf-8",
                CachedResponseBody: cachedJson));

        var services = new ServiceCollection();
        services.AddSingleton(storeMock.Object);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Headers["Idempotency-Key"] = key;
        httpContext.Request.Path = "/api/v1/bookings";

        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();
        var nextExecuted = false;

        ActionExecutionDelegate next = () =>
        {
            nextExecuted = true;
            return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new object()));
        };

        // Act
        await attribute.OnActionExecutionAsync(context, next);

        // Assert
        nextExecuted.Should().BeFalse();
        httpContext.Response.Headers["Idempotency-Key"].ToString().Should().Be(key);
        httpContext.Response.Headers["Idempotency-Replay"].ToString().Should().Be("true");

        var contentResult = context.Result.Should().BeOfType<ContentResult>().Subject;
        contentResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        contentResult.ContentType.Should().Be("application/json; charset=utf-8");
        contentResult.Content.Should().Be(cachedJson);
    }

    [Fact]
    public async Task OnActionExecutionAsync_WhenAcquiredAndActionSucceeds_SavesCompletedResult()
    {
        // Arrange
        const string key = "KEY-SUCCESS-TEST";

        var storeMock = new Mock<IIdempotencyStore>();
        storeMock.Setup(s => s.TryAcquireAsync(
                It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdempotencyAcquireResult(IdempotencyStatus.Acquired));

        var services = new ServiceCollection();
        services.AddSingleton(storeMock.Object);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Headers["Idempotency-Key"] = key;
        httpContext.Request.Path = "/api/v1/bookings";

        var context = CreateActionExecutingContext(httpContext);
        var attribute = new IdempotentAttribute();

        ActionExecutionDelegate next = () =>
        {
            var executed = new ActionExecutedContext(context, new List<IFilterMetadata>(), new object())
            {
                Result = new ObjectResult(ApiResponse<string>.SuccessResult("ok", "success"))
                {
                    StatusCode = StatusCodes.Status200OK
                }
            };
            return Task.FromResult(executed);
        };

        // Act
        await attribute.OnActionExecutionAsync(context, next);

        // Assert
        httpContext.Response.Headers["Idempotency-Key"].ToString().Should().Be(key);
        storeMock.Verify(s => s.SaveCompletedAsync(
            key,
            It.IsAny<Guid?>(),
            StatusCodes.Status200OK,
            It.IsAny<string>(),
            It.Is<string>(body => body.Contains("success")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RequestFingerprintHelper_WithSameData_ProducesSameHash()
    {
        // Arrange
        var context1 = new DefaultHttpContext();
        context1.Request.Method = "POST";
        context1.Request.Path = "/api/v1/bookings";
        var body1 = "{\"price\":100000}";
        context1.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body1));

        var context2 = new DefaultHttpContext();
        context2.Request.Method = "POST";
        context2.Request.Path = "/api/v1/bookings";
        var body2 = "{\"price\":100000}";
        context2.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body2));

        var userId = Guid.NewGuid();

        // Act
        var hash1 = await RequestFingerprintHelper.ComputeHashAsync(context1.Request, userId);
        var hash2 = await RequestFingerprintHelper.ComputeHashAsync(context2.Request, userId);

        // Assert
        hash1.Should().NotBeNullOrWhiteSpace();
        hash1.Should().Be(hash2);
    }

    [Fact]
    public async Task RequestFingerprintHelper_WithDifferentBody_ProducesDifferentHash()
    {
        // Arrange
        var context1 = new DefaultHttpContext();
        context1.Request.Method = "POST";
        context1.Request.Path = "/api/v1/bookings";
        context1.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{\"price\":100000}"));

        var context2 = new DefaultHttpContext();
        context2.Request.Method = "POST";
        context2.Request.Path = "/api/v1/bookings";
        context2.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{\"price\":500000}"));

        var userId = Guid.NewGuid();

        // Act
        var hash1 = await RequestFingerprintHelper.ComputeHashAsync(context1.Request, userId);
        var hash2 = await RequestFingerprintHelper.ComputeHashAsync(context2.Request, userId);

        // Assert
        hash1.Should().NotBe(hash2);
    }
}
