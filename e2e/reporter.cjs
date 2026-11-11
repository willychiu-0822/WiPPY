const fs = require('node:fs');
class UatReporter {
  constructor() { this.rows = []; this.runErrors = 0; }
  onError() { this.runErrors += 1; }
  onBegin(_config, suite) {
    this.planned = [...fs.readFileSync('docs/uat/UAT-PLAN.md', 'utf8').matchAll(/^\| (UAT-\d+) \|/gm)].map(m => m[1]);
    for (const test of suite.allTests()) {
      const name = `${test.title.match(/UAT-\d+/)?.[0]}-${test.parent.project().name}.png`;
      for (const dir of ['docs/uat/evidence', 'docs/pr42-fixes/evidence']) fs.rmSync(`${dir}/${name}`, { force: true });
    }
  }
  onTestEnd(test, result) {
    this.rows.push({ case: test.title.match(/UAT-\d+/)?.[0], project: test.parent.project().name, result: result.status === 'passed' ? 'PASS' : 'FAIL', reason: result.status === 'passed' ? '' : require('node:util').stripVTControlCharacters(result.errors[0]?.message || result.status).replace(/[\r\n]+/g, ' ').replace(/\|/g, '/').replace(/wpy_[A-Za-z0-9_-]+/g, '[REDACTED]').slice(0, 500), evidence: `evidence/${test.title.match(/UAT-\d+/)?.[0]}-${test.parent.project().name}.png` });
  }
  onEnd(result) {
    const updated = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date());
    const pass = this.rows.filter(r => r.result === 'PASS').length;
    const report = { project: 'WiPPY PR42 Agent Hub 安裝路徑', updated, cases: this.rows.length, pass, fail: this.rows.length - pass, blocked: 0,
      ready_for_user_test: result.status === 'passed' && this.runErrors === 0 && this.planned.every(id => ['desktop', 'mobile', 'api'].every(p => this.rows.some(r => r.case === id && r.project === p && r.result === 'PASS' && fs.existsSync(`docs/uat/${r.evidence}`)))), notes: '本機 emulator/mock UAT；先前間歇逾時根因未確認，Firestore transport 警告仍在；真實 Grok/Instinct/LINE、雲端同步及 HTTPS 尚未驗證；未 push。' };
    fs.mkdirSync('docs/uat', { recursive: true });
    fs.writeFileSync('docs/uat/UAT-STATUS.json', JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync('docs/uat/UAT-RESULTS.md', `# 安裝路徑 UAT 結果\n\n時間：${updated}（Asia/Taipei）。${pass}/${this.rows.length} PASS。\n\n真實 WiPPY + Auth/Firestore emulator，外部 LINE/Routine mock；Chrome 桌面 1280×800／手機 390×844。每次執行覆寫本表，完整驗收需 ${this.planned.length} 個案例 × 3 projects = ${this.planned.length * 3} 次且都有本次截圖；ready 僅表示可做本機瀏覽器 UAT。\n\n| 案例 | 環境 | 結果 | 失敗原因 | 證據 |\n| --- | --- | --- | --- | --- |\n` + this.rows.map(r => `| ${r.case} | ${r.project} | ${r.result} | ${r.reason || '—'} | ${fs.existsSync(`docs/uat/${r.evidence}`) ? `[截圖](${r.evidence})` : '未產生本次截圖'} |`).join('\n') + '\n');
  }
}
module.exports = UatReporter;
