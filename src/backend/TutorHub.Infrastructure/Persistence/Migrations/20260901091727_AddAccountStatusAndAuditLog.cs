using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountStatusAndAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Active");

            // ⚠️ MIGRATION FALLBACK ASSUMPTION:
            // Legacy IsActive = false is mapped to 'Suspended' because the legacy boolean schema
            // cannot distinguish Suspended from Banned. This is a safe migration fallback default,
            // NOT historical evidence that these users were explicitly suspended.
            // If any legacy users should be Banned, Admin must reclassify them post-migration.
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""Status"" = CASE
                    WHEN ""IsActive"" = true THEN 'Active'
                    ELSE 'Suspended'
                END;
            ");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "AccountStatusAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NewStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountStatusAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccountStatusAuditLogs_Users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AccountStatusAuditLogs_Users_TargetUserId",
                        column: x => x.TargetUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountStatusAuditLogs_AdminUserId",
                table: "AccountStatusAuditLogs",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountStatusAuditLogs_TargetUserId",
                table: "AccountStatusAuditLogs",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountStatusAuditLogs");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""IsActive"" = (""Status"" = 'Active');
            ");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Users");
        }
    }
}
