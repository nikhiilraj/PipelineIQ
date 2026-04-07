import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env['DATABASE_URL_DIRECT'] ?? process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL_DIRECT (or DATABASE_URL) must be set in .env');

export default defineConfig({
  // List individual schema files explicitly — avoids drizzle-kit following .js re-exports
  schema: [
    './src/db/schema/users.ts',
    './src/db/schema/workspaces.ts',
    './src/db/schema/github.ts',
    './src/db/schema/repositories.ts',
    './src/db/schema/pipeline.ts',
    './src/db/schema/dora.ts',
    './src/db/schema/alerts.ts',
  ],
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: false,
});
