export interface Debt {
  from: string;
  to: string;
  amount: number; // INTEGER (cents/paise)
}

/**
 * Greedy Graph Match Algorithm for Debt Simplification
 * Accepts an array of raw debts and returns a minimized array of settlement transactions.
 */
export function simplifyDebts(debts: Debt[]): Debt[] {
  const balances: Record<string, number> = {};

  // 1. Calculate net balances for each person
  // Positive = Creditor (owed money)
  // Negative = Debtor (owes money)
  for (const debt of debts) {
    balances[debt.from] = (balances[debt.from] || 0) - debt.amount;
    balances[debt.to] = (balances[debt.to] || 0) + debt.amount;
  }

  // 2. Separate into debtors and creditors
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < 0) {
      debtors.push({ id, amount: -balance });
    } else if (balance > 0) {
      creditors.push({ id, amount: balance });
    }
  }

  // 3. Sort descending by absolute amount
  // This ensures we match the highest debtor with the highest creditor
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // 4. Greedily match
  const simplifiedDebts: Debt[] = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const minAmount = Math.min(debtor.amount, creditor.amount);

    simplifiedDebts.push({
      from: debtor.id,
      to: creditor.id,
      amount: minAmount,
    });

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return simplifiedDebts;
}
