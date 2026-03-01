async function test() {
  const payload = {
    id: 'test_expense_1',
    group_id: 'group_1',
    payer_id: 'user_a',
    description: 'Test Dinner',
    amount_cents: 1000,
    splits: [
      { id: 'split_1', user_id: 'user_a', amount_cents: 334 },
      { id: 'split_2', user_id: 'user_b', amount_cents: 333 },
      { id: 'split_3', user_id: 'user_c', amount_cents: 333 }
    ]
  };

  console.log('Testing valid split (1000 cents -> 334, 333, 333)...');
  const res1 = await fetch('http://localhost:3000/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Valid split response:', await res1.json());

  const invalidPayload = {
    ...payload,
    id: 'test_expense_2',
    amount_cents: 1000,
    splits: [
      { id: 'split_4', user_id: 'user_a', amount_cents: 333 },
      { id: 'split_5', user_id: 'user_b', amount_cents: 333 },
      { id: 'split_6', user_id: 'user_c', amount_cents: 333 }
    ]
  };

  console.log('\nTesting invalid split (1000 cents -> 333, 333, 333)...');
  const res2 = await fetch('http://localhost:3000/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload)
  });
  console.log('Invalid split response:', res2.status, await res2.json());
}
test();
