import type { AttemptRecord, EvidenceStage } from '../model';

export interface EvidenceSummary {
  headline: string;
  details: string[];
  strongestStage: EvidenceStage;
}

const stageRank: Record<EvidenceStage, number> = {
  explained: 0,
  immediate_source: 1,
  immediate_novel: 2,
  delayed_source: 3,
  delayed_novel: 4,
  organic_reencounter: 5,
};

function strongestStage(attempts: AttemptRecord[]): EvidenceStage {
  return attempts.reduce<EvidenceStage>(
    (strongest, attempt) => (stageRank[attempt.stage] > stageRank[strongest] ? attempt.stage : strongest),
    'explained',
  );
}

function hasUnaided(attempts: AttemptRecord[], stage: EvidenceStage): boolean {
  return attempts.some(
    (attempt) => attempt.stage === stage && attempt.supportLevel === 'none' && attempt.correct,
  );
}

function detailForAttempt(attempt: AttemptRecord): string {
  if (attempt.supportLevel === 'answer' || attempt.answerRevealed) {
    return '直接看答案只代表已看過解釋，不算無提示辨認。';
  }
  if (attempt.supportLevel === 'skip' || attempt.skipped) {
    return '跳過不代表答錯，也不產生能力證據。';
  }
  if (attempt.supportLevel === 'hint_1' || attempt.supportLevel === 'hint_2') {
    return '提示下能辨認，尚不能當作無提示證據。';
  }
  if (attempt.correct && attempt.stage === 'delayed_novel') {
    return '延遲的未見情境無提示答對，是較強的辨認證據。';
  }
  if (attempt.correct && attempt.stage === 'organic_reencounter') {
    return '在真實重遇情境中無提示辨認，是目前最接近自然使用的證據。';
  }
  if (attempt.correct) {
    return '本次無提示辨認成功，但仍需看情境與時間條件。';
  }
  return '這次沒有正確辨認，之後會以更低壓的方式再遇見。';
}

export function summarizeEvidence(attempts: AttemptRecord[]): EvidenceSummary {
  const details = Array.from(new Set(attempts.map(detailForAttempt)));

  if (hasUnaided(attempts, 'organic_reencounter')) {
    return {
      headline: '曾在真實重遇情境中無提示辨認',
      details,
      strongestStage: strongestStage(attempts),
    };
  }

  if (hasUnaided(attempts, 'delayed_novel')) {
    return {
      headline: '曾在延遲的未見情境中無提示辨認',
      details,
      strongestStage: strongestStage(attempts),
    };
  }

  const hintedSource = attempts.some(
    (attempt) =>
      attempt.stage === 'immediate_source' &&
      attempt.correct &&
      (attempt.supportLevel === 'hint_1' || attempt.supportLevel === 'hint_2'),
  );
  const unaidedNovel = hasUnaided(attempts, 'immediate_novel');

  if (hintedSource && !unaidedNovel) {
    return {
      headline: '提示下能辨認；新語境尚無無提示證據',
      details,
      strongestStage: strongestStage(attempts),
    };
  }

  if (unaidedNovel) {
    return {
      headline: '曾在同回合未見情境中無提示辨認',
      details,
      strongestStage: strongestStage(attempts),
    };
  }

  return {
    headline: attempts.length === 0 ? '尚無證據' : '已有接觸紀錄，但尚無無提示辨認證據',
    details,
    strongestStage: strongestStage(attempts),
  };
}
