using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacyHourlyPricingAndSlotBookingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_Price",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_TimeRange",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TutorProfileId_StartAt_EndAt_Status",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "OverridePrice",
                table: "TutorSubjects");

            migrationBuilder.DropColumn(
                name: "EndAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StartAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TutorProfileId_Status",
                table: "Bookings",
                columns: new[] { "TutorProfileId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_TotalPrice",
                table: "Bookings",
                sql: "\"TotalPrice\" >= 0 AND \"TotalSessions\" > 0 AND \"SessionDurationMinutes\" > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_TotalPrice",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TutorProfileId_Status",
                table: "Bookings");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "TutorProfiles",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OverridePrice",
                table: "TutorSubjects",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Bookings",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "Bookings",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TutorProfileId_StartAt_EndAt_Status",
                table: "Bookings",
                columns: new[] { "TutorProfileId", "StartAt", "EndAt", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_Price",
                table: "Bookings",
                sql: "\"HourlyRate\" >= 0 AND \"TotalAmount\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_TimeRange",
                table: "Bookings",
                sql: "\"StartAt\" < \"EndAt\"");
        }
    }
}
