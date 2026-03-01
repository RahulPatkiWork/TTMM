import { simplifyDebts, Debt } from './src/lib/algorithms/settlement.js';
import { splitEqually } from './src/lib/algorithms/split.js';

console.log("==========================================");
console.log("TTMM - Settlement Engine Verification Test");
console.log("==========================================\n");

// -----------------------------------------------------------------------------
// Scenario A: Cyclical Debt
// -----------------------------------------------------------------------------
console.log("--- Scenario A (Cyclical Debt) ---");
const cyclicalDebts: Debt[] = [
  { from: 'A', to: 'B', amount: 1000 },
  { from: 'B', to: 'C', amount: 1000 },
  { from: 'C', to: 'A', amount: 1000 },
];

const simplifiedCyclical = simplifyDebts(cyclicalDebts);
console.log("Input:", cyclicalDebts);
console.log("Output:", simplifiedCyclical);
console.log("Expected: 0 transactions");

const passedA = simplifiedCyclical.length === 0;
console.log("Result:", passedA ? "✅ PASS" : "❌ FAIL");


// -----------------------------------------------------------------------------
// Scenario B: The Rogue Cent
// -----------------------------------------------------------------------------
console.log("\n--- Scenario B (The Rogue Cent) ---");
// A pays 1000 for a group of 3 (A, B, C). Split equally.
const splitDebts = splitEqually(1000, 'A', ['A', 'B', 'C']);
const simplifiedSplit = simplifyDebts(splitDebts);

console.log("Input (Raw Splits):", splitDebts);
console.log("Output (Settled):", simplifiedSplit);
console.log("Expected: B owes A 333, C owes A 333");

const passedB = 
  simplifiedSplit.length === 2 && 
  simplifiedSplit.some(d => d.from === 'B' && d.to === 'A' && d.amount === 333) &&
  simplifiedSplit.some(d => d.from === 'C' && d.to === 'A' && d.amount === 333);
  
console.log("Result:", passedB ? "✅ PASS" : "❌ FAIL");

if (passedA && passedB) {
  console.log("\n🎉 All tests passed! The math works.");
} else {
  console.log("\n⚠️ Some tests failed. Please review the algorithm.");
  process.exit(1);
}
