#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  return path.join(process.cwd(), '.claude');
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
const packageRoot = path.resolve(__dirname, '..');

const commandsSrc = path.join(packageRoot, 'commands', 'quokka');
const commandsDest = path.join(claudeDir, 'commands', 'quokka');
const skillsSrc = path.join(packageRoot, 'skills');
const skillsDest = path.join(claudeDir, 'skills');

// Names of the skill directories this package ships (used for clean uninstall).
function shippedSkillNames() {
  if (!fs.existsSync(skillsSrc)) return [];
  return fs
    .readdirSync(skillsSrc, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

if (hasUninstall) {
  console.log('Uninstalling...');
  if (removeDir(commandsDest)) {
    console.log(`  ${green}✓${reset} Removed commands/quokka/`);
  } else {
    console.log(`  ${dim}Nothing to remove (commands)${reset}`);
  }
  for (const name of shippedSkillNames()) {
    if (removeDir(path.join(skillsDest, name))) {
      console.log(`  ${green}✓${reset} Removed skills/${name}/`);
    }
  }
  console.log(`\n${green}Uninstalled.${reset}\n`);
  process.exit(0);
}

// Version file tracks installed version
const versionFile = path.join(commandsDest, '.version');
let installedVersion = null;
if (fs.existsSync(versionFile)) {
  installedVersion = fs.readFileSync(versionFile, 'utf-8').trim();
}

if (installedVersion === pkg.version) {
  console.log(`${green}Already up to date.${reset} (v${pkg.version})\n`);
  process.exit(0);
}

if (installedVersion) {
  console.log(`Updating from v${installedVersion} to v${pkg.version}...\n`);
} else {
  console.log('Installing...\n');
}

if (!fs.existsSync(commandsSrc)) {
  console.error(`${red}✘${reset} Source commands not found at ${commandsSrc}`);
  process.exit(1);
}

// Install commands
copyDir(commandsSrc, commandsDest);
fs.writeFileSync(versionFile, pkg.version + '\n');
const cmdFiles = fs.readdirSync(commandsDest).filter((f) => f.endsWith('.md'));
for (const file of cmdFiles) {
  console.log(`  ${green}✓${reset} commands/quokka/${file}`);
}

// Install skills (each skill is a directory containing SKILL.md). Optional — a
// package with no skills/ source simply skips this block.
const skillNames = shippedSkillNames();
for (const name of skillNames) {
  copyDir(path.join(skillsSrc, name), path.join(skillsDest, name));
  console.log(`  ${green}✓${reset} skills/${name}/`);
}

console.log(
  `\n${green}Installed ${cmdFiles.length} commands, ${skillNames.length} skills (v${pkg.version}).${reset}`
);
console.log(
  `${dim}Commands: ${cmdFiles
    .map((f) => '/quokka:' + f.replace('.md', ''))
    .join(', ')}${reset}\n`
);
