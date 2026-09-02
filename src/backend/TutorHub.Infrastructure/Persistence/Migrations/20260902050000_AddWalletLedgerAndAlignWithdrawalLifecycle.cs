using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletLedgerAndAlignWithdrawalLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Withdrawals");

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "Withdrawals",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessingStartedAt",
                table: "Withdrawals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProcessingStartedByAdminId",
                table: "Withdrawals",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureReason",
                table: "Withdrawals",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountHolderName",
                table: "TutorProfiles",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "TutorProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "TutorProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "TutorProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    WithdrawalId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Withdrawals_WithdrawalId",
                        column: x => x.WithdrawalId,
                        principalTable: "Withdrawals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Withdrawals_ProcessingStartedByAdminId",
                table: "Withdrawals",
                column: "ProcessingStartedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId_CreatedAt",
                table: "WalletTransactions",
                columns: new[] { "WalletId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WithdrawalId",
                table: "WalletTransactions",
                column: "WithdrawalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_ProcessingStartedByAdminId",
                table: "Withdrawals",
                column: "ProcessingStartedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Withdrawals_ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "ProcessingStartedAt",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "FailureReason",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "AccountHolderName",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "TutorProfiles");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Withdrawals",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
