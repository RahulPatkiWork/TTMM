import { calculateItemizedSplits, ReceiptItem } from './src/utils/itemizedSplitLogic.js';

console.log("==========================================");
console.log("TTMM - Itemized Split Math Verification Test");
console.log("==========================================\n");

// Scenario: Mock receipt with ₹500 item, ₹100 item, and ₹60 tax.
// Total subtotal = 600.
// Tax = 60.
// A claims ₹500 item. B claims ₹100 item.
// Expected: A's tax = 50, B's tax = 10.

const items: ReceiptItem[] = [
  { id: 'item_1', name: 'Pizza', price_cents: 50000, claimed_by: ['user_a'] },
  { id: 'item_2', name: 'Coke', price_cents: 10000, claimed_by: ['user_b'] }
];

const taxCents = 6000;
const tipCents = 0;

const splits = calculateItemizedSplits(items, taxCents, tipCents, 'user_a');

console.log("Input Items:");
console.log(items.map(i => `${i.name}: ${i.price_cents} claimed by ${i.claimed_by.join(', ')}`));
console.log(`Tax: ${taxCents}, Tip: ${tipCents}\n`);

console.log("Output Splits:");
splits.forEach(s => {
  console.log(`User: ${s.user_id} | Subtotal: ${s.subtotal_cents} | Tax: ${s.tax_cents} | Tip: ${s.tip_cents} | Total: ${s.total_cents}`);
});

const userA = splits.find(s => s.user_id === 'user_a');
const userB = splits.find(s => s.user_id === 'user_b');

const passed = userA?.tax_cents === 5000 && userB?.tax_cents === 1000;

console.log(`\nExpected: A's tax = 5000, B's tax = 1000`);
console.log("Result:", passed ? "✅ PASS" : "❌ FAIL");
