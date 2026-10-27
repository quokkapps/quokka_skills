#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
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

function copyDir(src, dest, skip = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (skip.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Relative paths of every file under dir.
function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? listFiles(path.join(dir, e.name), path.join(prefix, e.name))
      : [path.join(prefix, e.name)]
  );
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
const hooksDest = path.join(claudeDir, 'hooks');
const settingsPath = path.join(claudeDir, 'settings.json');

// /quokka:cr must work from any folder, so its command, skill and the shipped
// project files install globally. QUOKKA_HOME overrides the home dir (tests).
// The command and skill go to Claude's user config dir: CLAUDE_CONFIG_DIR when
// set (e.g. CCS instances), otherwise ~/.claude.
const GLOBAL_COMMANDS = ['cr.md'];
const GLOBAL_SKILLS = ['quokka-cr'];
const globalRoot = process.env.QUOKKA_HOME || os.homedir();
const globalClaudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(globalRoot, '.claude');
const globalCommandsDest = path.join(globalClaudeDir, 'commands', 'quokka');
const globalSkillsDest = path.join(globalClaudeDir, 'skills');
const projectsSrc = path.join(packageRoot, 'projects');
const globalProjectsDest = path.join(globalRoot, '.quokka', 'cr', 'projects');
// One marker for the shared project files, one per Claude config dir for the
// command + skill, so each CCS instance updates on its own.
const globalVersionFile = path.join(globalRoot, '.quokka', 'cr', '.version');
const globalCrVersionFile = path.join(globalCommandsDest, '.cr-version');
const globalVersionFiles = [globalVersionFile, globalCrVersionFile];

// Items earlier versions installed per project and this one no longer ships.
// Removed on install and uninstall so an update leaves nothing stale behind.
const RETIRED_COMMANDS = ['port-feature.md', 'port-gsd-feature.md'];
const RETIRED_HOOK_SCRIPTS = ['quokka-knowledge-summary.sh', 'quokka-knowledge-worker.sh'];
const RETIRED_HOOK_MARKER = 'quokka-knowledge-summary.sh';

// Names of the skill directories this package ships (used for clean uninstall).
function shippedSkillNames() {
  if (!fs.existsSync(skillsSrc)) return [];
  return fs
    .readdirSync(skillsSrc, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !GLOBAL_SKILLS.includes(e.name))
    .map((e) => e.name);
}

// Shipped project files (projects/*.json). Never includes the local/ registry.
const projectFiles = fs.existsSync(projectsSrc)
  ? fs.readdirSync(projectsSrc).filter((f) => f.endsWith('.json'))
  : [];

function globalInstalled() {
  const current = (f) => fs.existsSync(f) && fs.readFileSync(f, 'utf-8').trim() === pkg.version;
  if (!globalVersionFiles.every(current)) return false;
  return (
    GLOBAL_COMMANDS.every((f) => fs.existsSync(path.join(globalCommandsDest, f))) &&
    GLOBAL_SKILLS.every((n) =>
      listFiles(path.join(skillsSrc, n)).every((rel) => fs.existsSync(path.join(globalSkillsDest, n, rel)))
    ) &&
    projectFiles.every((f) => fs.existsSync(path.join(globalProjectsDest, f)))
  );
}

function installGlobal() {
  fs.mkdirSync(globalCommandsDest, { recursive: true });
  for (const f of GLOBAL_COMMANDS) {
    fs.copyFileSync(path.join(commandsSrc, f), path.join(globalCommandsDest, f));
  }
  for (const n of GLOBAL_SKILLS) {
    removeDir(path.join(globalSkillsDest, n));
    copyDir(path.join(skillsSrc, n), path.join(globalSkillsDest, n));
  }
  fs.mkdirSync(globalProjectsDest, { recursive: true });
  for (const f of projectFiles) {
    fs.copyFileSync(path.join(projectsSrc, f), path.join(globalProjectsDest, f));
  }
  for (const f of globalVersionFiles) fs.writeFileSync(f, pkg.version + '\n');
}

// Removes only what this package shipped; local/ and *.local.json stay.
function uninstallGlobal() {
  let removed = 0;
  const targets = [
    ...GLOBAL_COMMANDS.map((f) => path.join(globalCommandsDest, f)),
    ...GLOBAL_SKILLS.map((n) => path.join(globalSkillsDest, n)),
    ...projectFiles.map((f) => path.join(globalProjectsDest, f)),
  ];
  // removeDir also removes plain files.
  for (const p of targets) {
    if (removeDir(p)) removed++;
  }
  for (const f of globalVersionFiles) fs.rmSync(f, { force: true });
  return removed;
}

function readSettings() {
  if (!fs.existsSync(settingsPath)) return { settings: {}, ok: true };
  try {
    return { settings: JSON.parse(fs.readFileSync(settingsPath, 'utf-8')), ok: true };
  } catch (e) {
    return { settings: null, ok: false };
  }
}

// Removes retired commands, hook scripts and the old SessionEnd registration.
// Other settings and hooks are left alone.
function removeRetired() {
  let removed = 0;
  const targets = [
    ...RETIRED_COMMANDS.map((f) => path.join(commandsDest, f)),
    ...RETIRED_HOOK_SCRIPTS.map((f) => path.join(hooksDest, f)),
  ];
  for (const p of targets) {
    if (removeDir(p)) removed++;
  }
  const { settings, ok } = readSettings();
  const list = ok && settings && settings.hooks && settings.hooks.SessionEnd;
  if (Array.isArray(list)) {
    // Drop only our hook entries; a group goes only when nothing else is left in it.
    const isRetired = (h) => JSON.stringify(h).includes(RETIRED_HOOK_MARKER);
    const kept = list
      .map((group) =>
        Array.isArray(group.hooks) ? { ...group, hooks: group.hooks.filter((h) => !isRetired(h)) } : group
      )
      .filter((group) => !(Array.isArray(group.hooks) && group.hooks.length === 0));
    if (JSON.stringify(kept) !== JSON.stringify(list)) {
      if (kept.length) settings.hooks.SessionEnd = kept;
      else delete settings.hooks.SessionEnd;
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
      removed++;
    }
  }
  return removed;
}

function retiredPresent() {
  if (RETIRED_COMMANDS.some((f) => fs.existsSync(path.join(commandsDest, f)))) return true;
  if (RETIRED_HOOK_SCRIPTS.some((f) => fs.existsSync(path.join(hooksDest, f)))) return true;
  const { settings, ok } = readSettings();
  return Boolean(ok && settings && settings.hooks && JSON.stringify(settings.hooks).includes(RETIRED_HOOK_MARKER));
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
  const removedGlobal = uninstallGlobal();
  if (removedGlobal > 0) {
    console.log(`  ${green}✓${reset} Removed /quokka:cr global files (kept local projects)`);
  }
  if (removeRetired() > 0) {
    console.log(`  ${green}✓${reset} Removed retired port commands and session-summary hook`);
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

function commandsInstalled() {
  if (!fs.existsSync(commandsDest)) return false;
  const srcFiles = fs
    .readdirSync(commandsSrc)
    .filter((f) => f.endsWith('.md') && !GLOBAL_COMMANDS.includes(f));
  return srcFiles.every((f) => fs.existsSync(path.join(commandsDest, f)));
}

function skillsInstalled() {
  return shippedSkillNames().every((name) =>
    fs.existsSync(path.join(skillsDest, name, 'SKILL.md'))
  );
}

if (
  installedVersion === pkg.version &&
  commandsInstalled() &&
  skillsInstalled() &&
  !retiredPresent() &&
  globalInstalled()
) {
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

// Clean up what earlier versions installed and this one no longer ships,
// before listing the installed commands.
if (removeRetired() > 0) {
  console.log(`  ${green}✓${reset} Removed retired port commands and session-summary hook`);
}

// Install commands
copyDir(commandsSrc, commandsDest, GLOBAL_COMMANDS);
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

// Install /quokka:cr globally (command, skill, shipped project files).
installGlobal();
for (const f of GLOBAL_COMMANDS) console.log(`  ${green}✓${reset} global: ${path.join(globalCommandsDest, f)}`);
for (const n of GLOBAL_SKILLS) console.log(`  ${green}✓${reset} global: ${path.join(globalSkillsDest, n)}/`);
console.log(`  ${green}✓${reset} global: ${globalProjectsDest}/ (${projectFiles.join(', ')})`);

console.log(
  `\n${green}Installed ${cmdFiles.length} commands, ${skillNames.length} skills (v${pkg.version}).${reset}`
);
console.log(
  `${dim}Commands: ${cmdFiles
    .concat(GLOBAL_COMMANDS)
    .map((f) => '/quokka:' + f.replace('.md', ''))
    .join(', ')}${reset}`
);
console.log('');
