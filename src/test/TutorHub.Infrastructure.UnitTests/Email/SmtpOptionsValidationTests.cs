using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TutorHub.Infrastructure.Services.Email;

namespace TutorHub.Infrastructure.UnitTests.Email;

public class SmtpOptionsValidationTests
{
    private static SmtpOptions ReadOptions(int port = 465, bool useSsl = true, string? userName = "resend", string? password = "re_unit_test_key")
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Smtp:Host"] = "smtp.resend.com",
            ["Smtp:Port"] = port.ToString(),
            ["Smtp:UseSsl"] = useSsl.ToString(),
            ["Smtp:UserName"] = userName,
            ["Smtp:Password"] = password,
            ["Smtp:FromAddress"] = "no-reply@tutorhub.id.vn"
        }).Build();
        var services = new ServiceCollection();
        services.AddOptions<SmtpOptions>().Bind(configuration.GetSection("Smtp")).ValidateDataAnnotations();
        using var provider = services.BuildServiceProvider();
        return provider.GetRequiredService<IOptions<SmtpOptions>>().Value;
    }

    [Theory]
    [InlineData(465, true)]
    [InlineData(2465, true)]
    [InlineData(25, false)]
    [InlineData(587, false)]
    [InlineData(2587, false)]
    public void ResendSettings_BindAndValidateSupportedEncryptedTransports(int port, bool useSsl)
    {
        var options = ReadOptions(port, useSsl);
        options.UserName.Should().Be("resend");
        options.Password.Should().Be("re_unit_test_key");
        options.FromAddress.Should().Be("no-reply@tutorhub.id.vn");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void ResendSettings_RequireApiKey(string? password)
    {
        Action read = () => ReadOptions(password: password);
        read.Should().Throw<OptionsValidationException>().WithMessage("*Resend API key*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("no-reply@tutorhub.id.vn")]
    public void ResendSettings_RejectMailboxAddressAsSmtpUser(string? userName)
    {
        Action read = () => ReadOptions(userName: userName);
        read.Should().Throw<OptionsValidationException>().WithMessage("*UserName*");
    }

    [Theory]
    [InlineData(465, false)]
    [InlineData(2465, false)]
    [InlineData(587, true)]
    [InlineData(2587, true)]
    [InlineData(25, true)]
    public void ResendSettings_RejectMismatchedTlsMode(int port, bool useSsl)
    {
        Action read = () => ReadOptions(port, useSsl);
        read.Should().Throw<OptionsValidationException>().WithMessage("*UseSsl*");
    }

    [Fact]
    public void ResendSettings_RejectUnsupportedPort()
    {
        Action read = () => ReadOptions(port: 2525);
        read.Should().Throw<OptionsValidationException>().WithMessage("*ports*");
    }
}
