export interface ReceiptItem {
  id: string;
  name: string;
  price_cents: number;
  claimed_by: string[]; // array of user_ids
}

export interface ItemizedSplitResult {
  user_id: string;
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
}

export function calculateItemizedSplits(
  items: ReceiptItem[],
  taxCents: number,
  tipCents: number,
  payerId: string
): ItemizedSplitResult[] {
  const userMap = new Map<string, ItemizedSplitResult>();

  const getOrInitUser = (userId: string) => {
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user_id: userId,
        subtotal_cents: 0,
        tax_cents: 0,
        tip_cents: 0,
        total_cents: 0,
      });
    }
    return userMap.get(userId)!;
  };

  let subtotalAll = 0;

  // 1. Split each item equally among claimants
  for (const item of items) {
    subtotalAll += item.price_cents;
    if (item.claimed_by.length === 0) continue;

    const baseShare = Math.floor(item.price_cents / item.claimed_by.length);
    let remainder = item.price_cents % item.claimed_by.length;

    for (let i = 0; i < item.claimed_by.length; i++) {
      const userId = item.claimed_by[i];
      const user = getOrInitUser(userId);
      
      let share = baseShare;
      // Distribute remainder
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      user.subtotal_cents += share;
    }
  }

  const users = Array.from(userMap.values());

  if (subtotalAll === 0 || users.length === 0) {
    return users;
  }

  // 2. Proportional Tax & Tip
  let allocatedTax = 0;
  let allocatedTip = 0;

  for (const user of users) {
    const ratio = user.subtotal_cents / subtotalAll;
    
    user.tax_cents = Math.round(ratio * taxCents);
    allocatedTax += user.tax_cents;

    user.tip_cents = Math.round(ratio * tipCents);
    allocatedTip += user.tip_cents;
  }

  // 3. The Rogue Cent Returns (Tax)
  let taxRemainder = taxCents - allocatedTax;
  if (taxRemainder !== 0) {
    // Sort users by subtotal descending to distribute remainder to those who paid most
    users.sort((a, b) => b.subtotal_cents - a.subtotal_cents);
    
    let i = 0;
    while (taxRemainder > 0) {
      users[i % users.length].tax_cents += 1;
      taxRemainder -= 1;
      i++;
    }
    while (taxRemainder < 0) {
      if (users[i % users.length].tax_cents > 0) {
        users[i % users.length].tax_cents -= 1;
        taxRemainder += 1;
      }
      i++;
    }
  }

  // 4. The Rogue Cent Returns (Tip)
  let tipRemainder = tipCents - allocatedTip;
  if (tipRemainder !== 0) {
    users.sort((a, b) => b.subtotal_cents - a.subtotal_cents);
    
    let i = 0;
    while (tipRemainder > 0) {
      users[i % users.length].tip_cents += 1;
      tipRemainder -= 1;
      i++;
    }
    while (tipRemainder < 0) {
      if (users[i % users.length].tip_cents > 0) {
        users[i % users.length].tip_cents -= 1;
        tipRemainder += 1;
      }
      i++;
    }
  }

  // 5. Calculate totals
  for (const user of users) {
    user.total_cents = user.subtotal_cents + user.tax_cents + user.tip_cents;
  }

  return users;
}
