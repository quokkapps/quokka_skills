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
console.log('install.test.js PASSED');
