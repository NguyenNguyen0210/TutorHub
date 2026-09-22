using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentWalletAndImmutableLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "OutboxMessages",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "EmailDeliveries",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateTable(
                name: "StudentWallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvailableBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ReservedBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentWallets", x => x.Id);
                    table.CheckConstraint("CK_StudentWallet_NonNegativeBalances", "\"AvailableBalance\" >= 0 AND \"ReservedBalance\" >= 0");
                    table.ForeignKey(
                        name: "FK_StudentWallets_StudentProfiles_StudentProfileId",
                        column: x => x.StudentProfileId,
                        principalTable: "StudentProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentWalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentWalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentWalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentWalletTransactions_StudentWallets_StudentWalletId",
                        column: x => x.StudentWalletId,
                        principalTable: "StudentWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentWithdrawals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentWalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BankCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AccountHolderName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessingStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessingStartedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentWithdrawals", x => x.Id);
                    table.CheckConstraint("CK_StudentWithdrawal_PositiveAmount", "\"Amount\" > 0");
                    table.ForeignKey(
                        name: "FK_StudentWithdrawals_StudentWallets_StudentWalletId",
                        column: x => x.StudentWalletId,
                        principalTable: "StudentWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentWithdrawals_Users_ProcessedByAdminId",
                        column: x => x.ProcessedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentWithdrawals_Users_ProcessingStartedByAdminId",
                        column: x => x.ProcessingStartedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TopUpRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentWalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    TransferReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AdminNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopUpRequests", x => x.Id);
                    table.CheckConstraint("CK_TopUpRequest_PositiveAmount", "\"Amount\" > 0");
                    table.ForeignKey(
                        name: "FK_TopUpRequests_StudentWallets_StudentWalletId",
                        column: x => x.StudentWalletId,
                        principalTable: "StudentWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TopUpRequests_Users_ProcessedByAdminId",
                        column: x => x.ProcessedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"HeldBalance\" >= 0 AND \"HeldBalance\" <= \"AvailableBalance\"");

            migrationBuilder.CreateIndex(
                name: "IX_StudentWallets_StudentProfileId",
                table: "StudentWallets",
                column: "StudentProfileId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentWalletTransactions_ReferenceType_ReferenceId",
                table: "StudentWalletTransactions",
                columns: new[] { "ReferenceType", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_StudentWalletTransactions_StudentWalletId_CreatedAt",
                table: "StudentWalletTransactions",
                columns: new[] { "StudentWalletId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_StudentWithdrawals_ProcessedByAdminId",
                table: "StudentWithdrawals",
                column: "ProcessedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentWithdrawals_ProcessingStartedByAdminId",
                table: "StudentWithdrawals",
                column: "ProcessingStartedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentWithdrawals_Status",
                table: "StudentWithdrawals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StudentWithdrawals_StudentWalletId_Status",
                table: "StudentWithdrawals",
                columns: new[] { "StudentWalletId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TopUpRequests_ProcessedByAdminId",
                table: "TopUpRequests",
                column: "ProcessedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_TopUpRequests_Status",
                table: "TopUpRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TopUpRequests_StudentWalletId_Status",
                table: "TopUpRequests",
                columns: new[] { "StudentWalletId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TopUpRequests_TransferReference",
                table: "TopUpRequests",
                column: "TransferReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentWalletTransactions");

            migrationBuilder.DropTable(
                name: "StudentWithdrawals");

            migrationBuilder.DropTable(
                name: "TopUpRequests");

            migrationBuilder.DropTable(
                name: "StudentWallets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "OutboxMessages");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "EmailDeliveries");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0");
        }
    }
}
