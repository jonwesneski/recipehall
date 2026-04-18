import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GenericContainer, Wait } from 'testcontainers';
import { pushSchema, seedE2eDb } from './helpers/db';

dotenv.config({ path: path.join(__dirname, '.env.e2e') });

const TMP_DIR = path.join(__dirname, '.tmp');
const CONTAINER_ID_FILE = path.join(TMP_DIR, 'container-id.txt');
const E2E_DB_PORT = 15432;

export default async function globalSetup() {
  console.log('\n[e2e] Starting PostgreSQL testcontainer...');

  const container = await new GenericContainer('postgres:13')
    .withExposedPorts({ container: 5432, host: E2E_DB_PORT })
    .withEnvironment({
      POSTGRES_USER: 'prisma',
      POSTGRES_PASSWORD: 'prisma',
      POSTGRES_DB: 'recipes-db',
    })
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  process.env.DATABASE_URL = `postgresql://prisma:prisma@${container.getHost()}:${E2E_DB_PORT}/recipes-db?schema=public`;
  console.log(`[e2e] DB ready at: ${process.env.DATABASE_URL}`);

  // Small buffer for the container to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 1000));

  pushSchema();
  await seedE2eDb();

  // Persist the container ID so global-teardown can stop it.
  // Setup and teardown run in separate Node processes — env vars don't survive.
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
  fs.writeFileSync(CONTAINER_ID_FILE, container.getId());

  console.log('[e2e] Setup complete.');
}
