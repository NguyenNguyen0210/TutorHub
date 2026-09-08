using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionRescheduleRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SessionRescheduleRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposedStartAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProposedEndAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionRescheduleRequests", x => x.Id);
                    table.CheckConstraint("CK_SessionRescheduleRequest_Schedule", "\"ProposedStartAt\" < \"ProposedEndAt\"");
                    table.ForeignKey(
                        name: "FK_SessionRescheduleRequests_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionRescheduleRequests_Users_ProposerUserId",
                        column: x => x.ProposerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionRescheduleRequests_Users_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionRescheduleRequests_ProposerUserId",
                table: "SessionRescheduleRequests",
                column: "ProposerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRescheduleRequests_RecipientUserId",
                table: "SessionRescheduleRequests",
                column: "RecipientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRescheduleRequests_SessionId",
                table: "SessionRescheduleRequests",
                column: "SessionId",
                unique: true,
                filter: "\"Status\" = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRescheduleRequests_SessionId_CreatedAt",
                table: "SessionRescheduleRequests",
                columns: new[] { "SessionId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessionRescheduleRequests");
        }
    }
}
