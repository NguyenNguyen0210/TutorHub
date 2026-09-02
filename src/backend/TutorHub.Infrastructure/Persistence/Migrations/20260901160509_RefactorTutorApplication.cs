using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorTutorApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create TutorApplications table
            migrationBuilder.CreateTable(
                name: "TutorApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Bio = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Education = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ExperienceYears = table.Column<int>(type: "integer", nullable: false),
                    TeachingMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TutorApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TutorApplications_Users_ReviewedByAdminId",
                        column: x => x.ReviewedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TutorApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 2. Data Migration: Copy existing TutorProfiles lifecycle state to TutorApplications
            migrationBuilder.Sql(@"
                INSERT INTO ""TutorApplications"" (
                    ""Id"", ""UserId"", ""Bio"", ""Education"", ""ExperienceYears"",
                    ""TeachingMode"", ""Address"", ""Latitude"", ""Longitude"",
                    ""Status"", ""SubmittedAt"", ""RejectionReason"",
                    ""ReviewedByAdminId"", ""ReviewedAt""
                )
                SELECT
                    gen_random_uuid(),
                    tp.""UserId"",
                    tp.""Bio"",
                    tp.""Education"",
                    tp.""ExperienceYears"",
                    tp.""TeachingMode"",
                    tp.""Address"",
                    tp.""Latitude"",
                    tp.""Longitude"",
                    CASE
                        WHEN tp.""Status"" = 'Verified' THEN 'Approved'
                        WHEN tp.""Status"" = 'Suspended' THEN 'Approved'
                        WHEN tp.""Status"" = 'PendingReview' THEN 'Pending'
                        WHEN tp.""Status"" = 'Draft' THEN 'Pending'
                        WHEN tp.""Status"" = 'Rejected' THEN 'Rejected'
                        ELSE 'Pending'
                    END,
                    COALESCE(u.""CreatedAt"", NOW()),
                    tp.""RejectionReason"",
                    tp.""ReviewedByAdminId"",
                    tp.""ReviewedAt""
                FROM ""TutorProfiles"" tp
                JOIN ""Users"" u ON tp.""UserId"" = u.""Id"";
            ");

            // 3. Drop legacy constraints & columns from TutorProfiles
            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Users_ReviewedByAdminId",
                table: "TutorProfiles");

            migrationBuilder.DropIndex(
                name: "IX_TutorProfiles_ReviewedByAdminId",
                table: "TutorProfiles");

            migrationBuilder.DropIndex(
                name: "IX_TutorProfiles_Status",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "ReviewedByAdminId",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TutorProfiles");

            // 4. Create indexes for TutorApplications
            migrationBuilder.CreateIndex(
                name: "IX_TutorApplications_ReviewedByAdminId",
                table: "TutorApplications",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_TutorApplications_Status",
                table: "TutorApplications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TutorApplications_UserId_Status",
                table: "TutorApplications",
                columns: new[] { "UserId", "Status" });

            // 5. Partial Unique Index: at most ONE Pending application per User
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ""IX_TutorApplications_UserId_Pending""
                ON ""TutorApplications"" (""UserId"")
                WHERE ""Status"" = 'Pending';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_TutorApplications_UserId_Pending"";");

            migrationBuilder.DropTable(
                name: "TutorApplications");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "TutorProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "TutorProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByAdminId",
                table: "TutorProfiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TutorProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Draft");

            migrationBuilder.CreateIndex(
                name: "IX_TutorProfiles_ReviewedByAdminId",
                table: "TutorProfiles",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_TutorProfiles_Status",
                table: "TutorProfiles",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Users_ReviewedByAdminId",
                table: "TutorProfiles",
                column: "ReviewedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
