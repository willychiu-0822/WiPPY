import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompleteUatRun } from './report.mjs';
const planned = ['UAT-01', 'UAT-02'];
const rows = planned.flatMap(id => ['desktop', 'mobile'].map(project => ({ id, project, status: 'pass' })));
test('accepts each case passing exactly once on both viewports', () => assert.equal(isCompleteUatRun(rows, planned), true));
test('rejects desktop repetitions without mobile coverage', () => {
  const desktop = rows.filter(row => row.project === 'desktop');
  assert.equal(isCompleteUatRun([...desktop, ...desktop], planned), false);
});
test('rejects partial runs', () => assert.equal(isCompleteUatRun(rows.slice(0, 2), planned), false));
test('rejects failed cases', () => assert.equal(isCompleteUatRun(rows.map((row, i) => i ? row : { ...row, status: 'fail' }), planned), false));
test('rejects duplicate pairs and unexpected cases', () => assert.equal(isCompleteUatRun([...rows, rows[0]], planned), false));
