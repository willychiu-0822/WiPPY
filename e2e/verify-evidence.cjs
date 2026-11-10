// Rebuild the evidence manifest from the last complete UAT run; no credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const plan = fs.readFileSync('docs/uat/UAT-PLAN.md', 'utf8');
const ids = [...plan.matchAll(/^\| (UAT-\d+) \|/gm)].map(m => m[1]);
const status = JSON.parse(fs.readFileSync('docs/uat/UAT-STATUS.json'));
assert.equal(status.ready_for_user_test, true, 'A complete passing run is required');
assert.equal(status.cases, ids.length * 3);
assert.equal(status.pass, status.cases);
assert.equal(status.fail, 0);
const resultTable = fs.readFileSync('docs/uat/UAT-RESULTS.md', 'utf8');
const evidence = [];
for (const id of ids) for (const project of ['desktop', 'mobile', 'api']) {
  assert.ok(resultTable.includes(`| ${id} | ${project} | PASS |`));
  const name = `${id}-${project}.png`;
  const png = fs.readFileSync(`docs/uat/evidence/${name}`);
  assert.deepEqual(png, fs.readFileSync(`docs/pr42-fixes/evidence/${name}`), `${name} copies differ`);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(width, project === 'mobile' ? 390 : 1280);
  assert.equal(height, project === 'mobile' ? 844 : 800);
  evidence.push({ case: id, project, result: 'PASS', evidence: name, width, height, sha256: createHash('sha256').update(png).digest('hex') });
}
const contrastFiles = [], ratios = [];
for (const id of ['UAT-17', 'UAT-18']) for (const project of ['desktop', 'mobile']) {
  const name = `${id}-${project}-contrast.json`;
  const content = fs.readFileSync(`docs/uat/evidence/${name}`);
  assert.deepEqual(content, fs.readFileSync(`docs/pr42-fixes/evidence/${name}`));
  const samples = JSON.parse(content);
  assert.equal(samples.length, 8);
  for (const sample of samples) { assert.ok(sample.ratio >= 4.5, sample.label); ratios.push(sample.ratio); }
  contrastFiles.push(name);
}
const patches = fs.readdirSync('docs/pr42-fixes/patches').filter(name => name.endsWith('.patch')).sort();
for (const name of patches) execFileSync('git', ['apply', '--reverse', '--check', `docs/pr42-fixes/patches/${name}`], { stdio: 'pipe' });
const manifest = {
  updated: status.updated, base: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(),
  e2e: { cases: status.cases, pass: status.pass, fail: status.fail, retries: 0, channel: 'chrome', logical_cases: ids.length },
  evidence, contrast: { measurements: ratios.length, minimum_ratio: Math.min(...ratios), threshold: 4.5, files: contrastFiles },
  patches, commits: [], commit_status: 'blocked: .git is mounted read-only; nine independent fix patches and exact commit grouping provided',
  push: 'not attempted: cannot create commits; user message also contains conflicting push instructions',
  notes_summary: 'repo-local copy; requested /workspace/codex-burn/notes is outside writable scope',
};
fs.writeFileSync('docs/pr42-fixes/evidence/install-uat-verification.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Verified ${evidence.length} screenshots, ${ratios.length} contrast samples and ${patches.length} reversible patches`);
