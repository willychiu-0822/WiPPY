import { describe, expect, it } from 'vitest';

const forbidden = ['Activity', 'Water', 'LiffContext', 'MessagePlanTable', 'AgentChatPanel', 'ReviewBanner', 'Leaderboard'];
const forbiddenProductLanguage = [
  'reviewStatus',
  'streak',
  'backlog',
  'dueAt',
  'remainingCount',
  'leaderboard',
  'activityKnowledge',
  'harnessRuns',
  '複習',
  '到期',
  '連勝',
  '排行榜',
  '剩餘',
  '未完成',
  '欠題',
  '待審核',
  '已學會',
  '精通',
];
const learningSources = import.meta.glob<string>('../learning/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('learning frontend architecture', () => {
  it('does not import unrelated WiPPY feature modules', () => {
    expect(Object.keys(learningSources).length).toBeGreaterThan(0);

    for (const source of Object.values(learningSources)) {
      const imports = source
        .split(/\r?\n/)
        .filter((line) => /^\s*import\s/.test(line))
        .join('\n');
      for (const name of forbidden) {
        expect(imports).not.toContain(name);
      }
    }
  });

  it('does not reintroduce pressure-oriented review product language', () => {
    expect(Object.keys(learningSources).length).toBeGreaterThan(0);

    for (const source of Object.values(learningSources)) {
      for (const phrase of forbiddenProductLanguage) {
        expect(source).not.toContain(phrase);
      }
    }
  });
});
