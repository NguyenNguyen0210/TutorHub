using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNoShowStrikes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_NonNegativeStrikes",
                table: "Users",
                sql: "\"AbsentStrikes\" >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
