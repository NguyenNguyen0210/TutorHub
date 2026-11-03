using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TutorHub.Api.Exceptions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class GlobalExceptionClassificationTests
{
    [Fact]
    public async Task InfrastructureInvalidOperation_IsServerError_NotUserConflict()
    {
        var context = new DefaultHttpContext(); context.Response.Body = new MemoryStream();
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance,
            Mock.Of<IHostEnvironment>(env => env.EnvironmentName == Environments.Production));
        await handler.TryHandleAsync(context, new InvalidOperationException("Internal conversion failure"), CancellationToken.None);
        context.Response.StatusCode.Should().Be(500);
        Encoding.UTF8.GetString(((MemoryStream)context.Response.Body).ToArray()).Should().NotContain("Internal conversion failure");
    }

    [Fact]
    public async Task DomainStateGuard_RemainsConflict()
    {
        var user = new User { Status = AccountStatus.Banned };
        var exception = Assert.Throws<InvalidOperationException>(() => user.Reactivate());
        var context = new DefaultHttpContext(); context.Response.Body = new MemoryStream();
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance,
            Mock.Of<IHostEnvironment>(env => env.EnvironmentName == Environments.Production));
        await handler.TryHandleAsync(context, exception, CancellationToken.None);
        context.Response.StatusCode.Should().Be(409);
    }
}
