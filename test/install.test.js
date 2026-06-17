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

// 5. Uninstall removes both.
execFileSync('node', [path.join(repoRoot, 'bin', 'install.js'), '--uninstall'], {
  cwd: tmp,
  stdio: 'pipe',
});
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'commands', 'quokka')), 'commands not removed on uninstall');
assert.ok(!fs.existsSync(path.join(tmp, '.claude', 'skills', 'quokka-feature-test-design')), 'skill not removed on uninstall');

fs.rmSync(tmp, { recursive: true, force: true });

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
