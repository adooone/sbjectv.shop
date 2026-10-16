// Applies pending migrations from ./drizzle to DATABASE_URL and exits.
// `createDb` already runs this on startup, so this script is for CI/ops use.
import { createDb } from './client';

createDb();
console.log('Migrations applied.');
