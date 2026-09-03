using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateAccountStatusAuditLogsToAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Copy existing AccountStatusAuditLogs records into centralized AuditLogs before dropping
            migrationBuilder.Sql(@"
                INSERT INTO ""AuditLogs"" (""Id"", ""UserId"", ""Action"", ""EntityName"", ""EntityId"", ""OldValuesJson"", ""NewValuesJson"", ""CorrelationId"", ""CreatedAt"")
                SELECT 
                    ""Id"",
                    ""AdminUserId"",
                    'USER_STATUS_CHANGED',
                    'User',
                    ""TargetUserId""::text,
                    json_build_object('status', ""PreviousStatus"")::text,
                    json_build_object('status', ""NewStatus"", 'reason', ""Reason"")::text,
                    'legacy-account-status-migration',
                    ""Timestamp""
                FROM ""AccountStatusAuditLogs"";
            ");

            migrationBuilder.DropTable(
                name: "AccountStatusAuditLogs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountStatusAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    NewStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
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
    }
}
