#!/usr/bin/env node

const fs = require('fs');
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
const hooksSrc = path.join(packageRoot, 'hooks');
const hooksDest = path.join(claudeDir, 'hooks');
const settingsPath = path.join(claudeDir, 'settings.json');

// The SessionEnd knowledge-base hook. The dispatcher command is the stable
// identity used for idempotent install/uninstall in settings.json.
const KB_HOOK_SCRIPT = 'quokka-knowledge-summary.sh';
const KB_HOOK_COMMAND = `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/${KB_HOOK_SCRIPT}"`;

// Names of the skill directories this package ships (used for clean uninstall).
function shippedSkillNames() {
  if (!fs.existsSync(skillsSrc)) return [];
  return fs
    .readdirSync(skillsSrc, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// Names of the hook scripts this package ships.
function shippedHookScripts() {
  if (!fs.existsSync(hooksSrc)) return [];
  return fs
    .readdirSync(hooksSrc, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.sh'))
    .map((e) => e.name);
}

function readSettings() {
  if (!fs.existsSync(settingsPath)) return { settings: {}, ok: true };
  try {
    return { settings: JSON.parse(fs.readFileSync(settingsPath, 'utf-8')), ok: true };
  } catch (e) {
    return { settings: null, ok: false };
  }
}

function writeSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

function sessionEndHasKbHook(settings) {
  const list = settings && settings.hooks && settings.hooks.SessionEnd;
  if (!Array.isArray(list)) return false;
  return JSON.stringify(list).includes(KB_HOOK_SCRIPT);
}

// ── Install ───────────────────────────────────────────────────────────────

function installHooks() {
  const scripts = shippedHookScripts();
  if (scripts.length === 0) return { installed: [], registered: false, warned: false };

  copyDir(hooksSrc, hooksDest);
  for (const name of scripts) {
    fs.chmodSync(path.join(hooksDest, name), 0o755);
  }

  // Register the SessionEnd hook in settings.json (idempotent, non-destructive).
  const { settings, ok } = readSettings();
  if (!ok) {
    return { installed: scripts, registered: false, warned: true };
  }
  let registered = false;
  if (!sessionEndHasKbHook(settings)) {
    settings.hooks = settings.hooks || {};
    settings.hooks.SessionEnd = settings.hooks.SessionEnd || [];
    settings.hooks.SessionEnd.push({
      hooks: [
        {
          type: 'command',
          command: KB_HOOK_COMMAND,
          timeout: 15,
          statusMessage: 'Recording session to knowledge base...',
        },
      ],
    });
    writeSettings(settings);
    registered = true;
  }
  return { installed: scripts, registered, warned: false };
}

// ── Uninstall ───────────────────────────────────────────────────────────────

function uninstallHooks() {
  let removedScripts = 0;
  for (const name of shippedHookScripts()) {
    const p = path.join(hooksDest, name);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true });
      removedScripts++;
    }
  }
  // Remove the SessionEnd registration we added.
  const { settings, ok } = readSettings();
  let unregistered = false;
  if (ok && settings && settings.hooks && Array.isArray(settings.hooks.SessionEnd)) {
    const before = settings.hooks.SessionEnd.length;
    settings.hooks.SessionEnd = settings.hooks.SessionEnd.filter(
      (group) => !JSON.stringify(group).includes(KB_HOOK_SCRIPT)
    );
    if (settings.hooks.SessionEnd.length !== before) unregistered = true;
    if (settings.hooks.SessionEnd.length === 0) delete settings.hooks.SessionEnd;
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    if (unregistered) writeSettings(settings);
  }
  return { removedScripts, unregistered };
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
  const { removedScripts, unregistered } = uninstallHooks();
  if (removedScripts > 0) {
    console.log(`  ${green}✓${reset} Removed ${removedScripts} hook script(s)`);
  }
  if (unregistered) {
    console.log(`  ${green}✓${reset} Removed SessionEnd hook from settings.json`);
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
  const srcFiles = fs.readdirSync(commandsSrc).filter((f) => f.endsWith('.md'));
  return srcFiles.every((f) => fs.existsSync(path.join(commandsDest, f)));
}

function skillsInstalled() {
  return shippedSkillNames().every((name) =>
    fs.existsSync(path.join(skillsDest, name, 'SKILL.md'))
  );
}

function hooksInstalled() {
  const scripts = shippedHookScripts();
  if (scripts.length === 0) return true;
  const filesPresent = scripts.every((name) => fs.existsSync(path.join(hooksDest, name)));
  const { settings, ok } = readSettings();
  // If settings can't be parsed we can't confirm registration — treat as not
  // installed so the run re-attempts (and surfaces the warning).
  return filesPresent && ok && sessionEndHasKbHook(settings);
}

if (
  installedVersion === pkg.version &&
  commandsInstalled() &&
  skillsInstalled() &&
  hooksInstalled()
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

// Install the SessionEnd knowledge-base hook (scripts + settings.json wiring).
const hookResult = installHooks();
for (const name of hookResult.installed) {
  console.log(`  ${green}✓${reset} hooks/${name}`);
}
if (hookResult.registered) {
  console.log(`  ${green}✓${reset} Registered SessionEnd hook in settings.json`);
} else if (hookResult.warned) {
  console.log(
    `  ${yellow}!${reset} Could not parse .claude/settings.json — add this SessionEnd hook manually:`
  );
  console.log(`    ${dim}${KB_HOOK_COMMAND}${reset}`);
} else if (hookResult.installed.length > 0) {
  console.log(`  ${dim}SessionEnd hook already registered${reset}`);
}

console.log(
  `\n${green}Installed ${cmdFiles.length} commands, ${skillNames.length} skills, ${hookResult.installed.length} hooks (v${pkg.version}).${reset}`
);
console.log(
  `${dim}Commands: ${cmdFiles
    .map((f) => '/quokka:' + f.replace('.md', ''))
    .join(', ')}${reset}`
);
if (hookResult.installed.length > 0) {
  console.log(
    `${dim}Session summaries will be written to knowledge-base/ when a session ends.${reset}`
  );
}
console.log('');
