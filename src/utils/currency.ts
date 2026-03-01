export function formatCurrency(cents: number): string {
  const isNegative = cents < 0;
  const absoluteCents = Math.abs(cents);
  const formatted = (absoluteCents / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return isNegative ? `-${formatted}` : formatted;
}
