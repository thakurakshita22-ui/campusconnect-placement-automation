// package-project.js - Packages the project cleanly for sharing on other Windows laptops
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const stageDir = path.join(rootDir, '.pkg_stage', 'CampusConnect-Placement-System');
const zipOutput = path.join(rootDir, 'CampusConnect-Placement-System.zip');

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.pkg_stage',
  '.env',
  '.DS_Store',
  'Thumbs.db',
  'CampusConnect-Placement-System.zip',
  'College-Placement-Automation.zip',
];

function shouldIgnore(name) {
  return IGNORE_PATTERNS.some((pattern) => name === pattern || name.endsWith('.log'));
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('====================================================');
console.log('   CampusConnect - Windows Project Packager         ');
console.log('====================================================\n');

try {
  // Clean staging
  if (fs.existsSync(path.join(rootDir, '.pkg_stage'))) {
    fs.rmSync(path.join(rootDir, '.pkg_stage'), { recursive: true, force: true });
  }
  if (fs.existsSync(zipOutput)) {
    fs.rmSync(zipOutput, { force: true });
  }

  console.log('[1/3] Gathering clean source files (excluding node_modules & secrets)...');
  copyDirRecursive(rootDir, stageDir);

  console.log('[2/3] Compressing into shareable ZIP archive...');
  const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(rootDir, '.pkg_stage', '*')}' -DestinationPath '${zipOutput}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  // Clean staging
  fs.rmSync(path.join(rootDir, '.pkg_stage'), { recursive: true, force: true });

  const stats = fs.statSync(zipOutput);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  const sizeKb = (stats.size / 1024).toFixed(1);

  console.log('[3/3] Done!');
  console.log('\n====================================================');
  console.log(` Package Created Successfully:`);
  console.log(` File: CampusConnect-Placement-System.zip`);
  console.log(` Size: ${sizeMb > 1 ? sizeMb + ' MB' : sizeKb + ' KB'}`);
  console.log('====================================================\n');
  console.log('Your friend can unzip this file on their laptop and run:');
  console.log('  1. setup.bat   (installs dependencies)');
  console.log('  2. start.bat   (launches app & opens browser)\n');
} catch (err) {
  console.error('[ERROR] Packaging failed:', err.message);
  process.exit(1);
}
