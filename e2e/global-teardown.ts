import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const CONTAINER_ID_FILE = path.join(__dirname, '.tmp', 'container-id.txt');

export default async function globalTeardown() {
  if (!fs.existsSync(CONTAINER_ID_FILE)) {
    return;
  }

  const containerId = fs.readFileSync(CONTAINER_ID_FILE, 'utf-8').trim();
  if (containerId) {
    console.log(`\n[e2e] Stopping container ${containerId}...`);
    try {
      execSync(`docker stop ${containerId} && docker rm ${containerId}`, {
        stdio: 'inherit',
      });
    } catch {
      // Container may have already been removed; ignore the error
    }
  }

  fs.rmSync(CONTAINER_ID_FILE, { force: true });
}
