import type { ChallengeBuilder } from '../../application/ports';
import type { ChallengeBlueprint, Facet, KnowledgeItem, SourceContextRef } from '../../domain/model';

interface Template {
  id: string;
  facet: Facet;
  excerptEn: string;
  promptZh: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  hints: string[];
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  ambiguityNoteZh: string | null;
}

const runByTemplates: Template[] = [
  {
    id: 'synthetic-run-by-meaning-1',
    facet: 'meaning',
    excerptEn: 'Run it by Maya first.',
    promptZh: '這句最接近哪個意思？',
    options: [
      { id: 'a', text: '先詢問 Maya 的意見' },
      { id: 'b', text: '先從 Maya 身邊跑過去' },
    ],
    correctOptionId: 'a',
    hints: ['by 後面接人時，這裡不是移動路徑。', 'run it by someone 常用來表示先拿給對方看或問意見。'],
    explanationZh: 'run something by someone 表示把想法提出來徵詢某人的意見。',
    decisiveCluesZh: ['run it by + 人，表示徵詢意見。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '保留「提出來問對方」的意思。' },
      { optionId: 'b', explanationZh: '把 run 誤解成身體移動。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-by-chunk-1',
    facet: 'chunk',
    excerptEn: 'Run the idea by a few users.',
    promptZh: '這個片語裡誰是被徵詢的人？',
    options: [
      { id: 'a', text: 'a few users' },
      { id: 'b', text: 'the idea' },
    ],
    correctOptionId: 'a',
    hints: ['by 後面的人通常是接收想法的人。', 'the idea 是被拿去詢問意見的內容。'],
    explanationZh: '在 run the idea by a few users 裡，users 是被徵詢的人。',
    decisiveCluesZh: ['run + 內容 + by + 人。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: 'users 是提供反饋的人。' },
      { optionId: 'b', explanationZh: 'idea 是被討論的內容，不是提供意見的人。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-by-syntax-1',
    facet: 'syntax',
    excerptEn: 'Run the idea by a few users.',
    promptZh: '哪個語序最自然？',
    options: [
      { id: 'a', text: 'run + idea + by + users' },
      { id: 'b', text: 'run + by + idea + users' },
    ],
    correctOptionId: 'a',
    hints: ['被討論的內容通常先出現。', 'by 後面接被徵詢的人。'],
    explanationZh: '這個搭配常見語序是 run something by someone。',
    decisiveCluesZh: ['something 在 by someone 前。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '符合 run something by someone 的語序。' },
      { optionId: 'b', explanationZh: '把 by 放太前面，破壞固定搭配。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-by-pragmatics-1',
    facet: 'pragmatics',
    excerptEn: 'Run it by Maya first.',
    promptZh: '比起 tell Maya，run it by Maya 可能多了什麼語氣？',
    options: [
      { id: 'a', text: '比較像徵詢、保留調整空間' },
      { id: 'b', text: '比較像命令對方接受' },
    ],
    correctOptionId: 'a',
    hints: ['run it by someone 常帶有先問問看的感覺。', 'tell 比較像單向告知。'],
    explanationZh: '一種讀法是 run it by Maya 比 tell Maya 更像先徵詢意見，語氣可能比較開放。',
    decisiveCluesZh: ['run it by 表示提出來讓對方看或評論。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '保留了徵詢與可調整的語氣。' },
      { optionId: 'b', explanationZh: '命令感較像 tell/order，不是 run by 的主要效果。' },
    ],
    ambiguityNoteZh: '語氣效果會受上下文影響，這裡是一種讀法，不是作者內心意圖的事實判斷。',
  },
];

const runCompanyTemplates: Template[] = [
  {
    id: 'synthetic-run-company-meaning-1',
    facet: 'meaning',
    excerptEn: 'She runs the company with care.',
    promptZh: '這裡的 runs the company 比較接近哪個意思？',
    options: [
      { id: 'a', text: '經營／管理公司' },
      { id: 'b', text: '在公司裡跑步' },
    ],
    correctOptionId: 'a',
    hints: ['run 後面接 company 時，常不是身體移動。', 'run a company 是管理或經營一間公司。'],
    explanationZh: 'run a company 表示經營或管理公司。',
    decisiveCluesZh: ['run + company 指管理一個組織。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '保留了 operate/manage 的意思。' },
      { optionId: 'b', explanationZh: '把 run 誤解成身體動作。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-company-chunk-1',
    facet: 'chunk',
    excerptEn: 'Later, run the company with care.',
    promptZh: 'run the company 裡，the company 扮演什麼角色？',
    options: [
      { id: 'a', text: '被經營／管理的組織' },
      { id: 'b', text: '提供建議的人' },
    ],
    correctOptionId: 'a',
    hints: ['company 是 run 的受詞。', '這裡不是 run something by someone 的「被徵詢者」。'],
    explanationZh: 'the company 是被經營或管理的對象。',
    decisiveCluesZh: ['run + organization。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '符合 run a company 的搭配角色。' },
      { optionId: 'b', explanationZh: '這會混到 run something by someone 的用法。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-company-syntax-1',
    facet: 'syntax',
    excerptEn: 'They run the company.',
    promptZh: '哪個語序最自然？',
    options: [
      { id: 'a', text: 'run + company' },
      { id: 'b', text: 'run + by + company' },
    ],
    correctOptionId: 'a',
    hints: ['經營公司的意思通常直接接組織。', 'by company 不是這個意思需要的結構。'],
    explanationZh: 'run a company 的常見語序是 run + organization。',
    decisiveCluesZh: ['company 直接作為 run 的受詞。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '符合「經營某組織」的結構。' },
      { optionId: 'b', explanationZh: '多了 by，會變成另一種結構。' },
    ],
    ambiguityNoteZh: null,
  },
  {
    id: 'synthetic-run-company-pragmatics-1',
    facet: 'pragmatics',
    excerptEn: 'She runs the company with care.',
    promptZh: '這裡 runs the company 可能帶出什麼效果？',
    options: [
      { id: 'a', text: '強調她負責營運與管理' },
      { id: 'b', text: '強調她正在快速移動' },
    ],
    correctOptionId: 'a',
    hints: ['with care 修飾管理方式很自然。', '公司不太會是跑步的場地重點。'],
    explanationZh: '一種讀法是這句把焦點放在她如何經營公司，而不是身體動作。',
    decisiveCluesZh: ['run + company + with care。'],
    optionExplanations: [
      { optionId: 'a', explanationZh: '符合經營管理的語氣效果。' },
      { optionId: 'b', explanationZh: '忽略了 company 作為組織受詞。' },
    ],
    ambiguityNoteZh: '這是根據語言線索做出的可能解讀，不是作者意圖的唯一答案。',
  },
];

function supports(item: KnowledgeItem): boolean {
  return (
    item.qualityStatus === 'verified' &&
    ((item.normalizedForm === 'run something by someone' && item.senseKey === 'seek-feedback') ||
      (item.normalizedForm === 'run a company' && item.senseKey === 'manage-business'))
  );
}

function templatesFor(item: KnowledgeItem): Template[] {
  if (item.normalizedForm === 'run a company' && item.senseKey === 'manage-business') return runCompanyTemplates;
  return runByTemplates;
}

function sourceBlueprint(item: KnowledgeItem, facet: Facet, sourceContext: SourceContextRef, input: Parameters<ChallengeBuilder['build']>[0]): ChallengeBlueprint | null {
  if (!supports(item) || sourceContext.contextQuality < 0.7 || sourceContext.startOffset >= sourceContext.endOffset) {
    return null;
  }
  const template = templatesFor(item).find((entry) => entry.facet === facet);
  if (!template || input.excludedContextFingerprints.includes(sourceContext.contextFingerprint)) {
    return null;
  }
  return {
    facet,
    target: input.target,
    stage: input.stage,
    taskMode: `${facet}_choice` as ChallengeBlueprint['taskMode'],
    promptZh: template.promptZh,
    options: template.options,
    correctOptionId: template.correctOptionId,
    hints: template.hints,
    recommendedSupport: input.recommendedSupport,
    explanationZh: template.explanationZh,
    decisiveCluesZh: template.decisiveCluesZh,
    optionExplanations: template.optionExplanations,
    ambiguityNoteZh: template.ambiguityNoteZh,
    evidence: item.evidence,
    contextNovelty: sourceContext.contextNovelty,
    contextProvenance: sourceContext.provenance,
    segmentId: sourceContext.segmentId,
    startOffset: sourceContext.startOffset,
    endOffset: sourceContext.endOffset,
    contextFingerprint: sourceContext.contextFingerprint,
    contextQuality: sourceContext.contextQuality,
  };
}

export const seedChallengeBuilder: ChallengeBuilder = {
  async build(input) {
    if (!supports(input.item)) {
      return null;
    }

    if (input.sourceContext !== null) {
      return sourceBlueprint(input.item, input.facet, input.sourceContext, input);
    }

    if (input.target === 'source_recognition') {
      return null;
    }

    const template = templatesFor(input.item).find((entry) => entry.facet === input.facet);
    if (!template || input.excludedContextFingerprints.includes(`sha256:${template.id}`)) {
      return null;
    }

    return {
      facet: input.facet,
      target: input.target,
      stage: input.stage,
      taskMode: `${input.facet}_choice` as ChallengeBlueprint['taskMode'],
      promptZh: template.promptZh,
      options: template.options,
      correctOptionId: template.correctOptionId,
      hints: template.hints,
      recommendedSupport: input.recommendedSupport,
      explanationZh: template.explanationZh,
      decisiveCluesZh: template.decisiveCluesZh,
      optionExplanations: template.optionExplanations,
      ambiguityNoteZh: template.ambiguityNoteZh,
      evidence: input.item.evidence,
      contextNovelty: 1,
      contextProvenance: 'synthetic',
      templateId: template.id,
      excerptEn: template.excerptEn,
      contextFingerprint: `sha256:${template.id}`,
      contextQuality: 1,
    };
  },
};
