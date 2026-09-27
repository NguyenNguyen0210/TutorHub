using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAttendanceAddGracePeriod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_User_NonNegativeStrikes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AbsentStrikes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastAbsentAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StrikeWindowStart",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AttendanceVerificationDueAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AttendanceVerificationOpenedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "StudentAttendance",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TutorAttendance",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "TutorAttendanceSubmittedAt",
                table: "Sessions",
                newName: "IssueReportedAt");

            migrationBuilder.RenameColumn(
                name: "StudentAttendanceSubmittedAt",
                table: "Sessions",
                newName: "GracePeriodStartedAt");

            migrationBuilder.RenameColumn(
                name: "HasAttendanceConflict",
                table: "Sessions",
                newName: "HasIssueReport");

            migrationBuilder.RenameColumn(
                name: "AttendanceVerifiedAt",
                table: "Sessions",
                newName: "GracePeriodEndsAt");

            migrationBuilder.AddColumn<string>(
                name: "IssueReportDescription",
                table: "Sessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssueReportReason",
                table: "Sessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "IssueReportedByUserId",
                table: "Sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_Status_GracePeriodEndsAt",
                table: "Sessions",
                columns: new[] { "Status", "GracePeriodEndsAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sessions_Status_GracePeriodEndsAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IssueReportDescription",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IssueReportReason",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IssueReportedByUserId",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "IssueReportedAt",
                table: "Sessions",
                newName: "TutorAttendanceSubmittedAt");

            migrationBuilder.RenameColumn(
                name: "HasIssueReport",
                table: "Sessions",
                newName: "HasAttendanceConflict");

            migrationBuilder.RenameColumn(
                name: "GracePeriodStartedAt",
                table: "Sessions",
                newName: "StudentAttendanceSubmittedAt");

            migrationBuilder.RenameColumn(
                name: "GracePeriodEndsAt",
                table: "Sessions",
                newName: "AttendanceVerifiedAt");

            migrationBuilder.AddColumn<int>(
                name: "AbsentStrikes",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAbsentAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StrikeWindowStart",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendanceVerificationDueAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendanceVerificationOpenedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StudentAttendance",
                table: "Sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TutorAttendance",
                table: "Sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_NonNegativeStrikes",
                table: "Users",
                sql: "\"AbsentStrikes\" >= 0");
        }
    }
}
