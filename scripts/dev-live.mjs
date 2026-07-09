import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bridge = spawn(
  process.execPath,
  [path.join(root, 'scripts/agent-bridge.mjs')],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  }
);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontend = spawn(npm, ['run', 'dev'], {
  cwd: root,
  env: {
    ...process.env,
    VITE_HAL_AGENT_WS_URL:
      process.env.VITE_HAL_AGENT_WS_URL ||
      'ws://127.0.0.1:8765/hal-agent-events',
  },
  stdio: 'inherit',
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  bridge.kill('SIGTERM');
  frontend.kill('SIGTERM');
  setTimeout(() => process.exit(code), 500).unref();
}

bridge.on('exit', code => {
  if (!stopping && code) stop(code);
});
frontend.on('exit', code => {
  if (!stopping) stop(code || 0);
});
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
