using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TutorHub.Api.Configuration;
using Xunit;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// P0-B4: the startup guard must reject template/placeholder secrets that are long
/// enough to satisfy the options classes' length validation, while leaving real
/// values (and absent values) alone.
/// </summary>
public class StartupSecretGuardTests
{
    private static IConfiguration BuildConfig(params (string Key, string? Value)[] values)
    {
        var dict = values.ToDictionary(v => v.Key, v => v.Value);
        return new ConfigurationBuilder().AddInMemoryCollection(dict).Build();
    }

    [Theory]
    [InlineData("super_secret_jwt_key_tutorhub_platform_minimum_32_characters_long_2026!")]
    [InlineData("change_me_generate_with_openssl_rand_base64_48")]
    [InlineData("your_jwt_secret_key_minimum_32_characters_long_here")]
    [InlineData("SOME_PLACEHOLDER_VALUE_THAT_IS_LONG_ENOUGH")]
    public void Validate_WhenJwtSecretIsATemplateValue_Throws(string templateSecret)
    {
        var config = BuildConfig(("Jwt:Secret", templateSecret));

        Action act = () => StartupSecretGuard.ValidateNoPlaceholderSecrets(config);

        act.Should().Throw<InvalidOperationException>().WithMessage("*Jwt:Secret*");
    }

    [Theory]
    [InlineData("VnPay:HashSecret")]
    [InlineData("CloudflareR2:AccessKeyId")]
    [InlineData("CloudflareR2:SecretAccessKey")]
    public void Validate_WhenAnyGuardedSecretIsATemplateValue_Throws(string key)
    {
        var config = BuildConfig((key, "change_me_value"));

        Action act = () => StartupSecretGuard.ValidateNoPlaceholderSecrets(config);

        act.Should().Throw<InvalidOperationException>().WithMessage("*" + key + "*");
    }

    [Fact]
    public void Validate_WhenSecretsLookReal_Passes()
    {
        var config = BuildConfig(
            ("Jwt:Secret", "Zk8xQ2mN7pR4tV1yB6cD9fG3hJ5kL0aS2dF4gH6jK8lM="),
            ("VnPay:HashSecret", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"),
            ("CloudflareR2:AccessKeyId", "AKIA4T7GQ2XJ9LMNPRVZ"),
            ("CloudflareR2:SecretAccessKey", "wJalrXUtnFEMI0K7MDENGbPxRfiCYz"),
            ("ConnectionStrings:DefaultConnection",
                "Host=localhost;Port=5432;Database=tutorhub;Username=tutorhub;Password=123456"));

        Action act = () => StartupSecretGuard.ValidateNoPlaceholderSecrets(config);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_WhenSecretsAreAbsent_Passes()
    {
        // Absence/emptiness is the options classes' concern ([Required] + ValidateOnStart).
        var config = BuildConfig(
            ("Jwt:Secret", ""),
            ("VnPay:HashSecret", null),
            ("ConnectionStrings:DefaultConnection", ""));

        Action act = () => StartupSecretGuard.ValidateNoPlaceholderSecrets(config);

        act.Should().NotThrow();
    }
}
