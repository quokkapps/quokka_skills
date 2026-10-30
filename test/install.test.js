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
process.env.CLAUDE_CONFIG_DIR = path.join(fakeHome, '.claude');

// 1. Make a throwaway "project" with a .claude dir to install into.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qst-'));
fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });

// 2. Run the installer with cwd = tmp project.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js')], {
  cwd: tmp,
  stdio: 'pipe',
});

// 3. Commands still install (regression).
const cmd = path.join(tmp, '.claude', 'commands', 'quokka', 'feature-test-design.md');
assert.ok(fs.existsSync(cmd), 'expected commands/quokka/feature-test-design.md to be installed');

// 4. Skills install too.
const skill = path.join(tmp, '.claude', 'skills', 'quokka-feature-test-design', 'SKILL.md');
assert.ok(fs.existsSync(skill), 'expected skills/quokka-feature-test-design/SKILL.md to be installed');

// 4b. No hooks and no settings.json are written any more.
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'hooks')), 'no hooks should be installed');
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'settings.json')), 'settings.json should not be created');

// 5. Uninstall removes commands and skills.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js'), '--uninstall'], {
  cwd: tmp,
  stdio: 'pipe',
});
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'commands', 'quokka')), 'commands not removed on uninstall');
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'skills', 'quokka-feature-test-design')), 'skill not removed on uninstall');

fs.rmSync(tmp, { recursive: true, force: true });

// ── retiredRemovedOnUpdate: port commands + session-summary hook from v1.3 ────
const tmp3 = fs.mkdtempSync(path.join(os.tmpdir(), 'qst3-'));
const claude3 = path.join(tmp3, '.claude');
fs.mkdirSync(path.join(claude3, 'commands', 'quokka'), { recursive: true });
fs.mkdirSync(path.join(claude3, 'hooks'), { recursive: true });
fs.writeFileSync(path.join(claude3, 'commands', 'quokka', '.version'), '1.3.0\n');
for (const f of ['port-feature.md', 'port-gsd-feature.md']) {
  fs.writeFileSync(path.join(claude3, 'commands', 'quokka', f), 'old');
}
for (const f of ['quokka-knowledge-summary.sh', 'quokka-knowledge-worker.sh']) {
  fs.writeFileSync(path.join(claude3, 'hooks', f), 'old');
}
fs.writeFileSync(path.join(claude3, 'hooks', 'mine.sh'), 'keep');
fs.writeFileSync(
  path.join(claude3, 'settings.json'),
  JSON.stringify({
    permissions: { allow: ['Read'] },
    hooks: {
      SessionEnd: [
        { hooks: [{ type: 'command', command: 'echo keepme' }] },
        { hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/quokka-knowledge-summary.sh"' }] },
        {
          hooks: [
            { type: 'command', command: 'echo samegroup' },
            { type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/quokka-knowledge-summary.sh"' },
          ],
        },
      ],
    },
  })
);
const out3 = execFileSync('node', [path.join(repoRoot, 'bin', 'install.js')], { cwd: tmp3, stdio: 'pipe' }).toString();
assert.ok(!out3.includes('commands/quokka/port-'), 'install summary must not list retired commands');
for (const f of ['commands/quokka/port-feature.md', 'commands/quokka/port-gsd-feature.md',
  'hooks/quokka-knowledge-summary.sh', 'hooks/quokka-knowledge-worker.sh']) {
  assert.ok(!fs.existsSync(path.join(claude3, f)), `retired ${f} must be removed on update`);
}
assert.ok(fs.existsSync(path.join(claude3, 'hooks', 'mine.sh')), 'user hook scripts must survive');
const merged = JSON.parse(fs.readFileSync(path.join(claude3, 'settings.json'), 'utf-8'));
assert.deepStrictEqual(merged.permissions.allow, ['Read'], 'existing permissions must be preserved');
assert.ok(JSON.stringify(merged.hooks.SessionEnd).includes('echo keepme'), 'other SessionEnd hooks must survive');
assert.ok(JSON.stringify(merged.hooks.SessionEnd).includes('echo samegroup'), 'hooks sharing a group with the retired one must survive');
assert.strictEqual(merged.hooks.SessionEnd.length, 2, 'only the group left empty is removed');
assert.ok(!JSON.stringify(merged).includes('quokka-knowledge-summary.sh'), 'retired SessionEnd hook must be removed');
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
const env4 = { ...process.env, QUOKKA_HOME: home4, CLAUDE_CONFIG_DIR: path.join(home4, '.claude') };
execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 });

// crInstalledGlobally
const gCmd = path.join(home4, '.claude', 'commands', 'quokka', 'cr.md');
const gHelp = path.join(home4, '.claude', 'commands', 'quokka', 'cr-help.md');
const gSetup = path.join(home4, '.claude', 'commands', 'quokka', 'cr-setup.md');
const gHealth = path.join(home4, '.claude', 'commands', 'quokka', 'cr-health.md');
const gSkill = path.join(home4, '.claude', 'skills', 'quokka-cr', 'SKILL.md');
const gQg = path.join(home4, '.quokka', 'cr', 'projects', 'qg.json');
const gIns = path.join(home4, '.quokka', 'cr', 'projects', 'ins.json');
for (const p of [gCmd, gHelp, gSetup, gHealth, gSkill, gQg, gIns]) {
  assert.ok(fs.existsSync(p), `expected global install of ${p}`);
}

// crNotInProjectInstall
assert.ok(
  !fs.existsSync(path.join(tmp4, '.claude', 'commands', 'quokka', 'cr.md')),
  'cr.md must not be installed per-project (global only)'
);
assert.ok(
  !fs.existsSync(path.join(tmp4, '.claude', 'commands', 'quokka', 'cr-help.md')),
  'cr-help.md must not be installed per-project (global only)'
);
assert.ok(
  !fs.existsSync(path.join(tmp4, '.claude', 'skills', 'quokka-cr')),
  'quokka-cr skill must not be installed per-project (global only)'
);
assert.ok(
  fs.existsSync(path.join(tmp4, '.claude', 'commands', 'quokka', 'feature-test-design.md')),
  'other commands still install per-project'
);

// localSurvivesReinstall
const localDir = path.join(home4, '.quokka', 'cr', 'projects', 'local');
fs.mkdirSync(localDir, { recursive: true });
fs.writeFileSync(path.join(localDir, 'acme.json'), '{"slug":"acme"}');
const localCfg = path.join(home4, '.quokka', 'cr', 'qg.local.json');
fs.writeFileSync(localCfg, '{"repos":{}}');
const out = execFileSync('node', [installer], { cwd: tmp4, stdio: 'pipe', env: env4 }).toString();
assert.ok(!out.includes('port-feature'), 'summary must not list retired commands');
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
for (const p of [gCmd, gHelp, gSetup, gHealth, gSkill, gQg, gIns]) {
  assert.ok(!fs.existsSync(p), `expected uninstall to remove ${p}`);
}
assert.ok(fs.existsSync(path.join(localDir, 'acme.json')), 'uninstall must keep local projects');
assert.ok(fs.existsSync(localCfg), 'uninstall must keep local machine files');
fs.rmSync(tmp4, { recursive: true, force: true });
fs.rmSync(home4, { recursive: true, force: true });

// globalUsesClaudeConfigDir: CCS-style CLAUDE_CONFIG_DIR gets the command + skill.
const tmp5 = fs.mkdtempSync(path.join(os.tmpdir(), 'qst5-'));
fs.mkdirSync(path.join(tmp5, '.claude'), { recursive: true });
const home5 = fs.mkdtempSync(path.join(os.tmpdir(), 'qsthome5-'));
const cfg5 = path.join(home5, 'ccs', 'instances', 'account');
execFileSync('node', [installer], {
  cwd: tmp5,
  stdio: 'pipe',
  env: { ...process.env, QUOKKA_HOME: home5, CLAUDE_CONFIG_DIR: cfg5 },
});
assert.ok(fs.existsSync(path.join(cfg5, 'commands', 'quokka', 'cr.md')), 'cr.md must go to CLAUDE_CONFIG_DIR');
assert.ok(fs.existsSync(path.join(cfg5, 'skills', 'quokka-cr', 'SKILL.md')), 'skill must go to CLAUDE_CONFIG_DIR');
assert.ok(!fs.existsSync(path.join(home5, '.claude', 'commands', 'quokka', 'cr.md')), 'nothing in ~/.claude when CLAUDE_CONFIG_DIR is set');
assert.ok(fs.existsSync(path.join(home5, '.quokka', 'cr', 'projects', 'qg.json')), 'project files stay under ~/.quokka');
// A second config dir sharing the same home still gets its own install.
const cfg5b = path.join(home5, 'ccs', 'instances', 'other');
const out5 = execFileSync('node', [installer], {
  cwd: tmp5,
  stdio: 'pipe',
  env: { ...process.env, QUOKKA_HOME: home5, CLAUDE_CONFIG_DIR: cfg5b },
}).toString();
assert.ok(!out5.includes('Already up to date'), 'a new config dir must not be treated as up to date');
assert.ok(fs.existsSync(path.join(cfg5b, 'skills', 'quokka-cr', 'SKILL.md')), 'second config dir gets the skill');
fs.rmSync(tmp5, { recursive: true, force: true });
fs.rmSync(home5, { recursive: true, force: true });

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
