# TTMM - Master Architecture & Schema

## Domain Constraints

- **The Rogue Cent (No Floats):** Currency MUST NOT be stored as floats. All amounts are stored in the database as `Integers` (cents).
- **Graph Settlement Algorithm:** Uses a Greedy Graph Algorithm to simplify debts.
- **Client-Side Trust:** AVOID. All splits are validated in the Node.js backend to ensure `sum(splits) == total_cost`.
- **Relational Joins for Debts:** AVOID. Rely entirely on the Graph Settlement Algorithm.
- **Aesthetic:** Clean fintech aesthetic. Primary `#10B981` (Emerald), Background `#F9FAFB`, and `tabular-nums` for financial digits.

## Database Schema (SQLite)

### `users`

- `id` (TEXT, Primary Key)
- `name` (TEXT)
- `email` (TEXT, Unique)
- `created_at` (INTEGER)

### `groups`

- `id` (TEXT, Primary Key)
- `name` (TEXT)
- `created_at` (INTEGER)

### `group_members`

- `group_id` (TEXT, Foreign Key -> groups.id)
- `user_id` (TEXT, Foreign Key -> users.id)
- PRIMARY KEY (`group_id`, `user_id`)

### `expenses`

- `id` (TEXT, Primary Key)
- `group_id` (TEXT, Foreign Key -> groups.id)
- `payer_id` (TEXT, Foreign Key -> users.id)
- `description` (TEXT)
- `amount_cents` (INTEGER)
- `location_lat` (REAL, Nullable)
- `location_lng` (REAL, Nullable)
- `location_name` (TEXT, Nullable)
- `receipt_url` (TEXT, Nullable)
- `created_at` (INTEGER)

### `expense_splits`

- `id` (TEXT, Primary Key)
- `expense_id` (TEXT, Foreign Key -> expenses.id)
- `user_id` (TEXT, Foreign Key -> users.id)
- `amount_cents` (INTEGER)

### `debts` (Derived from Settlement Algorithm)

- `debtor_id` (TEXT, Foreign Key -> users.id)
- `creditor_id` (TEXT, Foreign Key -> users.id)
- `group_id` (TEXT, Foreign Key -> groups.id)
- `amount_cents` (INTEGER)
- PRIMARY KEY (`debtor_id`, `creditor_id`, `group_id`)
