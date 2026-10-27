using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameSessionPriceAndPlatformFee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CommissionRate",
                table: "Transactions",
                newName: "PlatformFeeRate");

            migrationBuilder.RenameColumn(
                name: "CommissionAmount",
                table: "Transactions",
                newName: "PlatformFeeAmount");

            migrationBuilder.RenameColumn(
                name: "EarningAmount",
                table: "Sessions",
                newName: "SessionPrice");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PlatformFeeRate",
                table: "Transactions",
                newName: "CommissionRate");

            migrationBuilder.RenameColumn(
                name: "PlatformFeeAmount",
                table: "Transactions",
                newName: "CommissionAmount");

            migrationBuilder.RenameColumn(
                name: "SessionPrice",
                table: "Sessions",
                newName: "EarningAmount");
        }
    }
}
