using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCurriculumAndMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Services",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurriculumJson",
                table: "Services",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FaqsJson",
                table: "Services",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrerequisitesJson",
                table: "Services",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetAudienceJson",
                table: "Services",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "CurriculumJson",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "FaqsJson",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "PrerequisitesJson",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "TargetAudienceJson",
                table: "Services");
        }
    }
}
