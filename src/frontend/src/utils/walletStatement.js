const cents = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Math.round(Number(value) * 100);
const bucket = row => row.type === 'WithdrawalSuccessSettlement' ? 'withdrawing' : 'available';

// Verify recorded balances; never manufacture history from a current snapshot.
export function statementIssues(items, wallet, page = 1) {
  const issues = new Set();
  const newer = new Map();
  for (const [index, row] of items.entries()) {
    const before = cents(row.balanceBefore), after = cents(row.balanceAfter), amount = cents(row.amount);
    const sign = row.direction === 'Credit' ? 1 : row.direction === 'Debit' ? -1 : null;
    if (before === null || after === null || amount === null || sign === null || before + sign * amount !== after) issues.add(row.id);
    const key = bucket(row);
    const next = newer.get(key);
    if (key === 'available' && next && cents(next.balanceBefore) !== after) { issues.add(row.id); issues.add(next.id); }
    if (!next && page === 1 && (key === 'available' || index === 0)) {
      const current = cents(key === 'available' ? wallet?.availableBalance : wallet?.withdrawingBalance);
      if (current !== null && after !== current) issues.add(row.id);
    }
    newer.set(key, row);
  }
  return issues;
}
