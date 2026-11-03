using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeLegacyTransactionStatuses : Migration
    {
        // This one-time correction changes vocabulary only. Never disable the ledger
        // trigger or allow any amount, timestamp, ID or linkage to change with it.
        public const string NormalizeSql = """
            LOCK TABLE "Transactions" IN ACCESS EXCLUSIVE MODE;
            CREATE OR REPLACE FUNCTION tutorhub_guard_settled_transaction()
            RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'UPDATE' AND OLD."Status" = 'Success' AND NEW."Status" = 'Succeeded'
                   AND (to_jsonb(OLD) - 'Status') = (to_jsonb(NEW) - 'Status') THEN
                    RETURN NEW;
                END IF;
                IF TG_OP = 'DELETE' THEN
                    RAISE EXCEPTION 'Transaction records cannot be deleted (INV-LEDGER-007). Id=%', OLD."Id";
                END IF;
                IF OLD."Type" IN ('SessionPayoutCredit', 'PlatformFeeReversal')
                   OR OLD."Status" IN ('Released', 'Succeeded') THEN
                    RAISE EXCEPTION 'Settled historical financial records are immutable (INV-LEDGER-007). Id=%', OLD."Id";
                END IF;
                RETURN NEW;
            END; $$;

            UPDATE "Transactions" SET "Status" = 'Succeeded' WHERE "Status" = 'Success';

            CREATE OR REPLACE FUNCTION tutorhub_guard_settled_transaction()
            RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    RAISE EXCEPTION 'Transaction records cannot be deleted (INV-LEDGER-007). Id=%', OLD."Id";
                END IF;
                IF OLD."Type" IN ('SessionPayoutCredit', 'PlatformFeeReversal')
                   OR OLD."Status" IN ('Released', 'Succeeded') THEN
                    RAISE EXCEPTION 'Settled historical financial records are immutable (INV-LEDGER-007). Id=%', OLD."Id";
                END IF;
                RETURN NEW;
            END; $$;
            """;

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(NormalizeSql);
            migrationBuilder.AddCheckConstraint(
                name: "CK_Transactions_Status",
                table: "Transactions",
                sql: "\"Status\" IN ('Held', 'Released', 'Refunded', 'Pending', 'Succeeded', 'Failed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Transactions_Status",
                table: "Transactions");
        }
    }
}
