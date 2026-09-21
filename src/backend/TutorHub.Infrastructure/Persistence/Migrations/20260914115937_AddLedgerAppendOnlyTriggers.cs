using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLedgerAppendOnlyTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // P0-C2 (INV-LEDGER-006, INV-LEDGER-007): defence in depth for the financial
            // ledger. AppDbContext.EnforceLedgerImmutability() already blocks these writes
            // in the change tracker, but nothing at the database level stopped raw SQL or
            // an ON DELETE CASCADE (Booking -> Transactions) from rewriting history.
            //
            // Mirrors the EF guard exactly, including its "original value" semantics:
            //   * Transactions: DELETE always blocked; UPDATE blocked when the PREVIOUS
            //     row was a payout / fee reversal or was already settled.
            //     A StudentRefund may still go Pending -> Succeeded (OLD.Status='Pending').
            //   * AuditLogs: UPDATE and DELETE always blocked.
            migrationBuilder.Sql(
                """
                CREATE OR REPLACE FUNCTION tutorhub_guard_settled_transaction()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF TG_OP = 'DELETE' THEN
                        RAISE EXCEPTION 'Transaction records cannot be deleted (INV-LEDGER-007). Id=%', OLD."Id";
                    END IF;

                    IF OLD."Type" IN ('SessionPayoutCredit', 'PlatformFeeReversal')
                       OR OLD."Status" IN ('Released', 'Succeeded') THEN
                        RAISE EXCEPTION 'Settled historical financial records are immutable (INV-LEDGER-007). Id=%', OLD."Id";
                    END IF;

                    RETURN NEW;
                END;
                $$;

                DROP TRIGGER IF EXISTS trg_transactions_append_only ON "Transactions";

                CREATE TRIGGER trg_transactions_append_only
                BEFORE UPDATE OR DELETE ON "Transactions"
                FOR EACH ROW
                EXECUTE FUNCTION tutorhub_guard_settled_transaction();

                CREATE OR REPLACE FUNCTION tutorhub_guard_audit_log()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    RAISE EXCEPTION 'AuditLog records are append-only and cannot be modified or deleted (INV-LEDGER-006). Id=%', OLD."Id";
                END;
                $$;

                DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON "AuditLogs";

                CREATE TRIGGER trg_audit_logs_append_only
                BEFORE UPDATE OR DELETE ON "AuditLogs"
                FOR EACH ROW
                EXECUTE FUNCTION tutorhub_guard_audit_log();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP TRIGGER IF EXISTS trg_transactions_append_only ON "Transactions";
                DROP FUNCTION IF EXISTS tutorhub_guard_settled_transaction();

                DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON "AuditLogs";
                DROP FUNCTION IF EXISTS tutorhub_guard_audit_log();
                """);
        }
    }
}
