using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveDisputeUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Disputes_SessionId",
                table: "Disputes");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_ActiveSessionId",
                table: "Disputes",
                column: "SessionId",
                unique: true,
                filter: "\"Status\" IN ('Open', 'UnderReview', 'RequiresAdminFinancialIntervention', 'RequiresAdminRefundSettlement')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Disputes_ActiveSessionId",
                table: "Disputes");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_SessionId",
                table: "Disputes",
                column: "SessionId");
        }
    }
}
