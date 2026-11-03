using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PersistDisputeEvidenceObjectKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ObjectKey",
                table: "DisputeEvidences",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            // Recover only keys matching the application's old generated names.
            // Downloads verify existence in managed storage; no legacy URL is fetched.
            migrationBuilder.Sql("""
                UPDATE "DisputeEvidences"
                SET "ObjectKey" = substring(split_part("FileUrl", '?', 1) from '(reports/evidence/[a-f0-9]{32}/[a-f0-9]{32}\.(jpg|jpeg|png|webp|pdf|txt))$')
                WHERE split_part("FileUrl", '?', 1) ~ ('/reports/evidence/' || replace("DisputeId"::text, '-', '') || '/[a-f0-9]{32}\.(jpg|jpeg|png|webp|pdf|txt)$');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ObjectKey",
                table: "DisputeEvidences");
        }
    }
}
