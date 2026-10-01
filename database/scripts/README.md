# Database Scripts

Helper npm scripts (see package.json) wrap `sequelize-cli` so migrations/seeders
are run consistently across environments.

- `npm run migrate` - apply all pending migrations
- `npm run migrate:undo` - revert the last migration
- `npm run seed` - run all seeders
- `npm run seed:undo` - revert all seeders
- `npm run reset` - undo all migrations, re-migrate, re-seed (dev only)

This project owns the MySQL schema exclusively. The backend API connects to
the resulting schema via Sequelize models but never calls `sync()` or
generates migrations itself.
