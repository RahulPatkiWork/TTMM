import { db } from '../lib/db/index.js';
import { randomUUID } from 'crypto';

export function seedDatabase() {
  const usersCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (usersCount.count > 0) return;

  console.log('Seeding database with initial data...');

  const userA = 'user_a';
  const userB = 'user_b';
  const userC = 'user_c';
  const groupId = 'group_1';

  const insertUser = db.prepare('INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)');
  insertUser.run(userA, 'Alice', 'alice@ttmm.app', Date.now());
  insertUser.run(userB, 'Bob', 'bob@ttmm.app', Date.now());
  insertUser.run(userC, 'Charlie', 'charlie@ttmm.app', Date.now());

  const insertGroup = db.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)');
  insertGroup.run(groupId, 'Goa Trip', Date.now());

  const insertGroupMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
  insertGroupMember.run(groupId, userA);
  insertGroupMember.run(groupId, userB);
  insertGroupMember.run(groupId, userC);

  // Add some initial debts
  // Alice owes Bob 500
  // Bob owes Charlie 1000
  // Charlie owes Alice 200
  const insertDebt = db.prepare('INSERT INTO debts (debtor_id, creditor_id, group_id, amount_cents) VALUES (?, ?, ?, ?)');
  insertDebt.run(userA, userB, groupId, 50000); // 500.00
  insertDebt.run(userB, userC, groupId, 100000); // 1000.00
  insertDebt.run(userC, userA, groupId, 20000); // 200.00

  console.log('Database seeded successfully.');
}
