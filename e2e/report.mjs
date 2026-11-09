import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 16);
export function isCompleteUatRun(rows, planned) {
  if (!planned.length || rows.length !== planned.length * 2) return false;
  return planned.every(id => ['desktop', 'mobile'].every(project => {
    const pair = rows.filter(row => row.id === id && row.project === project);
    return pair.length === 1 && pair[0].status === 'pass';
  }));
}
export default class UatReporter {
  rows = [];
  fatal = [];
  onError(error) { this.fatal.push(error.message.replace(/\u001b\[[0-9;]*m/g, '')); }
  onBegin(_config, suite) {
    this.start = stamp();
    this.total = suite.allTests().length || (fs.readFileSync(path.join(root, 'frontend/e2e/uat.spec.ts'), 'utf8').match(/test\('UAT-/g) || []).length * 2;
    this.run = new Date().toISOString().replace(/[:.]/g, '-');
    this.folder = path.join(root, 'docs/uat/evidence', this.run);
    fs.mkdirSync(this.folder, { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/uat/UAT-STATUS.json'), JSON.stringify({
      project: 'WiPPY', updated: stamp(), cases: this.total, pass: 0, fail: 0, blocked: this.total,
      ready_for_user_test: false, notes: '執行中：尚未完成所有案例與 viewport；前一次通過不代表本次完成。',
    }, null, 2) + '\n');
  }
  onTestEnd(test, result) {
    const id = test.title.match(/UAT-\d+/)?.[0] || test.title;
    const project = test.parent.project().name;
    const target = path.join(this.folder, project, `${id}.png`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const shot = result.attachments.find(a => a.name === 'uat-screenshot');
    if (shot?.path) fs.copyFileSync(shot.path, target);
    const error = (result.errors[0]?.message || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 6).join(' ').replace(/\|/g, '/');
    this.rows.push({ id, project, status: result.status === 'passed' ? 'pass' : result.status === 'skipped' ? 'blocked' : 'fail', error,
      evidence: shot ? path.relative(root, target) : '無截圖（啟動失敗）' });
  }
  onEnd(result) {
    const count = status => this.rows.filter(r => r.status === status).length;
    const planned = [...fs.readFileSync(path.join(root, 'frontend/e2e/uat.spec.ts'), 'utf8').matchAll(/test\('(UAT-\d+)/g)].map(match => match[1]);
    const full = isCompleteUatRun(this.rows.map(row => ({ ...row, status: 'pass' })), planned);
    const ready = this.fatal.length === 0 && isCompleteUatRun(this.rows, planned) && result.status === 'passed';
    const summary = { project: 'WiPPY', updated: stamp(), cases: this.total,
      pass: count('pass'), fail: count('fail'), blocked: count('blocked') + Math.max(0, this.total - this.rows.length),
      ready_for_user_test: ready,
      notes: `${this.fatal.length ? this.fatal.join('; ').slice(0, 300) + '；' : ''}${new Set(this.rows.map(r => r.id)).size} 個旅程，桌面/手機分開計數；${full ? '完整' : '部分'}執行。僅本機 Firebase emulator + LINE/LLM mock；真實 LINE/HTTPS 未驗證。` };
    fs.writeFileSync(path.join(root, 'docs/uat/UAT-STATUS.json'), JSON.stringify(summary, null, 2) + '\n');
    const report = path.join(root, 'docs/uat/UAT-RESULTS.md');
    if (!fs.existsSync(report)) fs.writeFileSync(report, '# WiPPY UAT 執行結果\n\n每次執行保留紀錄；pass 只代表 emulator/mock 範圍。案例與正式環境限制見 [計畫](UAT-PLAN.md)。\n');
    fs.writeFileSync(path.join(this.folder, 'results.json'), JSON.stringify({ ...summary, errors: this.fatal, results: this.rows }, null, 2) + '\n');
    fs.appendFileSync(report, `\n## ${this.start} ～ ${stamp()}（台北）\n\n批次：\`${this.run}\`。${summary.pass} pass / ${summary.fail} fail / ${summary.blocked} blocked；可試用：${ready}。${this.fatal.length ? ' 啟動／執行錯誤：' + this.fatal.join('; ').replace(/\n/g, ' ') : ''}\n\n| 案例 | Viewport | 結果 | 失敗原因 | 證據 |\n| --- | --- | --- | --- | --- |\n` + this.rows.map(r => `| ${r.id} | ${r.project} | ${r.status} | ${r.error || '—'} | [截圖](${r.evidence.replace('docs/uat/', '')}) |`).join('\n') + '\n');
  }
}
