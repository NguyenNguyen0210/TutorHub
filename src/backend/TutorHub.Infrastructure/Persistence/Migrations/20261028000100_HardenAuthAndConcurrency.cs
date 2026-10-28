using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TutorHub.Infrastructure.Persistence;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261028000100_HardenAuthAndConcurrency")]
public sealed class HardenAuthAndConcurrency : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "TokenVersion",
            table: "Users",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.Sql("""
            UPDATE "WalletTransactions"
            SET "Direction" = 'Credit',
                "BalanceBefore" = "BalanceAfter" - "Amount"
            WHERE "Direction" = '0'
              AND "Type" IN ('SessionPayoutCredit', 'WithdrawalFailedAdjustmentCredit');
            """);

        migrationBuilder.AddCheckConstraint(
            name: "CK_WalletTransaction_ValidDirection",
            table: "WalletTransactions",
            sql: "\"Direction\" IN ('Credit', 'Debit')");

        migrationBuilder.CreateIndex(
            name: "UX_TutorApplications_OnePendingPerUser",
            table: "TutorApplications",
            column: "UserId",
            unique: true,
            filter: "\"Status\" = 'Pending'");

        migrationBuilder.CreateIndex(
            name: "UX_TutorApplications_OneApprovedPerUser",
            table: "TutorApplications",
            column: "UserId",
            unique: true,
            filter: "\"Status\" = 'Approved'");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "UX_TutorApplications_OnePendingPerUser",
            table: "TutorApplications");

        migrationBuilder.DropIndex(
            name: "UX_TutorApplications_OneApprovedPerUser",
            table: "TutorApplications");

        migrationBuilder.DropCheckConstraint(
            name: "CK_WalletTransaction_ValidDirection",
            table: "WalletTransactions");

        migrationBuilder.DropColumn(
            name: "TokenVersion",
            table: "Users");
    }
}
