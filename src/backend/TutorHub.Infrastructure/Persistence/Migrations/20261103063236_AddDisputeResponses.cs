using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDisputeResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ResponseId",
                table: "DisputeEvidences",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DisputeResponses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DisputeId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DisputeResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DisputeResponses_Disputes_DisputeId",
                        column: x => x.DisputeId,
                        principalTable: "Disputes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DisputeResponses_Users_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DisputeEvidences_ResponseId",
                table: "DisputeEvidences",
                column: "ResponseId");

            migrationBuilder.CreateIndex(
                name: "IX_DisputeResponses_AuthorUserId",
                table: "DisputeResponses",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DisputeResponses_DisputeId_CreatedAt",
                table: "DisputeResponses",
                columns: new[] { "DisputeId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_DisputeEvidences_DisputeResponses_ResponseId",
                table: "DisputeEvidences",
                column: "ResponseId",
                principalTable: "DisputeResponses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DisputeEvidences_DisputeResponses_ResponseId",
                table: "DisputeEvidences");

            migrationBuilder.DropTable(
                name: "DisputeResponses");

            migrationBuilder.DropIndex(
                name: "IX_DisputeEvidences_ResponseId",
                table: "DisputeEvidences");

            migrationBuilder.DropColumn(
                name: "ResponseId",
                table: "DisputeEvidences");
        }
    }
}
