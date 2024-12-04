import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killProcessOnPorts(startPort: number, endPort: number) {
  try {
    // On macOS, use lsof to find processes
    const { stdout } = await execAsync(
      `lsof -i TCP:${startPort}-${endPort} -t`
    );

    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          console.log(`Killed process ${pid}`);
        } catch (error) {
          console.log(`Failed to kill process ${pid}`);
        }
      }
    }
  } catch (error) {
    // If lsof returns no results, it will exit with code 1
    if (error.code !== 1) {
      console.error('Error cleaning up ports:', error);
    }
  }
}

async function main() {
  await killProcessOnPorts(3000, 3005);
}

main().catch(console.error); 