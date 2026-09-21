\pset pager off

\echo '=================================================================='
\echo '                   TUTORHUB SEED VERIFICATION                     '
\echo '=================================================================='

\echo '--- 1. TABLE ROW COUNTS ---'
SELECT relname AS "Table", n_live_tup AS "Rows"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

\echo '--- 2. FINANCIAL INVARIANT: Sum(Session.EarningAmount) == Enrollment.TotalPrice ---'
SELECT 
    e."Id" AS "EnrollmentId",
    e."TotalPrice",
    COALESCE(SUM(s."EarningAmount"), 0) AS "TotalSessionEarnings",
    e."TotalPrice" - COALESCE(SUM(s."EarningAmount"), 0) AS "Difference"
FROM "Enrollments" e
LEFT JOIN "Sessions" s ON s."EnrollmentId" = e."Id"
GROUP BY e."Id", e."TotalPrice"
HAVING e."TotalPrice" != COALESCE(SUM(s."EarningAmount"), 0);

\echo '--- 3. FINANCIAL INVARIANT: Wallet Balances (Pending >= 0, Available >= 0, Held >= 0) ---'
SELECT 
    "Id" AS "WalletId",
    "TutorProfileId",
    "PendingBalance",
    "AvailableBalance",
    "HeldBalance",
    "AvailableBalance" - "HeldBalance" AS "WithdrawableBalance"
FROM "Wallets"
WHERE "PendingBalance" < 0 
   OR "AvailableBalance" < 0 
   OR "HeldBalance" < 0 
   OR ("AvailableBalance" - "HeldBalance") < 0;

\echo '--- 4. INTEGRITY CHECK: Sessions Count vs Enrollment.TotalSessions ---'
SELECT 
    e."Id" AS "EnrollmentId",
    e."TotalSessions",
    COUNT(s."Id") AS "ActualSessions"
FROM "Enrollments" e
LEFT JOIN "Sessions" s ON s."EnrollmentId" = e."Id"
GROUP BY e."Id", e."TotalSessions"
HAVING e."TotalSessions" != COUNT(s."Id");

\echo '--- 5. INTEGRITY CHECK: Sessions with Multiple Active Disputes (IX_Disputes_ActiveSessionId) ---'
SELECT 
    "SessionId",
    COUNT(*) AS "ActiveDisputesCount"
FROM "Disputes"
WHERE "Status" IN ('Open', 'UnderReview', 'RequiresAdminFinancialIntervention', 'RequiresAdminRefundSettlement')
GROUP BY "SessionId"
HAVING COUNT(*) > 1;

\echo '--- 6. INTEGRITY CHECK: Duplicate PaymentGatewayRef on Transactions ---'
SELECT 
    "PaymentGatewayRef",
    COUNT(*) AS "DuplicateCount"
FROM "Transactions"
WHERE "PaymentGatewayRef" IS NOT NULL
GROUP BY "PaymentGatewayRef"
HAVING COUNT(*) > 1;

\echo '--- 7. INTEGRITY CHECK: Payout Amount Math (Gross - Fee == Net) ---'
SELECT 
    "Id" AS "TransactionId",
    "Amount" AS "Gross",
    "CommissionAmount" AS "Fee",
    "PayoutAmount" AS "Net",
    "Amount" - "CommissionAmount" AS "ExpectedNet"
FROM "Transactions"
WHERE "Type" = 'SessionPayoutCredit'
  AND ("Amount" - "CommissionAmount") != "PayoutAmount";

\echo '=================================================================='
\echo '                       VERIFICATION FINISHED                      '
\echo '=================================================================='
