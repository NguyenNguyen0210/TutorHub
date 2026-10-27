using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UnifyWalletsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TopUpRequests_StudentWallets_StudentWalletId",
                table: "TopUpRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_TutorProfiles_TutorProfileId",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_TutorProfileId",
                table: "Wallets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");
            migrationBuilder.RenameColumn(
                name: "StudentWalletId",
                table: "TopUpRequests",
                newName: "WalletId");

            migrationBuilder.RenameIndex(
                name: "IX_TopUpRequests_StudentWalletId_Status",
                table: "TopUpRequests",
                newName: "IX_TopUpRequests_WalletId_Status");

            migrationBuilder.AddColumn<decimal>(
                name: "BalanceBefore",
                table: "WalletTransactions",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Direction",
                table: "WalletTransactions",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "Credit");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "WalletTransactions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceId",
                table: "WalletTransactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceType",
                table: "WalletTransactions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "TutorProfileId",
                table: "Wallets",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Wallets",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");

            migrationBuilder.AddColumn<Guid>(
                name: "StudentProfileId",
                table: "Wallets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Wallets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<decimal>(
                name: "WithdrawingBalance",
                table: "Wallets",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            // ── SAFE FINANCIAL DATA MIGRATION & BACKFILL ────────────────────────
            migrationBuilder.Sql(@"
                -- 1. Backfill UserId on existing Wallets from TutorProfiles
                UPDATE ""Wallets"" w
                SET ""UserId"" = tp.""UserId"",
                    ""CreatedAt"" = w.""UpdatedAt""
                FROM ""TutorProfiles"" tp
                WHERE w.""TutorProfileId"" = tp.""Id"";

                -- 2. Backfill from StudentWallets if table exists
                DO $$
                BEGIN
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'StudentWallets') THEN
                        -- 2.1. Merge student balances into existing wallet if user already has one (Tutor + Student)
                        UPDATE ""Wallets"" w
                        SET ""AvailableBalance"" = w.""AvailableBalance"" + sw.""AvailableBalance"",
                            ""WithdrawingBalance"" = w.""WithdrawingBalance"" + sw.""WithdrawingBalance"",
                            ""StudentProfileId"" = sw.""StudentProfileId""
                        FROM ""StudentWallets"" sw
                        JOIN ""StudentProfiles"" sp ON sw.""StudentProfileId"" = sp.""Id""
                        WHERE w.""UserId"" = sp.""UserId"";

                        -- 2.2. Insert new wallet for pure students
                        INSERT INTO ""Wallets"" (""Id"", ""UserId"", ""StudentProfileId"", ""AvailableBalance"", ""PendingBalance"", ""WithdrawingBalance"", ""CreatedAt"", ""UpdatedAt"")
                        SELECT
                            sw.""Id"",
                            sp.""UserId"",
                            sw.""StudentProfileId"",
                            sw.""AvailableBalance"",
                            0,
                            sw.""WithdrawingBalance"",
                            sw.""CreatedAt"",
                            sw.""UpdatedAt""
                        FROM ""StudentWallets"" sw
                        JOIN ""StudentProfiles"" sp ON sw.""StudentProfileId"" = sp.""Id""
                        WHERE sp.""UserId"" NOT IN (SELECT ""UserId"" FROM ""Wallets"" WHERE ""UserId"" IS NOT NULL AND ""UserId"" != '00000000-0000-0000-0000-000000000000');

                        -- 2.3. Migrate StudentWalletTransactions into WalletTransactions
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'StudentWalletTransactions') THEN
                            INSERT INTO ""WalletTransactions"" (""Id"", ""WalletId"", ""Type"", ""Direction"", ""Amount"", ""BalanceBefore"", ""BalanceAfter"", ""ReferenceType"", ""ReferenceId"", ""Description"", ""Reason"", ""CreatedByUserId"", ""CreatedAt"")
                            SELECT
                                swt.""Id"",
                                w.""Id"",
                                swt.""Type"",
                                swt.""Direction"",
                                swt.""Amount"",
                                swt.""BalanceBefore"",
                                swt.""BalanceAfter"",
                                swt.""ReferenceType"",
                                swt.""ReferenceId"",
                                swt.""Description"",
                                swt.""Reason"",
                                swt.""CreatedByUserId"",
                                swt.""CreatedAt""
                            FROM ""StudentWalletTransactions"" swt
                            JOIN ""StudentWallets"" sw ON swt.""StudentWalletId"" = sw.""Id""
                            JOIN ""StudentProfiles"" sp ON sw.""StudentProfileId"" = sp.""Id""
                            JOIN ""Wallets"" w ON w.""UserId"" = sp.""UserId"";
                        END IF;

                        -- 2.4. Migrate StudentWithdrawals into Withdrawals
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'StudentWithdrawals') THEN
                            INSERT INTO ""Withdrawals"" (""Id"", ""WalletId"", ""Amount"", ""Status"", ""BankName"", ""BankCode"", ""AccountNumber"", ""AccountHolderName"", ""Note"", ""RequestedAt"", ""ProcessingStartedAt"", ""ProcessingStartedByAdminId"", ""ProcessedAt"", ""ProcessedByAdminId"", ""FailureReason"")
                            SELECT
                                swd.""Id"",
                                w.""Id"",
                                swd.""Amount"",
                                swd.""Status"",
                                swd.""BankName"",
                                swd.""BankCode"",
                                swd.""AccountNumber"",
                                swd.""AccountHolderName"",
                                swd.""Note"",
                                swd.""RequestedAt"",
                                swd.""ProcessingStartedAt"",
                                swd.""ProcessingStartedByAdminId"",
                                swd.""ProcessedAt"",
                                swd.""ProcessedByAdminId"",
                                swd.""FailureReason""
                            FROM ""StudentWithdrawals"" swd
                            JOIN ""StudentWallets"" sw ON swd.""StudentWalletId"" = sw.""Id""
                            JOIN ""StudentProfiles"" sp ON sw.""StudentProfileId"" = sp.""Id""
                            JOIN ""Wallets"" w ON w.""UserId"" = sp.""UserId"";
                        END IF;

                        -- 2.5. Fix TopUpRequests.WalletId to point to unified Wallets.Id
                        UPDATE ""TopUpRequests"" tur
                        SET ""WalletId"" = w.""Id""
                        FROM ""StudentWallets"" sw
                        JOIN ""StudentProfiles"" sp ON sw.""StudentProfileId"" = sp.""Id""
                        JOIN ""Wallets"" w ON w.""UserId"" = sp.""UserId""
                        WHERE tur.""WalletId"" = sw.""Id"";
                    END IF;
                END $$;
            ");

            // ── DROP DEPRECATED TABLES (Now safe after data migration) ───────────
            migrationBuilder.DropTable(
                name: "StudentWalletTransactions");

            migrationBuilder.DropTable(
                name: "StudentWithdrawals");

            migrationBuilder.DropTable(
                name: "StudentWallets");

            migrationBuilder.DropTable(
                name: "InboxMessages");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_StudentProfileId",
                table: "Wallets",
                column: "StudentProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_TutorProfileId",
                table: "Wallets",
                column: "TutorProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_UserId",
                table: "Wallets",
                column: "UserId",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"WithdrawingBalance\" >= 0");

            migrationBuilder.AddForeignKey(
                name: "FK_TopUpRequests_Wallets_WalletId",
                table: "TopUpRequests",
                column: "WalletId",
                principalTable: "Wallets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_StudentProfiles_StudentProfileId",
                table: "Wallets",
                column: "StudentProfileId",
                principalTable: "StudentProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_TutorProfiles_TutorProfileId",
                table: "Wallets",
                column: "TutorProfileId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_Users_UserId",
                table: "Wallets",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TopUpRequests_Wallets_WalletId",
                table: "TopUpRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_StudentProfiles_StudentProfileId",
                table: "Wallets");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_TutorProfiles_TutorProfileId",
                table: "Wallets");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_Users_UserId",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_StudentProfileId",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_TutorProfileId",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_UserId",
                table: "Wallets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets");
            migrationBuilder.DropColumn(
                name: "BalanceBefore",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "Direction",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "ReferenceType",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "StudentProfileId",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "WithdrawingBalance",
                table: "Wallets");

            migrationBuilder.RenameColumn(
                name: "WalletId",
                table: "TopUpRequests",
                newName: "StudentWalletId");

            migrationBuilder.RenameIndex(
                name: "IX_TopUpRequests_WalletId_Status",
                table: "TopUpRequests",
                newName: "IX_TopUpRequests_StudentWalletId_Status");

            migrationBuilder.AlterColumn<Guid>(
                name: "TutorProfileId",
                table: "Wallets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "InboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsumerName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudentWallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvailableBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WithdrawingBalance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentWallets", x => x.Id);
                    table.CheckConstraint("CK_StudentWallet_NonNegativeBalances", "\"AvailableBalance\" >= 0 AND \"WithdrawingBalance\" >= 0");
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
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
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
                    ProcessedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProcessingStartedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    StudentWalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountHolderName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    AccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BankCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessingStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_TutorProfileId",
                table: "Wallets",
                column: "TutorProfileId",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Wallet_NonNegativeBalances",
                table: "Wallets",
                sql: "\"PendingBalance\" >= 0 AND \"AvailableBalance\" >= 0 AND \"WithdrawingBalance\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_InboxMessages_ConsumerEvent",
                table: "InboxMessages",
                columns: new[] { "ConsumerName", "EventId" },
                unique: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_TopUpRequests_StudentWallets_StudentWalletId",
                table: "TopUpRequests",
                column: "StudentWalletId",
                principalTable: "StudentWallets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_TutorProfiles_TutorProfileId",
                table: "Wallets",
                column: "TutorProfileId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
