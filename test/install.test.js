#!/usr/bin/env node
// Plain-assert integration test for bin/install.js — no test framework.
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

// Global installs (the /quokka:cr command, skill and project files) go under
// QUOKKA_HOME. Point it at a throwaway dir so tests never touch the real HOME.
const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qsthome-'));
process.env.QUOKKA_HOME = fakeHome;

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

// ── /quokka:cr global install ─────────────────────────────────────────────────
const tmp4 = fs.mkdtempSync(path.join(os.tmpdir(), 'qst4-'));
fs.mkdirSync(path.join(tmp4, '.claude'), { recursive: true });
const home4 = fs.mkdtempSync(path.join(os.tmpdir(), 'qsthome4-'));
const env4 = { ...process.env, QUOKKA_HOME: home4 };
execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 });

// crInstalledGlobally
const gCmd = path.join(home4, '.claude', 'commands', 'quokka', 'cr.md');
const gSkill = path.join(home4, '.claude', 'skills', 'quokka-cr', 'SKILL.md');
const gQg = path.join(home4, '.quokka', 'cr', 'projects', 'qg.json');
const gIns = path.join(home4, '.quokka', 'cr', 'projects', 'ins.json');
for (const p of [gCmd, gSkill, gQg, gIns]) {
  assert.ok(fs.existsSync(p), `expected global install of ${p}`);
}

// crNotInProjectInstall
assert.ok(
  !fs.existsSync(path.join(tmp4, '.claude', 'commands', 'quokka', 'cr.md')),
  'cr.md must not be installed per-project (global only)'
);
assert.ok(
  !fs.existsSync(path.join(tmp4, '.claude', 'skills', 'quokka-cr')),
  'quokka-cr skill must not be installed per-project (global only)'
);
assert.ok(
  fs.existsSync(path.join(tmp4, '.claude', 'commands', 'quokka', 'port-feature.md')),
  'other commands still install per-project'
);

// localSurvivesReinstall
const localDir = path.join(home4, '.quokka', 'cr', 'projects', 'local');
fs.mkdirSync(localDir, { recursive: true });
fs.writeFileSync(path.join(localDir, 'acme.json'), '{"slug":"acme"}');
const localCfg = path.join(home4, '.quokka', 'cr', 'qg.local.json');
fs.writeFileSync(localCfg, '{"repos":{}}');
const out = execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 }).toString();
assert.ok(out.includes('Already up to date'), 'second run should be up to date');
fs.rmSync(gSkill);
execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 });
assert.ok(fs.existsSync(gSkill), 'missing global skill should self-repair');
const gRef = path.join(home4, '.claude', 'skills', 'quokka-cr', 'references', 'build.md');
fs.rmSync(gRef);
execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 });
assert.ok(fs.existsSync(gRef), 'missing global skill reference should self-repair');
assert.ok(fs.existsSync(path.join(localDir, 'acme.json')), 'local project must survive reinstall');
assert.ok(fs.existsSync(localCfg), 'local machine file must survive reinstall');

// uninstallKeepsLocal
execFileSync('node', [installer, '--uninstall'], { cwd: tmp4, stdio: 'pipe', env: env4 });
for (const p of [gCmd, gSkill, gQg, gIns]) {
  assert.ok(!fs.existsSync(p), `expected uninstall to remove ${p}`);
}
assert.ok(fs.existsSync(path.join(localDir, 'acme.json')), 'uninstall must keep local projects');
assert.ok(fs.existsSync(localCfg), 'uninstall must keep local machine files');
fs.rmSync(tmp4, { recursive: true, force: true });
fs.rmSync(home4, { recursive: true, force: true });

// projectFilesValid
const projDir = path.join(repoRoot, 'projects');
for (const f of fs.readdirSync(projDir).filter((n) => n.endsWith('.json'))) {
  const proj = JSON.parse(fs.readFileSync(path.join(projDir, f), 'utf-8'));
  for (const key of ['slug', 'prefix', 'idWidth', 'crList', 'surfaces', 'tickets', 'repos', 'deviceRules']) {
    assert.ok(key in proj, `${f}: missing ${key}`);
  }
  const ids = JSON.stringify(proj).match(/claude\.ai\/artifact\/[A-Za-z0-9]+/g) || [];
  for (const id of ids) {
    assert.strictEqual(id.split('/').pop().length, 22, `${f}: bad artifact id ${id}`);
  }
  for (const [role, repo] of Object.entries(proj.repos)) {
    assert.ok(/^(github|bitbucket):[^/\s]+\/[^/\s]+$/.test(repo.id), `${f}: repo ${role} needs provider:owner/repo`);
  }
}
fs.rmSync(fakeHome, { recursive: true, force: true });

console.log('install.test.js PASSED');
