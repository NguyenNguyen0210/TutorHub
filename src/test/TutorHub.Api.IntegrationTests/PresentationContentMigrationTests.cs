using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api.IntegrationTests;

public class PresentationContentMigrationTests
{
    [Fact]
    public async Task Migration_MovesQualificationsAndRetainsCustomFaqsAndWalletBalance()
    {
        var settings = new NpgsqlConnectionStringBuilder(IntegrationWebApplicationFactory.IntegrationConnectionString);
        var database = $"tutorhub_integration_cleanup_{Guid.NewGuid():N}"[..52];
        settings.Database = "postgres";
        await using var maintenance = new NpgsqlConnection(settings.ConnectionString);
        await maintenance.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{database}\"", maintenance))
            await create.ExecuteNonQueryAsync();
        try
        {
            settings.Database = database;
            settings.Pooling = false;
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(settings.ConnectionString).Options;
            await using var db = new AppDbContext(options);
            await db.Database.GetService<IMigrator>().MigrateAsync("20261102034726_AddSeededSiteContent");

            // Seeding runs through the CURRENT EF model, which maps columns added
            // after the pinned target above. Create the newest such column just for
            // the seed, then drop it so the forward migration adds it exactly once.
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE \"Services\" ADD COLUMN \"TrialVideoUrl\" character varying(1000);");

            var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(db, 1234567m);
            var (_, _, service) = await SeedHelper.SeedMarketplaceAsync(db, tutor, admin.Id);
            var application = await db.TutorApplications.SingleAsync(a => a.UserId == tutor.UserId);
            application.University = "Đại học Quốc gia";
            application.Major = "Sư phạm & Chuyên ngành liên quan";
            application.Certifications = "Chứng chỉ nghiệp vụ sư phạm & Chứng chỉ chuyên môn";
            var faq = new {
                question = "Tôi có thể đổi lịch học nếu có việc bận đột xuất không?",
                answer = "Hoàn toàn được. Học viên có thể chủ động nhắn tin hoặc yêu cầu đổi lịch với gia sư trước tối thiểu 2 giờ mà không bị trừ buổi học. Gia sư sẽ cùng bạn thống nhất khung giờ học bù phù hợp nhất."
            };
            service.FaqsJson = JsonSerializer.Serialize(new[] { faq, new { question = "Custom course question", answer = "Custom answer" } });
            await db.SaveChangesAsync();
            var legacy = JsonSerializer.Serialize(new {
                isDemo = true,
                credentials = new[] {
                    new { id = "deg-original", title = "Degree", institution = "Original University", major = "Original Major" },
                    new { id = "cert-original", title = "Original Certificate", institution = "", major = "" }
                }
            });
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"TutorProfiles\" SET \"PublicContentJson\"={legacy}::jsonb WHERE \"Id\"={tutor.Id}");
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Services\" DROP COLUMN \"TrialVideoUrl\";");
            await db.Database.MigrateAsync();
            db.ChangeTracker.Clear();
            var migrated = await db.TutorApplications.SingleAsync(a => a.Id == application.Id);
            migrated.University.Should().Be("Original University");
            migrated.Major.Should().Be("Original Major");
            migrated.Certifications.Should().Be("Original Certificate");
            var course = await db.Services.SingleAsync(s => s.Id == service.Id);
            using var faqs = JsonDocument.Parse(course.FaqsJson!);
            faqs.RootElement.GetArrayLength().Should().Be(1);
            faqs.RootElement[0].GetProperty("question").GetString().Should().Be("Custom course question");
            (await db.Wallets.SingleAsync(w => w.UserId == tutor.UserId)).AvailableBalance.Should().Be(1234567m);
            await db.Database.OpenConnectionAsync();
            await using var verify = db.Database.GetDbConnection().CreateCommand();
            verify.CommandText = """
                SELECT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SiteContents')
                   AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='TutorProfiles' AND column_name='PublicContentJson')
                """;
            (await verify.ExecuteScalarAsync()).Should().Be(true);
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{database}\" WITH (FORCE)", maintenance);
            await drop.ExecuteNonQueryAsync();
        }
    }
}
