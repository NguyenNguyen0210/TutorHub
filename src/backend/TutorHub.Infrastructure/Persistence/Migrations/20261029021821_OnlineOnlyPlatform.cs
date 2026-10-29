using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OnlineOnlyPlatform : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "TeachingMode",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "TutorApplications");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "TutorApplications");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "TutorApplications");

            migrationBuilder.DropColumn(
                name: "TeachingMode",
                table: "TutorApplications");

            migrationBuilder.DropColumn(
                name: "TeachingMode",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "TeachingMode",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "TeachingMode",
                table: "Bookings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "TutorProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "TutorProfiles",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "TutorProfiles",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeachingMode",
                table: "TutorProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Online");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "TutorApplications",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "TutorApplications",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "TutorApplications",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeachingMode",
                table: "TutorApplications",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Online");

            migrationBuilder.AddColumn<string>(
                name: "TeachingMode",
                table: "Services",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Online");

            migrationBuilder.AddColumn<string>(
                name: "TeachingMode",
                table: "Enrollments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Online");

            migrationBuilder.AddColumn<string>(
                name: "TeachingMode",
                table: "Bookings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Online");
        }
    }
}
