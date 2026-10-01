# Anuradha TMS - Database Project

Owns the MySQL schema for the Transport Management System exclusively.
Independent from the backend and frontend projects - versioned and deployed
on its own lifecycle.

## Responsibilities
- Schema definition via `sequelize-cli` migrations (source of truth)
- Seed data for lookup tables (roles, permissions) and initial admin user
- Environment-based connection config (dev/test/prod)

## Setup

```bash
cp .env.example .env
# edit .env with your MySQL credentials
npm install
npm run db:create
npm run migrate
npm run seed
```

## Current Modules (Module 1: Auth & User Management)

| Table | Purpose |
|---|---|
| `roles` | System roles (SUPER_ADMIN, ADMIN, DRIVER) |
| `permissions` | Fine-grained `module:action` permissions |
| `role_permissions` | Many-to-many mapping, RBAC |
| `users` | System users with soft delete, audit fields |
| `refresh_tokens` | JWT refresh token rotation/revocation tracking |
| `audit_logs` | Generic audit trail for all entities |

## Module 2: Customers, Drivers, Trips

| Table | Purpose |
|---|---|
| `customers` | Client companies (e.g. Browns Group Sri Lanka) transport is outsourced for |
| `drivers` | Driver profiles; `user_id` optionally links to a `users` login account (role DRIVER) |
| `trips` | Trip records: customer, assigned driver, origin/destination, schedule, status |
| `trip_stops` | Ordered delivery stops within a trip (`sequence_no`), each with its own status |

Default seeded admin (change immediately in production):
- email: `admin@anuradhatransport.lk`
- password: `ChangeMe@123`

## Scripts
See `scripts/README.md` and `package.json` for available commands
(`migrate`, `migrate:undo`, `seed`, `seed:undo`, `reset`, etc.)

## Adding a new module
1. `npm run migration:generate -- create-<table>`
2. Fill in `up`/`down` with proper FKs, indexes, constraints, soft delete/audit fields as needed
3. Add seeders if lookup data is required
4. Run `npm run migrate`
5. Document the table in this README
