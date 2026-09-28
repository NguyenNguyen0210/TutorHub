using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCustomAgreement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_CustomAgreements_CustomAgreementId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "CustomAgreements");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_CustomAgreementId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CustomAgreementId",
                table: "Bookings");

            migrationBuilder.AlterColumn<Guid>(
                name: "ServiceId",
                table: "Bookings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "ServiceId",
                table: "Bookings",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomAgreementId",
                table: "Bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomAgreements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: true),
                    StudentProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    TutorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RejectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SessionDurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TeachingMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalSessions = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomAgreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomAgreements_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomAgreements_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomAgreements_StudentProfiles_StudentProfileId",
                        column: x => x.StudentProfileId,
                        principalTable: "StudentProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomAgreements_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CustomAgreements_TutorProfiles_TutorProfileId",
                        column: x => x.TutorProfileId,
                        principalTable: "TutorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CustomAgreementId",
                table: "Bookings",
                column: "CustomAgreementId",
                unique: true,
                filter: "\"CustomAgreementId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_ConversationId",
                table: "CustomAgreements",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_CreatedAt",
                table: "CustomAgreements",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_ServiceId",
                table: "CustomAgreements",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_StudentProfileId_Status",
                table: "CustomAgreements",
                columns: new[] { "StudentProfileId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_SubjectId",
                table: "CustomAgreements",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomAgreements_TutorProfileId_Status",
                table: "CustomAgreements",
                columns: new[] { "TutorProfileId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_CustomAgreements_CustomAgreementId",
                table: "Bookings",
                column: "CustomAgreementId",
                principalTable: "CustomAgreements",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
