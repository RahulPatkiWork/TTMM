export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';

export interface SplitUser {
  user_id: string;
  name: string;
  amount_cents: number;
  percent: number;
  shares: number;
  is_selected: boolean;
}

export function distributeRemainder(
  splits: SplitUser[],
  totalAmountCents: number,
  payerId: string
) {
  const currentTotal = splits.reduce((sum, s) => sum + s.amount_cents, 0);
  let remainder = totalAmountCents - currentTotal;

  if (remainder === 0) return;

  // Find payer in splits
  const payerSplit = splits.find(s => s.user_id === payerId);
  if (payerSplit && remainder > 0) {
    payerSplit.amount_cents += remainder;
    remainder = 0;
  } else if (payerSplit && remainder < 0 && payerSplit.amount_cents + remainder >= 0) {
    payerSplit.amount_cents += remainder;
    remainder = 0;
  }

  // If payer not in splits or remainder still not 0, distribute 1 cent at a time
  if (remainder > 0) {
    for (let i = 0; i < splits.length && remainder > 0; i++) {
      splits[i].amount_cents += 1;
      remainder -= 1;
    }
  } else if (remainder < 0) {
    for (let i = 0; i < splits.length && remainder < 0; i++) {
      if (splits[i].amount_cents > 0) {
        splits[i].amount_cents -= 1;
        remainder += 1;
      }
    }
  }
}

export function calculateSplits(
  totalAmountCents: number,
  payerId: string,
  method: SplitMethod,
  users: SplitUser[]
): SplitUser[] {
  const result = users.map(u => ({ ...u }));
  const selected = result.filter(u => u.is_selected);

  if (selected.length === 0 || totalAmountCents === 0) {
    return result.map(u => ({ ...u, amount_cents: 0 }));
  }

  if (method === 'EQUAL') {
    const baseShare = Math.floor(totalAmountCents / selected.length);
    selected.forEach(u => u.amount_cents = baseShare);
    distributeRemainder(selected, totalAmountCents, payerId);
  } else if (method === 'PERCENT') {
    let totalPercent = selected.reduce((sum, u) => sum + (u.percent || 0), 0);
    if (totalPercent === 100) {
      selected.forEach(u => {
        u.amount_cents = Math.floor((totalAmountCents * (u.percent || 0)) / 100);
      });
      distributeRemainder(selected, totalAmountCents, payerId);
    } else {
      selected.forEach(u => {
        u.amount_cents = Math.floor((totalAmountCents * (u.percent || 0)) / 100);
      });
    }
  } else if (method === 'SHARES') {
    let totalShares = selected.reduce((sum, u) => sum + (u.shares || 0), 0);
    if (totalShares > 0) {
      selected.forEach(u => {
        u.amount_cents = Math.floor((totalAmountCents * (u.shares || 0)) / totalShares);
      });
      distributeRemainder(selected, totalAmountCents, payerId);
    } else {
      selected.forEach(u => u.amount_cents = 0);
    }
  } else if (method === 'EXACT') {
    // EXACT uses the manually entered amount_cents, no auto-calculation
  }

  // For unselected users, ensure amount is 0
  result.filter(u => !u.is_selected).forEach(u => u.amount_cents = 0);

  return result;
}
