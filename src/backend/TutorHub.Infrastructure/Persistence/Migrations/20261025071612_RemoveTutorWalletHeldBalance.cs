using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTutorWalletHeldBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "HeldBalance",
                table: "Wallets");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");

            migrationBuilder.AddColumn<decimal>(
                name: "HeldBalance",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"HeldBalance\" >= 0 AND \"HeldBalance\" <= \"AvailableBalance\"");
        }
    }
}
