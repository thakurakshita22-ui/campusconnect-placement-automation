// run-dev.js - Concurrently launches backend server (port 5000) and frontend Vite client (port 5173)
const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '   CampusConnect - College Placement System Launcher   ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

// On Windows, use npm.cmd
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('\x1b[33m%s\x1b[0m', '[1/2] Starting Node.js Express Backend on port 5000...');
const serverProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
});

console.log('\x1b[32m%s\x1b[0m', '[2/2] Starting Vite Frontend on port 5173...');
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nStopping servers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
