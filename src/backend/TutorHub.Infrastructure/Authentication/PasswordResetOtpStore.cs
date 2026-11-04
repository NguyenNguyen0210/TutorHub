using System.Text.Json;
using StackExchange.Redis;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Authentication;

public class PasswordResetOtpStore : IPasswordResetOtpStore
{
    private const int MaxAllowedAttempts = 5;
    // Check, consume, and count failed attempts in one Redis operation across all nodes.
    private const string VerifyOtpScript = """
        local value = redis.call('GET', KEYS[1])
        if not value then return 2 end
        local ok, record = pcall(cjson.decode, value)
        if not ok or type(record) ~= 'table' or type(record.Otp) ~= 'string' then
            redis.call('DEL', KEYS[1])
            return 2
        end
        local ttl = redis.call('PTTL', KEYS[1])
        if ttl <= 0 then
            redis.call('DEL', KEYS[1])
            return 2
        end
        if record.Otp == ARGV[1] then
            redis.call('DEL', KEYS[1])
            return 0
        end
        record.Attempts = (tonumber(record.Attempts) or 0) + 1
        if record.Attempts >= tonumber(ARGV[2]) then
            redis.call('DEL', KEYS[1])
            return 3
        end
        redis.call('SET', KEYS[1], cjson.encode(record), 'PX', ttl)
        return 1
        """;

    private const string ConsumeResetTokenScript = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end
        return 0
        """;

    private readonly IDatabase? _database;

    private sealed class OtpRecord
    {
        public string Otp { get; set; } = default!;
        public int Attempts { get; set; }
    }

    public PasswordResetOtpStore(IConnectionMultiplexer? multiplexer = null)
    {
        _database = multiplexer?.GetDatabase();
    }

    private static string GetOtpKey(string email) =>
        $"auth:otp:forgot-password:{email.Trim().ToLowerInvariant()}";

    private static string GetResetTokenKey(string email) =>
        $"auth:token:reset-password:{email.Trim().ToLowerInvariant()}";

    public async Task SetOtpAsync(string email, string otp, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_database == null) return;
        var record = new OtpRecord { Otp = otp.Trim(), Attempts = 0 };
        await _database.StringSetAsync(GetOtpKey(email), JsonSerializer.Serialize(record), expiry);
    }

    public async Task<OtpVerificationStatus> VerifyAndConsumeOtpAsync(string email, string otp, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_database == null) return OtpVerificationStatus.ExpiredOrNotFound;
        var result = await _database.ScriptEvaluateAsync(VerifyOtpScript,
            new RedisKey[] { GetOtpKey(email) }, new RedisValue[] { otp.Trim(), MaxAllowedAttempts });
        return (OtpVerificationStatus)(int)result;
    }

    public async Task SetResetTokenAsync(string email, string resetToken, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_database == null) return;
        await _database.StringSetAsync(GetResetTokenKey(email), resetToken.Trim(), expiry);
    }

    public async Task<bool> ValidateAndConsumeResetTokenAsync(string email, string resetToken, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_database == null) return false;
        var result = await _database.ScriptEvaluateAsync(ConsumeResetTokenScript,
            new RedisKey[] { GetResetTokenKey(email) }, new RedisValue[] { resetToken.Trim() });
        return (int)result == 1;
    }
}
