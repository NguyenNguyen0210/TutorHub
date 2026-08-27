using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateReportSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports");

            migrationBuilder.AlterColumn<string>(
                name: "AdminDecision",
                table: "Reports",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports",
                columns: new[] { "BookingId", "ReporterUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports");

            migrationBuilder.AlterColumn<string>(
                name: "AdminDecision",
                table: "Reports",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports",
                columns: new[] { "BookingId", "ReporterUserId" });
        }
    }
}
