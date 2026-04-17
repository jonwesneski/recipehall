import { execSync } from 'child_process';
import * as path from 'path';

export const E2E_USER = {
  email: 'e2e@test.com',
  name: 'E2E User',
  handle: 'e2euser',
};

export function pushSchema() {
  const dbDir = path.join(__dirname, '..', '..', 'packages', 'database');
  console.log(`Running prisma db push in: ${dbDir}`);
  execSync('pnpm prisma db push', {
    stdio: 'inherit',
    cwd: dbDir,
    env: { ...process.env },
  });
}

export async function seedE2eDb() {
  // Import after DATABASE_URL is set in process.env so the PrismaPg adapter
  // picks up the testcontainer URL rather than any placeholder from .env.e2e
  const { prisma } = await import('@repo/database');

  try {
    await prisma.user.upsert({
      where: { email: E2E_USER.email },
      update: {},
      create: {
        email: E2E_USER.email,
        name: E2E_USER.name,
        handle: E2E_USER.handle,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
