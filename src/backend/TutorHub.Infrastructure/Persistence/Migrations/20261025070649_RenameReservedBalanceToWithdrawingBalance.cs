using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameReservedBalanceToWithdrawingBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_StudentWallet_NonNegativeBalances",
                table: "StudentWallets");

            migrationBuilder.RenameColumn(
                name: "ReservedBalance",
                table: "StudentWallets",
                newName: "WithdrawingBalance");

            migrationBuilder.AddCheckConstraint(
                name: "CK_StudentWallet_NonNegativeBalances",
                table: "StudentWallets",
                sql: "\"AvailableBalance\" >= 0 AND \"WithdrawingBalance\" >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_StudentWallet_NonNegativeBalances",
                table: "StudentWallets");

            migrationBuilder.RenameColumn(
                name: "WithdrawingBalance",
                table: "StudentWallets",
                newName: "ReservedBalance");

            migrationBuilder.AddCheckConstraint(
                name: "CK_StudentWallet_NonNegativeBalances",
                table: "StudentWallets",
                sql: "\"AvailableBalance\" >= 0 AND \"ReservedBalance\" >= 0");
        }
    }
}
