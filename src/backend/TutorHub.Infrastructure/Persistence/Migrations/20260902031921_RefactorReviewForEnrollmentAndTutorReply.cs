using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorReviewForEnrollmentAndTutorReply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Bookings_BookingId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_RevieweeUserId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_ReviewerUserId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookingId_ReviewerUserId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_RevieweeUserId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ReviewerUserId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "BookingId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RevieweeUserId",
                table: "Reviews");

            migrationBuilder.RenameColumn(
                name: "ReviewerUserId",
                table: "Reviews",
                newName: "EnrollmentId");

            migrationBuilder.AddColumn<bool>(
                name: "IsRemoved",
                table: "Reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RemovalReason",
                table: "Reviews",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RemovedAt",
                table: "Reviews",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RemovedByAdminId",
                table: "Reviews",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TutorRepliedAt",
                table: "Reviews",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TutorReply",
                table: "Reviews",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_EnrollmentId",
                table: "Reviews",
                column: "EnrollmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_IsRemoved",
                table: "Reviews",
                column: "IsRemoved");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RemovedByAdminId",
                table: "Reviews",
                column: "RemovedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Enrollments_EnrollmentId",
                table: "Reviews",
                column: "EnrollmentId",
                principalTable: "Enrollments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_RemovedByAdminId",
                table: "Reviews",
                column: "RemovedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Enrollments_EnrollmentId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_RemovedByAdminId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_EnrollmentId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_IsRemoved",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_RemovedByAdminId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "IsRemoved",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RemovalReason",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RemovedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RemovedByAdminId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "TutorRepliedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "TutorReply",
                table: "Reviews");

            migrationBuilder.RenameColumn(
                name: "EnrollmentId",
                table: "Reviews",
                newName: "ReviewerUserId");

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId",
                table: "Reviews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "RevieweeUserId",
                table: "Reviews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId_ReviewerUserId",
                table: "Reviews",
                columns: new[] { "BookingId", "ReviewerUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RevieweeUserId",
                table: "Reviews",
                column: "RevieweeUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewerUserId",
                table: "Reviews",
                column: "ReviewerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Bookings_BookingId",
                table: "Reviews",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_RevieweeUserId",
                table: "Reviews",
                column: "RevieweeUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_ReviewerUserId",
                table: "Reviews",
                column: "ReviewerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
