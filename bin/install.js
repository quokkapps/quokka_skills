#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

const args = process.argv.slice(2);
const hasUninstall = args.includes('--uninstall') || args.includes('-u');

// Find the .claude directory — walk up from cwd
function findClaudeDir() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const claudeDir = path.join(dir, '.claude');
    if (fs.existsSync(claudeDir)) return claudeDir;
    dir = path.dirname(dir);
  }
  // Default to cwd/.claude
  return path.join(process.cwd(), '.claude');
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

console.log(`\n${cyan}Quokka AI${reset} v${pkg.version}\n`);

const claudeDir = findClaudeDir();
const commandsDest = path.join(claudeDir, 'commands', 'quokka');
const packageRoot = path.resolve(__dirname, '..');
const commandsSrc = path.join(packageRoot, 'commands', 'quokka');

if (hasUninstall) {
  console.log('Uninstalling...');
  if (removeDir(commandsDest)) {
    console.log(`  ${green}✓${reset} Removed commands/quokka/`);
  } else {
    console.log(`  ${dim}Nothing to remove${reset}`);
  }
  console.log(`\n${green}Uninstalled.${reset}\n`);
  process.exit(0);
}

// Install
console.log('Installing commands...');

if (!fs.existsSync(commandsSrc)) {
  console.error(`${red}✘${reset} Source commands not found at ${commandsSrc}`);
  process.exit(1);
}

copyDir(commandsSrc, commandsDest);

const files = fs.readdirSync(commandsDest).filter(f => f.endsWith('.md'));
for (const file of files) {
  console.log(`  ${green}✓${reset} commands/quokka/${file}`);
}

console.log(`\n${green}Installed ${files.length} commands.${reset}`);
console.log(`${dim}Commands available: ${files.map(f => '/quokka:' + f.replace('.md', '')).join(', ')}${reset}\n`);
