using System.Text.Json;
using StackExchange.Redis;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Authentication;

public class PasswordResetOtpStore : IPasswordResetOtpStore
{
    private const int MaxAllowedAttempts = 5;
    private readonly IConnectionMultiplexer? _multiplexer;
    private readonly IDatabase? _database;

    private sealed class OtpRecord
    {
        public string Otp { get; set; } = default!;
        public int Attempts { get; set; }
    }

    public PasswordResetOtpStore(IConnectionMultiplexer? multiplexer = null)
    {
        _multiplexer = multiplexer;
        if (_multiplexer != null && _multiplexer.IsConnected)
        {
            _database = _multiplexer.GetDatabase();
        }
    }

    private static string GetOtpKey(string email) =>
        $"auth:otp:forgot-password:{email.Trim().ToLowerInvariant()}";

    private static string GetResetTokenKey(string email) =>
        $"auth:token:reset-password:{email.Trim().ToLowerInvariant()}";

    public async Task SetOtpAsync(string email, string otp, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        if (_database == null) return;

        var key = GetOtpKey(email);
        var record = new OtpRecord
        {
            Otp = otp.Trim(),
            Attempts = 0
        };

        var json = JsonSerializer.Serialize(record);
        await _database.StringSetAsync(key, json, expiry);
    }

    public async Task<OtpVerificationStatus> VerifyAndConsumeOtpAsync(string email, string otp, CancellationToken cancellationToken = default)
    {
        if (_database == null) return OtpVerificationStatus.ExpiredOrNotFound;

        var key = GetOtpKey(email);
        var value = await _database.StringGetAsync(key);

        if (value.IsNullOrEmpty)
        {
            return OtpVerificationStatus.ExpiredOrNotFound;
        }

        OtpRecord? record;
        try
        {
            record = JsonSerializer.Deserialize<OtpRecord>(value.ToString());
        }
        catch
        {
            await _database.KeyDeleteAsync(key);
            return OtpVerificationStatus.ExpiredOrNotFound;
        }

        if (record == null)
        {
            await _database.KeyDeleteAsync(key);
            return OtpVerificationStatus.ExpiredOrNotFound;
        }

        if (string.Equals(record.Otp, otp.Trim(), StringComparison.Ordinal))
        {
            // Valid OTP -> Delete it to avoid replay
            await _database.KeyDeleteAsync(key);
            return OtpVerificationStatus.Success;
        }

        // Invalid OTP -> increase attempts
        record.Attempts++;
        if (record.Attempts >= MaxAllowedAttempts)
        {
            await _database.KeyDeleteAsync(key);
            return OtpVerificationStatus.MaxAttemptsExceeded;
        }

        // Keep remaining TTL
        var ttl = await _database.KeyTimeToLiveAsync(key);
        if (ttl.HasValue && ttl.Value > TimeSpan.Zero)
        {
            var updatedJson = JsonSerializer.Serialize(record);
            await _database.StringSetAsync(key, updatedJson, ttl.Value);
        }
        else
        {
            await _database.KeyDeleteAsync(key);
            return OtpVerificationStatus.ExpiredOrNotFound;
        }

        return OtpVerificationStatus.InvalidOtp;
    }

    public async Task SetResetTokenAsync(string email, string resetToken, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        if (_database == null) return;

        var key = GetResetTokenKey(email);
        await _database.StringSetAsync(key, resetToken.Trim(), expiry);
    }

    public async Task<bool> ValidateAndConsumeResetTokenAsync(string email, string resetToken, CancellationToken cancellationToken = default)
    {
        if (_database == null) return false;

        var key = GetResetTokenKey(email);
        var storedToken = await _database.StringGetAsync(key);

        if (storedToken.IsNullOrEmpty)
        {
            return false;
        }

        if (string.Equals(storedToken.ToString(), resetToken.Trim(), StringComparison.Ordinal))
        {
            // Consume token so it cannot be used twice
            await _database.KeyDeleteAsync(key);
            return true;
        }

        return false;
    }
}
