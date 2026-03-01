import { Debt } from './settlement.js';

/**
 * Splits an expense equally among participants.
 * Handles the "Rogue Cent" by ensuring the payer absorbs the remainder to balance the ledger.
 */
export function splitEqually(totalAmountCents: number, payerId: string, participantIds: string[]): Debt[] {
  const numParticipants = participantIds.length;
  const baseShare = Math.floor(totalAmountCents / numParticipants);
  const remainder = totalAmountCents % numParticipants;

  const debts: Debt[] = [];

  for (let i = 0; i < numParticipants; i++) {
    const participant = participantIds[i];
    
    // Payer doesn't owe themselves
    if (participant === payerId) {
      continue;
    }
    
    let share = baseShare;
    
    // If the payer is NOT in the group, we must distribute the remainder 
    // to someone else so the total owed equals the total amount paid.
    if (!participantIds.includes(payerId) && i < remainder) {
      share += 1;
    }
    
    // If the payer IS in the group, they absorb the remainder by default
    // because we only charge the others the baseShare.
    // E.g. A pays 1000 for A, B, C. baseShare = 333.
    // B owes 333, C owes 333. A absorbs the remaining 334.

    debts.push({
      from: participant,
      to: payerId,
      amount: share,
    });
  }

  return debts;
}
