#!/usr/bin/env node
// Plain-assert integration test for bin/install.js — no test framework.
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

// 1. Make a throwaway "project" with a .claude dir to install into.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qst-'));
fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });

// 2. Run the installer with cwd = tmp project.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js')], {
  cwd: tmp,
  stdio: 'pipe',
});

// 3. Commands still install (regression).
const cmd = path.join(tmp, '.claude', 'commands', 'quokka', 'port-feature.md');
assert.ok(fs.existsSync(cmd), 'expected commands/quokka/port-feature.md to be installed');

// 4. Skills now install too (the new behavior).
const skill = path.join(tmp, '.claude', 'skills', 'quokka-feature-test-design', 'SKILL.md');
assert.ok(fs.existsSync(skill), 'expected skills/quokka-feature-test-design/SKILL.md to be installed');

// 4b. Hook scripts install and are executable.
const hookScript = path.join(tmp, '.claude', 'hooks', 'quokka-knowledge-summary.sh');
assert.ok(fs.existsSync(hookScript), 'expected hooks/quokka-knowledge-summary.sh to be installed');
assert.ok((fs.statSync(hookScript).mode & 0o100) !== 0, 'hook script should be executable');

// 4c. SessionEnd hook is registered in settings.json.
const settingsPath = path.join(tmp, '.claude', 'settings.json');
assert.ok(fs.existsSync(settingsPath), 'expected settings.json to be created');
let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
assert.ok(
  JSON.stringify(settings.hooks.SessionEnd).includes('quokka-knowledge-summary.sh'),
  'expected SessionEnd hook registered in settings.json'
);

// 4d. Re-running the installer does NOT duplicate the SessionEnd entry (idempotent).
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js')], { cwd: tmp, stdio: 'pipe' });
settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const kbEntries = settings.hooks.SessionEnd.filter((g) =>
  JSON.stringify(g).includes('quokka-knowledge-summary.sh')
);
assert.strictEqual(kbEntries.length, 1, 'SessionEnd hook should be registered exactly once');

// 5. Uninstall removes commands, skills, hook scripts, and the settings entry.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js'), '--uninstall'], {
  cwd: tmp,
  stdio: 'pipe',
});
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'commands', 'quokka')), 'commands not removed on uninstall');
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'skills', 'quokka-feature-test-design')), 'skill not removed on uninstall');
assert.ok(!fs.existsSync(hookScript), 'hook script not removed on uninstall');
settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
assert.ok(
  !settings.hooks || !settings.hooks.SessionEnd,
  'SessionEnd hook should be removed from settings.json on uninstall'
);

fs.rmSync(tmp, { recursive: true, force: true });

// ── Regression: installer preserves pre-existing settings + hooks ─────────────
const tmp3 = fs.mkdtempSync(path.join(os.tmpdir(), 'qst3-'));
fs.mkdirSync(path.join(tmp3, '.claude'), { recursive: true });
const preExisting = {
  permissions: { allow: ['Read'] },
  hooks: { SessionEnd: [{ hooks: [{ type: 'command', command: 'echo keepme' }] }] },
};
fs.writeFileSync(
  path.join(tmp3, '.claude', 'settings.json'),
  JSON.stringify(preExisting, null, 2)
);
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js')], { cwd: tmp3, stdio: 'pipe' });
const merged = JSON.parse(fs.readFileSync(path.join(tmp3, '.claude', 'settings.json'), 'utf-8'));
assert.deepStrictEqual(merged.permissions.allow, ['Read'], 'existing permissions must be preserved');
assert.ok(
  JSON.stringify(merged.hooks.SessionEnd).includes('echo keepme'),
  'existing SessionEnd hook must be preserved'
);
assert.ok(
  JSON.stringify(merged.hooks.SessionEnd).includes('quokka-knowledge-summary.sh'),
  'quokka SessionEnd hook must be added alongside existing one'
);
// Uninstall should remove ours but keep theirs.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js'), '--uninstall'], { cwd: tmp3, stdio: 'pipe' });
const afterUninstall = JSON.parse(fs.readFileSync(path.join(tmp3, '.claude', 'settings.json'), 'utf-8'));
assert.ok(
  JSON.stringify(afterUninstall.hooks.SessionEnd).includes('echo keepme'),
  'pre-existing hook must survive uninstall'
);
assert.ok(
  !JSON.stringify(afterUninstall.hooks.SessionEnd).includes('quokka-knowledge-summary.sh'),
  'quokka hook must be gone after uninstall'
);
fs.rmSync(tmp3, { recursive: true, force: true });

// ── Regression: installer self-repairs missing skill files ────────────────────
// Set up a fresh temp project and do a clean install.
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'qst2-'));
fs.mkdirSync(path.join(tmp2, '.claude'), { recursive: true });
const installer = path.join(repoRoot, 'bin', 'install.js');

execFileSync('node', [installer], { cwd: tmp2, stdio: 'pipe' });

// 1. Confirm skill dir was installed.
const skillDir = path.join(tmp2, '.claude', 'skills', 'quokka-feature-test-design');
const skillMd = path.join(skillDir, 'SKILL.md');
assert.ok(fs.existsSync(skillMd), 'expected SKILL.md to exist after first install');

// 2. Delete the skill dir but leave the .version marker intact.
fs.rmSync(skillDir, { recursive: true, force: true });
assert.ok(!fs.existsSync(skillDir), 'skill dir should be gone before re-install');

// 3. Run installer again (version still matches).
execFileSync('node', [installer], { cwd: tmp2, stdio: 'pipe' });

// 4. Assert SKILL.md is restored.
assert.ok(fs.existsSync(skillMd), 'expected SKILL.md to be restored after self-repair re-install');

fs.rmSync(tmp2, { recursive: true, force: true });

console.log('install.test.js PASSED');
