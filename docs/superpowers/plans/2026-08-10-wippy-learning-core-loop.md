# WiPPY Learning Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-safe, Firebase-authenticated English text-learning vertical slice to WiPPY that imports pasted English content, captures language units into a private total knowledge base, creates bounded low-pressure learning rounds, records facet-specific evidence, and can later be extracted from WiPPY without rewriting the learning core.

**Architecture:** Keep WiPPY as one repository and one product deployment, but add a logically isolated `learning` bounded context. React/Vite owns the learning UI, Express owns authenticated `/api/learning/*` transport, a framework-free TypeScript core owns evidence, forgetting, eligibility, priority, and round selection, and a Firestore adapter owns persistence. Source ingestion runs behind a dedicated Cloud Tasks boundary and access is controlled server-side per Firebase UID; the worker boundary may move to a separate Cloud Run service later without changing the domain or frontend API.

**Tech Stack:** Node.js 20, npm with committed lockfiles, Express 4, backend TypeScript 6 strict mode, Jest 30, React 19, React Router 7, Vite 8, frontend TypeScript 5.9 strict mode, Tailwind CSS 4, Vitest 4, React Testing Library, Firebase Auth, Firestore, Firebase Emulator Suite, Cloud Run, Cloud Tasks with OIDC, Zod 4, Playwright, and axe-core.

## Source of Truth and Supersession

- Product behavior comes from `C:/Users/willy/Desktop/LLBN/docs/superpowers/specs/2026-08-09-interest-driven-english-learning-system-design.md`.
- This plan supersedes the standalone application assumptions in `C:/Users/willy/Desktop/LLBN/docs/superpowers/plans/2026-08-10-text-core-learning-loop.md` for WiPPY implementation.
- The old plan remains historical documentation; do not edit or execute it against WiPPY.

## Global Constraints

- Execute this plan from an isolated WiPPY worktree created from current `main`; never implement directly on the production branch.
- Keep Node.js at `20.x` to match WiPPY CI, Docker, and production deployment. Do not introduce Next.js, SQLite/libSQL, Python, or a second authentication system.
- Code under `backend/src/learning/domain/**` must not import React, Express, Firebase, Firestore, Google GenAI, Cloud Tasks, environment variables, or wall-clock globals.
- Inject `now: Date` into memory, evidence, eligibility, and selection functions. Do not call `Date.now()` inside the learning domain.
- Treat Firebase `req.userId` as the only learning owner identity. Never accept a client-supplied `userId`, and do not use LIFF/LINE user IDs as learning identities.
- Keep learning data in collections whose names start with `learning`. Do not write learning state into `activities`, `activityKnowledge`, V1 `wishes`, `harnessRuns`, or `agentSessions`.
- All learning writes go through Express APIs or the internal worker. Firestore client SDK access to learning collections remains denied.
- Every detected word occurrence enters the total knowledge base. Capture never creates capability evidence or memory success. At round start, only items that independently pass verified-evidence, value, and context-quality gates may receive dynamic first-challenge eligibility; eligibility is never persisted as proof of learning.
- A canonical knowledge item is `normalizedForm + senseKey` within one user. Use deterministic IDs because Firestore has no relational uniqueness constraint.
- Preserve source versions and exact occurrence spans. Overlapping word and collocation occurrences are valid.
- B facets remain independent: `meaning`, `chunk`, `syntax`, and `pragmatics`. One facet's evidence must never update another facet.
- Productive C tasks and evidence are absent from this slice. Do not generate free production, form recall, supported production, or independent production records.
- A round contains one adaptive main knowledge unit and zero to two one-step additional eligible units. The main unit may branch into the minimum needed recognition steps, with a hard cap of three main-unit steps and five total steps; an unaided answer in the source sentence alone does not end it unless unaided novel-context evidence already exists. The product never reveals this cap or grows the round to clear a backlog.
- Public challenge payloads must not reveal answer keys, item IDs, old/review identity, due dates, retrievability, priority scores, or forgetting state.
- Every challenge permits a provisional answer, progressive hints, direct answer, and skip. Skip is not wrong; answer reveal is not unaided success.
- Preserve the first answer separately from the final answer. A corrected answer never overwrites first-response evidence.
- Same-session novel-context success is immediate evidence only. Delayed evidence requires at least 24 hours and an unseen context.
- User-facing copy is Traditional Chinese. English appears only in source text, authentic evidence, or explicitly `synthetic` practice contexts.
- Do not implement streaks, hearts, XP, leaderboards, timers, due counts, reminders, notifications, or unfinished-session debt.
- Operational traces are short-lived and redacted. Durable attempt evidence is a separate product record and must never be inferred from page views or exposure alone. Source text lives only in `learningSegments`; source-based challenges persist segment/offset references, not copied excerpts.
- Source imports are pasted text only in this slice. Store an optional provenance URL, but do not fetch arbitrary URLs.
- Limit source bodies to 50,000 Unicode characters and 400 non-empty paragraphs, titles and optional authors to 200 characters, optional learning objectives to 500 characters, and optional URLs to 2,048 characters.
- Deterministic capture and the reviewed seed catalog are the only production enrichment mechanisms in this plan. General verified AI ingestion, browser capture, Socratic dialogue, stance/share studio, and audio/video evidence each require a separate approved plan.
- The learning feature remains canary-only until a follow-on verified-ingestion plan supplies named dictionary/corpus evidence for general items. Only UIDs explicitly present in `learningAccess/{uid}` may use it.
- Every persisted learning document has `schemaVersion: 1` and `userId`. Public API DTOs do not expose schema internals.
- Preserve future extraction seams: learning domain code has no imports from Activity, Water, LINE, or V1 scheduling modules; frontend calls only `/api/learning/*`; all worker configuration uses `LEARNING_*` names.

## Delivery Decomposition

This plan delivers one independently testable production canary:

1. A user with learning access pastes an English source.
2. A dedicated ingestion run captures all word occurrences plus reviewed seed collocations without creating learning success.
3. The user starts one bounded round, answers with any support level, and receives evidence-based feedback.
4. The total knowledge view shows captured, unresolved, excluded, and independently evidenced facets.
5. Existing Activity, LINE, Water, scheduler, and Harness flows remain unchanged.

The following are intentionally separate plans: verified AI/dictionary/corpus ingestion; browser reading companion and minimized paragraph hints; topic knowledge, Socratic dialogue, and stance/share studio; audio/video evidence; broad rollout and PWA/offline behavior.

## Execution Order

Execute the numbered tasks in numeric order: Tasks 1–4 establish the framework-free domain and persistence boundary; Tasks 5–8 add capture, application services, jobs, and HTTP transport; Tasks 9–13 add the WiPPY UI and production verification. Do not begin a task until every dependency named in its `Consumes` line is committed and green.

---

### Task 1: Learning Domain Contracts and Isolation Guard

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Create: `backend/src/learning/domain/model.ts`
- Create: `backend/src/learning/domain/validation.ts`
- Test: `backend/src/__tests__/learningDomain.test.ts`
- Test: `backend/src/__tests__/learningArchitecture.test.ts`

**Interfaces:**
- Consumes: Zod 4.
- Produces: `Facet`, `MemoryTarget`, `EvidenceStage`, `SupportLevel`, `ContextProvenance`, `KnowledgeKind`, `SenseStatus`, `QualityStatus`, `ChallengeStatus`, `ChallengeIssue`, `RoundUnit`, `ValueSignals`, `LanguageEvidence`, `KnowledgeItem`, `Occurrence`, `OccurrenceLink`, `FacetMemory`, `InternalChallenge`, `PublicChallenge`, `AttemptInput`, `AttemptRecord`, `attemptInputSchema`, and `toPublicChallenge()`.

- [ ] **Step 1: Add the backend runtime validation dependency**

Run from `backend/`:

```powershell
npm install zod@^4
```

Expected: `backend/package.json` and `backend/package-lock.json` add Zod without upgrading unrelated dependencies.

- [ ] **Step 2: Write failing domain-invariant tests**

Create `backend/src/__tests__/learningDomain.test.ts` with these assertions:

```ts
import { attemptInputSchema, toPublicChallenge } from '../learning/domain/validation';
import type { InternalChallenge } from '../learning/domain/model';

describe('learning evidence contracts', () => {
  it('preserves provisional and final answers separately', () => {
    const parsed = attemptInputSchema.parse({
      challengeId: 'challenge-1',
      firstAnswerId: 'a',
      finalAnswerId: 'b',
      supportLevel: 'hint_1',
      answerRevealed: false,
      skipped: false,
      responseMs: 18_000,
    });
    expect(parsed.firstAnswerId).toBe('a');
    expect(parsed.finalAnswerId).toBe('b');
  });

  it('redacts internal answer and scheduling identity', () => {
    const challenge: InternalChallenge = {
      id: 'challenge-1', sessionId: 'session-1', unitId: 'unit-1', itemId: 'item-1',
      facet: 'meaning', target: 'novel_context_recognition', stage: 'delayed_novel', taskMode: 'meaning_choice',
      contextProvenance: 'synthetic', contextNovelty: 0.9,
      contextFingerprint: 'sha256:run-it-by-maya-first',
      promptZh: '這句最接近哪個意思？', excerptEn: 'Run it by Maya first.',
      options: [{ id: 'a', text: '先詢問 Maya 的意見' }],
      correctOptionId: 'a', hints: ['Maya 是接收想法的人。'], recommendedSupport: 'none',
      explanationZh: 'run something by someone 表示提出來徵詢意見。',
      decisiveCluesZh: ['run it by + 人，表示先把想法提出來徵詢意見。'],
      optionExplanations: [{ optionId: 'a', explanationZh: 'Maya 是接收想法並提供意見的人。' }],
      ambiguityNoteZh: null,
      evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge Dictionary', locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by' }],
      status: 'active', isOldItem: true,
    };
    const publicChallenge = toPublicChallenge(challenge);
    expect(publicChallenge).not.toHaveProperty('correctOptionId');
    expect(publicChallenge).not.toHaveProperty('itemId');
    expect(publicChallenge).not.toHaveProperty('isOldItem');
    expect(publicChallenge).not.toHaveProperty('stage');
    expect(publicChallenge).not.toHaveProperty('contextFingerprint');
    expect(publicChallenge).not.toHaveProperty('status');
  });

  it('rejects productive task modes', () => {
    expect(() => attemptInputSchema.parse({
      challengeId: 'challenge-1',
      firstAnswerId: null, finalAnswerId: null, supportLevel: 'none',
      answerRevealed: false, skipped: false, responseMs: 1000,
      taskMode: 'free_production',
    })).toThrow();
  });
});
```

- [ ] **Step 3: Write the failing architecture-boundary test**

Create `backend/src/__tests__/learningArchitecture.test.ts`. Recursively read `backend/src/learning/domain/**/*.ts` and fail if an import contains any of these fragments:

```ts
const forbidden = [
  'express', 'firebase', 'firebase-admin', '@google/genai',
  'cloudTasks', '/routes/', '/services/', '/water', '/harness', '/activities',
];
```

Also assert no domain file contains `Date.now(` or `process.env`.

- [ ] **Step 4: Run the tests and verify failure**

Run from `backend/`:

```powershell
npm test -- --runInBand src/__tests__/learningDomain.test.ts src/__tests__/learningArchitecture.test.ts
```

Expected: FAIL because `backend/src/learning/domain` does not exist.

- [ ] **Step 5: Define the closed domain types**

Create `backend/src/learning/domain/model.ts` with these exact unions and required fields:

```ts
export type Facet = 'meaning' | 'chunk' | 'syntax' | 'pragmatics';
export type MemoryTarget = 'source_recognition' | 'novel_context_recognition';
export type EvidenceStage =
  | 'explained' | 'immediate_source' | 'immediate_novel'
  | 'delayed_source' | 'delayed_novel' | 'organic_reencounter';
export type SupportLevel = 'none' | 'hint_1' | 'hint_2' | 'answer' | 'skip';
export type ContextProvenance = 'source' | 'scheduled_authentic' | 'synthetic';
export type KnowledgeKind = 'word' | 'collocation' | 'syntax' | 'pragmatics';
export type SenseStatus = 'resolved' | 'unresolved';
export type QualityStatus = 'verified' | 'unresolved' | 'suspended';
export type ChallengeStatus = 'active' | 'answered' | 'suspended';
export type ChallengeIssue = 'ambiguous' | 'wrong_evidence' | 'other';
export type RoundUnitRole = 'main' | 'additional';
export type NextStepPolicy = 'adaptive_minimum' | 'single_step';
export type RecognitionTaskMode =
  | 'meaning_choice' | 'chunk_choice' | 'syntax_choice' | 'pragmatics_choice';

export interface ValueSignals {
  personal: number;
  transfer: number;
  comprehension: number;
  recurrence: number;
  productiveIntent: 0;
}

export interface LanguageEvidence {
  sourceType: 'source_span' | 'dictionary' | 'corpus' | 'syntax' | 'synthetic';
  sourceName: string;
  locator: string;
  excerpt?: string;
}

export interface KnowledgeItem {
  id: string;
  expression: string;
  normalizedForm: string;
  senseKey: string;
  senseStatus: SenseStatus;
  qualityStatus: QualityStatus;
  kind: KnowledgeKind;
  facets: Facet[];
  value: ValueSignals;
  evidence: LanguageEvidence[];
  explicitRecognitionGoal: boolean;
  excludedByUser: boolean;
  createdAt: string;
}

export interface Occurrence {
  id: string;
  segmentId: string;
  surfaceForm: string;
  startOffset: number;
  endOffset: number;
  provenance: 'source';
}

export interface OccurrenceLink { occurrenceId: string; itemId: string }

export interface FacetMemory {
  itemId: string;
  facet: Facet;
  target: MemoryTarget;
  halfLifeHours: number;
  uncertainty: number;
  lastEvidenceAt: string | null;
  cooldownUntil: string | null;
  immediateUnaidedSuccesses: number;
  delayedUnaidedSuccesses: number;
}

export interface SourceContextRef {
  provenance: 'source' | 'scheduled_authentic';
  sourceId: string;
  sourceVersionId: string;
  segmentId: string;
  startOffset: number;
  endOffset: number;
  contextFingerprint: string;
  contextQuality: number;
  contextNovelty: number;
}

export type ChallengeBlueprint = {
  facet: Facet;
  target: MemoryTarget;
  stage: EvidenceStage;
  taskMode: RecognitionTaskMode;
  promptZh: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  hints: string[];
  recommendedSupport: 'none' | 'hint_1';
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  ambiguityNoteZh: string | null;
  evidence: LanguageEvidence[];
  contextNovelty: number;
} & (
  | { contextProvenance: 'synthetic'; templateId: string; excerptEn: string; contextFingerprint: string; contextQuality: number }
  | { contextProvenance: 'source' | 'scheduled_authentic'; segmentId: string; startOffset: number; endOffset: number; contextFingerprint: string; contextQuality: number }
);

export interface RoundUnit {
  id: string;
  sessionId: string;
  itemId: string;
  role: RoundUnitRole;
  nextStepPolicy: NextStepPolicy;
  status: 'pending' | 'active' | 'complete';
  attemptedFacets: Facet[];
  stepCount: number;
  maxSteps: 1 | 3;
  initialPlan: ChallengeBlueprint;
}
```

Define `InternalChallenge` as `ChallengeBlueprint` plus every identity/state field used in the test, including `id`, `sessionId`, `unitId`, `itemId`, `status: ChallengeStatus`, and `isOldItem`. Its context remains the same discriminated union: synthetic challenges store `excerptEn`; source-backed challenges (`source | scheduled_authentic`) store only `{ segmentId, startOffset, endOffset }` plus their fingerprint/quality, never copied source text. Define `PublicChallenge` as only `id`, `facet`, `taskMode`, resolved `excerptEn`, `options`, `hints`, `contextProvenance`, and `recommendedSupport`; it redacts every answer and feedback field until submission. Define `AttemptInput` with the tested request fields and `responseMs: number | null`. Define immutable `AttemptRecord` as `AttemptInput` plus server-derived `id`, `sessionId`, `unitId`, `itemId`, `facet`, `target`, `stage`, `contextProvenance`, `contextNovelty`, `contextFingerprint`, `correct`, `occurredAt`, and `answerHash`. A later immutable challenge-report event may invalidate an attempt for derived evidence without mutating the attempt document.

- [ ] **Step 6: Implement strict validation and redaction**

Create `backend/src/learning/domain/validation.ts`. Use `z.strictObject()` so unknown productive fields are rejected. Add these refinements:

- `skipped: true` requires `supportLevel: 'skip'`, both answer IDs `null`, and `answerRevealed: false`.
- `supportLevel: 'skip'` requires `skipped: true`; the two fields are an equivalence, not a one-way implication.
- `answerRevealed: true` requires `supportLevel: 'answer'`.
- `supportLevel: 'none'` requires a non-null `finalAnswerId`.
- `supportLevel: 'hint_1' | 'hint_2'` requires a non-null `finalAnswerId`, `answerRevealed: false`, and `skipped: false`.
- `supportLevel: 'answer'` requires `finalAnswerId: null`, `answerRevealed: true`, and `skipped: false`; a provisional `firstAnswerId` may remain so it is not erased.
- `responseMs` is either `null` or an integer from `0` through `1_800_000`; timing is diagnostic only and never controls correctness, evidence stage, or eligibility.
- IDs are non-empty strings of at most 128 characters.

Construct `PublicChallenge` field-by-field; never spread an internal challenge and delete fields afterward. The pure redaction helper accepts an already owner-authorized resolved excerpt. It never reads storage from the domain.

- [ ] **Step 7: Run backend checks**

Run from `backend/`:

```powershell
npm test -- --runInBand src/__tests__/learningDomain.test.ts src/__tests__/learningArchitecture.test.ts
npm run build
```

Expected: both tests PASS and TypeScript builds without output outside `backend/dist`.

- [ ] **Step 8: Commit**

```powershell
git add backend/package.json backend/package-lock.json backend/src/learning/domain backend/src/__tests__/learningDomain.test.ts backend/src/__tests__/learningArchitecture.test.ts
git commit -m "feat: define isolated learning domain contracts"
```

---

### Task 2: Facet Memory and Evidence-Safe Summaries

**Files:**
- Create: `backend/src/learning/domain/memory/retrievability.ts`
- Create: `backend/src/learning/domain/memory/updateMemory.ts`
- Create: `backend/src/learning/domain/memory/rebuildMemory.ts`
- Create: `backend/src/learning/domain/evidence/summarizeEvidence.ts`
- Test: `backend/src/__tests__/learningMemory.test.ts`
- Test: `backend/src/__tests__/learningEvidence.test.ts`

**Interfaces:**
- Consumes: `FacetMemory`, `AttemptRecord`, and `EvidenceStage` from Task 1.
- Produces: `computeRetrievability(memory, now)`, `updateMemory(memory, attempt, now)`, `EvidenceSummary`, and `summarizeEvidence(attempts)`.

- [ ] **Step 1: Write failing retrievability and update tests**

Create `backend/src/__tests__/learningMemory.test.ts`. Cover these exact cases:

```ts
expect(computeRetrievability(memory({ halfLifeHours: 48 }), new Date('2026-08-03T00:00:00.000Z')))
  .toBeCloseTo(0.5, 6);
```

- same-session novel unaided correct multiplies half-life by `1.2` and increments only `immediateUnaidedSuccesses`;
- delayed novel unaided correct multiplies half-life by `2` and increments `delayedUnaidedSuccesses`;
- organic reencounter unaided correct multiplies half-life by `2.2`;
- one-hint correct multiplies half-life by `1.05` and increments neither unaided counter;
- direct answer leaves half-life unchanged and sets a 24-hour cooldown;
- skip leaves half-life and uncertainty unchanged and sets a 6-hour cooldown;
- wrong multiplies only the challenged target's half-life by `0.75`, with a six-hour floor;
- a meaning attempt never changes a syntax memory object.
- rebuilding after an attempt ID is invalidated by a report starts from the default memory and replays only non-invalidated, chronologically ordered attempts for the exact same item/facet/target.

- [ ] **Step 2: Write failing evidence-language tests**

Create `backend/src/__tests__/learningEvidence.test.ts`:

```ts
it('does not inflate hinted same-session performance', () => {
  const summary = summarizeEvidence([
    attempt({ stage: 'immediate_source', supportLevel: 'hint_1', correct: true }),
    attempt({ stage: 'immediate_novel', supportLevel: 'skip', skipped: true, correct: false }),
  ]);
  expect(summary.headline).toBe('提示下能辨認；新語境尚無無提示證據');
  expect(JSON.stringify(summary)).not.toMatch(/學會|掌握|精通/);
});

it('names delayed unseen evidence precisely', () => {
  const summary = summarizeEvidence([
    attempt({ stage: 'delayed_novel', supportLevel: 'none', correct: true }),
  ]);
  expect(summary.headline).toBe('曾在延遲的未見情境中無提示辨認');
});
```

- [ ] **Step 3: Run tests and verify failure**

Run from `backend/`:

```powershell
npm test -- --runInBand src/__tests__/learningMemory.test.ts src/__tests__/learningEvidence.test.ts
```

Expected: FAIL because the memory and evidence modules do not exist.

- [ ] **Step 4: Implement deterministic memory updates**

`computeRetrievability()` returns `1` when `lastEvidenceAt` is null; otherwise calculate:

```ts
const elapsedHours = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);
return Math.pow(2, -elapsedHours / memory.halfLifeHours);
```

`updateMemory()` branches in this order: mismatched facet/target, skip, answer reveal, incorrect, hinted correct, unaided correct. Clamp uncertainty to `[0.05, 1]`; reduce it by `0.15` only for delayed unaided evidence and by `0.05` for immediate unaided evidence.

`rebuildMemory()` accepts immutable attempts plus an `invalidatedAttemptIds` set, filters by exact item/facet/target and absence from that set, sorts by `occurredAt` then attempt ID, and folds `updateMemory()` from the documented 24-hour/uncertainty-1 baseline. It exists for evidence-quality reports; never reverse a half-life multiplier algebraically.

- [ ] **Step 5: Implement ordered evidence summaries**

Define:

```ts
export interface EvidenceSummary {
  headline: string;
  details: string[];
  strongestStage: EvidenceStage;
}
```

Use precedence `organic_reencounter > delayed_novel > delayed_source > immediate_novel > immediate_source > explained`. Describe hint, direct-answer, and skip evidence explicitly. Never emit broad mastery labels.

- [ ] **Step 6: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningMemory.test.ts src/__tests__/learningEvidence.test.ts
npm run build
git add backend/src/learning/domain/memory backend/src/learning/domain/evidence backend/src/__tests__/learningMemory.test.ts backend/src/__tests__/learningEvidence.test.ts
git commit -m "feat: model learning memory and evidence"
```

Expected: tests PASS before the commit is created.

---

### Task 3: Eligibility, Priority, and Bounded Round Selection

**Files:**
- Create: `backend/src/learning/domain/selection/types.ts`
- Create: `backend/src/learning/domain/selection/eligibility.ts`
- Create: `backend/src/learning/domain/selection/priority.ts`
- Create: `backend/src/learning/domain/selection/selectRound.ts`
- Test: `backend/src/__tests__/learningSelection.test.ts`

**Interfaces:**
- Consumes: `KnowledgeItem`, `FacetMemory`, `Facet`, and `computeRetrievability()`.
- Produces: `SelectionCandidate`, `EligibilityResult`, `PriorityResult`, `SelectedRoundUnit`, `isEligible(candidate, now)`, `computePriority(candidate, now)`, and `selectRoundUnits(candidates, input, now)`.

- [ ] **Step 1: Write failing selection tests**

Define fixtures that prove:

- unresolved sense, non-verified quality, exclusion, context quality below `0.7`, active cooldown, and missing applicable facet are hard eligibility failures;
- uncertainty `1` cannot promote value below the eligibility threshold;
- value `>= 0.45`, comprehension `>= 0.8`, recurrence `>= 0.8`, or explicit recognition goal may pass the value gate;
- a high-value item at retrievability `0.6` outranks a low-value item at `0.3`;
- a verified seed with no attempts may receive dynamic first-challenge eligibility while an unresolved captured word may not;
- one new main unit plus at most two previously attempted additional units are selected;
- candidates are grouped by item so multiple facet candidates for the main item create one unit rather than duplicate units;
- weeks away still yields at most three units and no backlog count;
- when no new item exists, the best old item becomes main without a review label;
- when `currentSourceId` is supplied, the main item has `currentSourceFit: 1`; an item found only in another source can appear only as an additional old unit;
- deterministic ties sort by `item.id` ascending.

- [ ] **Step 2: Run test and verify failure**

```powershell
cd backend
npm test -- --runInBand src/__tests__/learningSelection.test.ts
```

Expected: FAIL because selection files do not exist.

- [ ] **Step 3: Define the exact candidate contract**

Create `types.ts`:

```ts
export interface SelectionCandidate {
  item: KnowledgeItem;
  memory: FacetMemory;
  facet: Facet;
  attemptCount: number;
  currentSourceFit: 0 | 1;
  contextQuality: number;
  transferGap: number;
  recentExposurePenalty: number;
  redundancyPenalty: number;
  ambiguityRisk: number;
}

export interface PriorityResult {
  score: number;
  reasons: string[];
  recommendedSupport: 'none' | 'hint_1';
}

export interface SelectedRoundUnit {
  itemId: string;
  initialCandidate: SelectionCandidate;
  role: 'main' | 'additional';
  nextStepPolicy: 'adaptive_minimum' | 'single_step';
  maxSteps: 1 | 3;
}
```

Clamp all repository-supplied numeric signals to `[0, 1]` before scoring.

- [ ] **Step 4: Implement eligibility and priority**

Use this first-slice value score:

```ts
const valueScore =
  0.30 * item.value.personal +
  0.25 * item.value.transfer +
  0.25 * item.value.comprehension +
  0.20 * item.value.recurrence;
```

Bound uncertainty contribution to `0.1`. Expected learning gain is `0.4` below retrievability `0.35`, `1` from `0.35` through `0.8`, `0.5` above `0.8` through `0.9`, and `0.1` above `0.9`. When predicted success is below `0.35`, return `recommendedSupport: 'hint_1'`.

- [ ] **Step 5: Implement bounded selection**

Group eligible candidates by `item.id`, sort each item's best facet by priority descending, then item ID ascending. When `currentSourceId` is non-null, choose the highest-priority `currentSourceFit: 1` item as main or return an empty selection when none exists. Without a source constraint, choose the best item globally. Select zero to two previously attempted, distinct old items as additional units. Main uses `adaptive_minimum` and `maxSteps: 3`; additions use `single_step` and `maxSteps: 1`. Return roles only to the application service; do not add role, unit count, or review identity to `PublicChallenge`.

- [ ] **Step 6: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningSelection.test.ts
npm run build
git add backend/src/learning/domain/selection backend/src/__tests__/learningSelection.test.ts
git commit -m "feat: rank and bound learning rounds"
```

Expected: test and build PASS before commit.

---

### Task 4: Firestore Documents, Deterministic IDs, Repository, and Rules

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Create: `backend/src/learning/application/ports.ts`
- Create: `backend/src/learning/adapters/firestore/documents.ts`
- Create: `backend/src/learning/adapters/firestore/ids.ts`
- Create: `backend/src/learning/adapters/firestore/firestoreLearningRepository.ts`
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`
- Test: `backend/src/__tests__/learningFirestoreRepository.emulator.test.ts`
- Test: `backend/src/__tests__/learningRules.emulator.test.ts`

**Interfaces:**
- Consumes: domain models and selection contracts from Tasks 1–3, Firebase Admin Firestore, and Firebase Rules Unit Testing.
- Produces: application-owned `ExtractedUnit` plus outbound ports `LearningRepository`, `LanguageExtractor`, `ChallengeBuilder`, and `LearningQueue`; versioned Firestore document types; `knowledgeItemId()`, `occurrenceId()`, `facetStateId()`; and an emulator-tested backend-only persistence boundary.

- [ ] **Step 1: Add Firestore Rules test tooling and script**

Run from `backend/`:

```powershell
npm install --save-dev @firebase/rules-unit-testing@^5 firebase@^12 firebase-tools@^14
```

Add this script to `backend/package.json`:

```json
"test:learning:emulator": "firebase emulators:exec --config ../firebase.json --project demo-wippy-learning --only firestore \"npm test -- --runInBand src/__tests__/learningFirestoreRepository.emulator.test.ts src/__tests__/learningRules.emulator.test.ts\""
```

- [ ] **Step 2: Define repository ports before the adapter**

Create `backend/src/learning/application/ports.ts` with this aggregate contract:

```ts
export interface LearningRepository {
  hasLearningAccess(userId: string): Promise<boolean>;
  createSourceAndRun(input: CreateSourceInput): Promise<{
    sourceId: string; sourceVersionId: string; runId: string;
  }>;
  getSource(userId: string, sourceId: string): Promise<LearningSourceView | null>;
  getSourceSpan(userId: string, input: { segmentId: string; startOffset: number; endOffset: number }): Promise<string | null>;
  findChallengeContext(userId: string, input: {
    itemId: string;
    sourceId: string | null;
    provenance: 'source' | 'scheduled_authentic';
    excludedFingerprints: string[];
  }): Promise<SourceContextRef | null>;
  getRun(userId: string, runId: string): Promise<LearningRunView | null>;
  listRunsNeedingEnqueue(nowIso: string, limit: number): Promise<Array<{ userId: string; runId: string }>>;
  claimRunEnqueue(input: ClaimRunEnqueueInput): Promise<'claimed' | 'already_active' | 'completed'>;
  finishRunEnqueue(input: FinishRunEnqueueInput): Promise<void>;
  claimRun(input: ClaimRunInput): Promise<ClaimedLearningRun | null>;
  listSourceSegments(userId: string, sourceVersionId: string): Promise<SourceSegmentView[]>;
  saveCaptureBatch(input: CaptureBatchInput): Promise<void>;
  completeRun(input: CompleteRunInput): Promise<void>;
  failRun(input: FailRunInput): Promise<void>;
  listSelectionCandidates(userId: string, input: { nowIso: string; limit: number; currentSourceId: string | null }): Promise<SelectionCandidate[]>;
  getKnowledgeItem(userId: string, itemId: string): Promise<KnowledgeItem | null>;
  saveRound(input: SaveRoundInput): Promise<{ roundId: string; firstChallengeId: string | null }>;
  getRoundState(userId: string, roundId: string): Promise<RoundStateView | null>;
  getInternalChallenge(userId: string, challengeId: string): Promise<InternalChallenge | null>;
  listAttemptEvidenceContext(userId: string, itemId: string, facet: Facet): Promise<{
    attempts: AttemptRecord[];
    invalidatedAttemptIds: string[];
  }>;
  recordAttemptAndAdvance(input: AttemptTransitionInput): Promise<RoundTransitionResult>;
  suspendChallengeReportAndAdvance(input: ReportTransitionInput): Promise<RoundTransitionResult>;
  listKnowledgeRecords(userId: string, input: { limit: number; cursor: string | null }): Promise<KnowledgeRecordPage>;
  setExcludedByUser(userId: string, itemId: string, excluded: boolean): Promise<boolean>;
}
```

In the same application port file, define `ExtractedUnit { item, occurrence, link }`, `LanguageExtractor.extract()`, `ChallengeBuilder`, and `LearningQueue.enqueue()`. Use this exact builder input:

```ts
export interface ChallengeBuilder {
  build(input: {
    item: KnowledgeItem;
    facet: Facet;
    target: MemoryTarget;
    stage: EvidenceStage;
    recommendedSupport: 'none' | 'hint_1';
    excludedContextFingerprints: string[];
    sourceContext: SourceContextRef | null;
  }): Promise<ChallengeBlueprint | null>;
}
```

`findChallengeContext()` returns the domain-owned `SourceContextRef`: it is owner-scoped, considers only published occurrences from completed source versions, enforces the optional current-source constraint, returns exact sentence-bounded offsets for an occurrence linked to the item, computes quality/novelty, filters excluded fingerprints, and returns `null` rather than an ungrounded fallback. `listAttemptEvidenceContext()` returns all immutable attempts for context-fingerprint exclusion plus the invalidation-ID set; capability/early-stop calculations must filter invalidated attempts, while context novelty must still exclude every previously shown fingerprint. Adapters implement these ports; application/domain code never imports an interface from `adapters/**`.

Define every referenced input/view type in the same file. `CreateSourceInput` contains server-derived `userId`, a validated client idempotency `requestId`, validated title/author/url/objective, injected `createdAt`, and pre-segmented `{ ordinal, text }[]`; it never contains an unsegmented body or direct document IDs. The repository derives source/version/run IDs from `userId + requestId` and stores a normalized payload hash. `LearningSourceView` contains source metadata, ordered segment text, and `verifiedItemCount`. `completeRun()` writes the final count onto the source document in the same transaction that marks the run/source version completed, so `GET source` and the reader CTA agree. `LearningRunView` exposes only `id`, `sourceId`, `status`, counts, safe error code, and timestamps. `SaveRoundInput` contains the application-allocated `roundId`, selected `RoundUnit[]` whose server-only `initialPlan` is a fully resolved `ChallengeBlueprint`, at most one materialized initial internal challenge, and injected time; repository validation requires every unit/challenge `sessionId` to equal `roundId`. Both transition inputs contain the current challenge, deterministic next challenge or null, updated unit/session cursor, and injected time; attempt transition additionally contains `AttemptRecord`, while report transition contains `ChallengeIssue` and optional detail. `RoundTransitionResult` is `{ replayed: boolean; nextChallengeId: string | null; roundComplete: boolean }`. `KnowledgeRecordPage` is the raw owner-scoped persistence projection; Task 6 alone maps it to the public `KnowledgePage` DTO.

- [ ] **Step 3: Define versioned Firestore documents and collection constants**

Use these top-level collections:

```ts
export const learningCollections = {
  access: 'learningAccess',
  sources: 'learningSources',
  sourceVersions: 'learningSourceVersions',
  segments: 'learningSegments',
  items: 'learningItems',
  sourceItems: 'learningSourceItems',
  occurrences: 'learningOccurrences',
  facetStates: 'learningFacetStates',
  sessions: 'learningSessions',
  roundUnits: 'learningRoundUnits',
  challenges: 'learningChallenges',
  challengeReports: 'learningChallengeReports',
  attempts: 'learningAttempts',
  runs: 'learningIngestionRuns',
  ingestionBatches: 'learningIngestionBatches',
} as const;
```

Every stored interface starts with `schemaVersion: 1` and `userId: string`. Store source body only in `learningSegments`, never in a run, session, trace, or item document.

Sources, segments, items, occurrences, facet states, attempts, reports, and access records are durable product data. Sessions, round units, and challenges receive `expiresAt` 90 days after creation. Terminal ingestion runs and top-level ingestion-batch markers receive `expiresAt` 30 days after completion/failure; active runs have no TTL until terminal. Use top-level batch markers so Firestore TTL does not leave orphaned subcollections.

`OccurrenceLink` is a domain/capture DTO, not a separate Firestore collection. The adapter materializes its item IDs into a deduplicated `itemIds: string[]` field on each `learningOccurrences` document. Each occurrence also denormalizes owner-checked `sourceId`, `sourceVersionId`, `contextFingerprint`, `contextQuality`, and `published: boolean` so a completed, source-constrained challenge context can be found with a bounded indexed query; this is why the occurrence composite indexes use `ARRAY_CONTAINS`.

Each `learningSourceItems` projection contains `userId`, `sourceId`, `sourceVersionId`, `itemId`, `qualityStatus`, `published`, and `capturedAt`. Capture batches may write projections, occurrences, canonical items, and initial facet states, but new source projections, occurrences, and facet states start with `published: false`. After all capture and catalog validation succeeds, the run enters `publishing`; idempotent publication batches set the completed version's source projections and occurrences to `published: true`, set verified facet states to `published: true`, and materialize `nextCandidateAt`, without overwriting an already-published canonical facet state with false. Only after every publication marker exists does the run/source version become `completed`. A crashed publication remains reclaimable and resumes its deterministic batches; a failed pre-publication run exposes no candidate or authentic challenge context. Never downgrade an already-published canonical item because a later run fails.

Global selection starts from at most 100 `learningFacetStates` with `published: true` and `nextCandidateAt <= now`, then applies Task 3's dynamic gates/ranking. Current-source selection first reads that one owned source version and requires `completed`, then queries bounded `learningSourceItems` by `sourceId`; it never performs one source-version read per candidate.

Every challenge-report document stores `challengeId`, `itemId`, `facet`, `target`, `issue`, optional detail, `invalidatedAttemptId | null`, and `createdAt`. Report invalidation loads attempts and invalidation events through the exact item/facet/target indexes before rebuilding memory.

- [ ] **Step 4: Write failing deterministic-ID and repository tests**

Use the Firestore emulator to prove:

1. `knowledgeItemId(userId, normalizedForm, senseKey)` is stable and differs across users or senses.
2. Two source versions containing the same canonical sense share one item document and retain separate occurrence documents.
3. One source span may point to a word and an overlapping collocation.
4. Attempts are append-only.
5. Replaying the same challenge-derived attempt ID with the same `answerHash` returns `replayed` without a second memory update.
6. Submitting the same challenge-derived attempt ID with a different `answerHash` throws `attempt_id_conflict`.
7. Attempt creation, one facet-memory update, current-unit completion/branch, next-challenge write, and session cursor advance succeed or fail in one transaction.
8. Exclusion survives later source captures.
9. A failed or pre-publication run contributes no selection candidate; a crashed `publishing` run resumes idempotently and cannot revert previously published state.
10. Listing candidates reads at most the requested `limit` and never scans unrelated users.
11. `suspendChallengeReportAndAdvance()` before submission creates one immutable report, suspends the challenge, completes the affected unit, and advances atomically without creating an attempt or touching facet memory; after submission its immutable report names `invalidatedAttemptId`, rebuilds only that facet/target memory from non-invalidated attempts, and preserves the stored transition without mutating the attempt.
12. `getSource()`, `getRun()`, and `listSourceSegments()` return `null` or an empty list for the wrong owner.
13. Replaying an attempt returns the originally stored `nextChallengeId` and `roundComplete` transition without creating a second branch.
14. Concurrent `claimRunEnqueue()` calls yield one claimant; `finishRunEnqueue()` changes status to queued only after acceptance or restores retryable after failure.
15. `saveRound()` accepts an explicitly allocated round ID, rejects mismatched unit/challenge session IDs, and supports an empty completed round without trying to infer an ID from a challenge.
16. `listRunsNeedingEnqueue()` returns at most the requested bound, ordered by `nextEnqueueAt`, and `claimRun()` may reclaim only a `running | publishing` run whose lease has expired.
17. A partially captured or failed source version never publishes facet states; completing a run finishes all deterministic publication batches before the final completed marker, and a previously published canonical item remains usable when a later source fails.
18. A current-source candidate query starts from `learningSourceItems` and returns at most 100 without scanning all occurrences or unrelated sources.
19. A verified worker delivery may claim `pending_enqueue` before HTTP enqueue acknowledgement; the later `finishRunEnqueue()` compare-and-set never changes `running`, `publishing`, or `completed` back to `queued`.
20. `getKnowledgeItem()` is owner-scoped, and every saved round unit retains its server-only, fully resolved `ChallengeBlueprint` (including source/scheduled-authentic span or synthetic template/text) so main-to-additional and report-to-next-unit transitions can be rebuilt deterministically without rediscovering context.
21. Concurrent submit/report transactions yield either a suspended pre-submit challenge with no attempt, or one immutable attempt plus an invalidating report and rebuilt memory; they never leave counted evidence on a reported challenge or advance twice.
22. Replaying `createSourceAndRun()` with the same user/request ID and payload returns the same source/run; a different payload with that request ID throws `source_request_conflict`.
23. Recapturing an existing canonical item, including concurrently with an attempt, never overwrites half-life, uncertainty, evidence timestamps, cooldown, counters, or `nextCandidateAt`; capture/publication initializes memory only when the facet-state document is absent.
24. `completeRun()` atomically exposes the same verified-item count through both run and owned-source views; before completion the source count remains zero.
25. `getSourceSpan()` verifies segment ownership and bounds; persisted source challenges contain only segment/offset references, while synthetic challenges may store their generated text.
26. Sessions/units/challenges and terminal runs/batch markers receive the documented TTL timestamps, while durable evidence/source/knowledge documents do not.
27. `findChallengeContext()` starts from bounded `published: true` occurrence queries, returns an exact sentence-bounded reference for an item occurrence in a completed owned source, honors `sourceId`, provenance, and excluded fingerprints, returns `null` for another owner or an incomplete source, and rejects invalid offsets/context quality rather than fabricating text.

- [ ] **Step 5: Write failing Firestore Rules tests**

Initialize owner and other-user authenticated contexts plus an unauthenticated context. Assert all three are denied direct reads and writes for every `learning*` collection. Admin SDK behavior is tested only through repository tests because Admin bypasses rules.

- [ ] **Step 6: Run emulator tests and verify failure**

Run from `backend/`:

```powershell
npm run test:learning:emulator
```

Expected: FAIL because repository files, rules, and indexes are not implemented.

- [ ] **Step 7: Implement deterministic IDs and the Firestore repository**

Use Node `createHash('sha256')` and return the first 40 hexadecimal characters:

```ts
export function stableId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u001f')).digest('hex').slice(0, 40);
}
```

Use stable IDs for items, occurrences, facet states, units, per-step challenges, and ingestion batch markers. Capture uses create-if-absent semantics for facet memory and only merges source/value metadata onto an existing state. `recordAttemptAndAdvance()` uses one Firestore transaction: read any existing attempt, the current internal challenge and its `active` status, latest facet-state, round unit, and session cursor; return the stored transition only when hashes match; reject suspended, already-consumed, or non-current challenges; otherwise create the immutable challenge-derived attempt, call Task 2's pure `updateMemory()` with the transaction's current memory, update exactly one facet-state and unit, write at most one deterministic next challenge, mark the current challenge consumed, and advance or complete the session. Never compute replacement memory from a stale pre-transaction read.

`claimRun()` transactionally changes `pending_enqueue | queued | retryable`, or `running | publishing` with an expired lease, to the appropriate active phase; it stores `workerId`, `leaseUntil`, and increments `attemptNumber`. A valid unexpired lease returns `null` to duplicate workers. `finishRunEnqueue()` uses its enqueue-claim token and compare-and-set semantics so late acknowledgement cannot regress worker progress. `saveCaptureBatch()` is idempotent by deterministic top-level `learningIngestionBatches/{batchId}` markers tied to `runId`.

`createSourceAndRun()` allocates server-side source, version, run, and segment IDs; each segment ID is stable from `sourceVersionId + ordinal + text hash`. It writes source metadata, one source version, the already-segmented body, and a `pending_enqueue` ingestion run atomically. Queue acknowledgement alone changes that run to `queued`. `suspendChallengeReportAndAdvance()` writes a deterministic report ID and all report/transition effects in one transaction. `hasLearningAccess()` reads only `learningAccess/{userId}` and requires both matching `userId` and `enabled: true`.

- [ ] **Step 8: Add rules and composite indexes**

Add explicit backend-only matches for all learning collections:

```text
match /learningSources/{id} { allow read, write: if false; }
```

Repeat for each collection constant, including top-level ingestion batch markers.

Add indexes required by these exact queries:

- `learningItems`: `userId ASC, qualityStatus ASC, excludedByUser ASC, updatedAt DESC`
- `learningFacetStates`: `userId ASC, published ASC, nextCandidateAt ASC, itemId ASC`
- `learningAttempts`: `userId ASC, itemId ASC, facet ASC, target ASC, occurredAt ASC`
- `learningChallengeReports`: `userId ASC, itemId ASC, facet ASC, target ASC, createdAt ASC`
- `learningOccurrences`: `userId ASC, sourceId ASC, published ASC, itemIds ARRAY_CONTAINS, startOffset ASC`
- `learningOccurrences`: `userId ASC, published ASC, itemIds ARRAY_CONTAINS, sourceVersionId DESC, startOffset ASC`
- `learningSourceItems`: `userId ASC, sourceId ASC, qualityStatus ASC, capturedAt DESC`
- `learningSourceItems`: `userId ASC, qualityStatus ASC, capturedAt DESC`
- `learningSegments`: `userId ASC, sourceVersionId ASC, ordinal ASC`
- `learningItems`: `userId ASC, updatedAt DESC, __name__ ASC`
- `learningIngestionRuns`: `userId ASC, createdAt DESC`
- `learningIngestionRuns`: `status ASC, nextEnqueueAt ASC`

- [ ] **Step 9: Run emulator and backend checks**

```powershell
npm run test:learning:emulator
npm test -- --runInBand src/__tests__/learningArchitecture.test.ts
npm run build
```

Expected: all commands PASS.

- [ ] **Step 10: Commit**

```powershell
git add backend/package.json backend/package-lock.json backend/src/learning/application/ports.ts backend/src/learning/adapters/firestore backend/src/__tests__/learningFirestoreRepository.emulator.test.ts backend/src/__tests__/learningRules.emulator.test.ts firestore.rules firestore.indexes.json
git commit -m "feat: persist isolated learning data in firestore"
```

---

### Task 5: Deterministic Total-Knowledge Capture and Reviewed Seed Challenges

**Files:**
- Create: `backend/src/learning/application/segmentSourceText.ts`
- Create: `backend/src/learning/application/captureSourceVersion.ts`
- Create: `backend/src/learning/adapters/extraction/deterministicExtractor.ts`
- Create: `backend/src/learning/adapters/extraction/reviewedSeedCatalog.ts`
- Create: `backend/src/learning/adapters/challenges/seedChallengeBuilder.ts`
- Test: `backend/src/__tests__/learningExtraction.test.ts`
- Test: `backend/src/__tests__/learningCaptureSource.test.ts`
- Test: `backend/src/__tests__/learningSeedChallenges.test.ts`

**Interfaces:**
- Consumes: `LearningRepository.saveCaptureBatch()`, domain models, and deterministic IDs from Task 4.
- Produces: `segmentSourceText(body)`, `ExtractedUnit`, `DeterministicExtractor`, `seedChallengeBuilder`, and `captureSourceVersion(input, deps)` implementations of the Task 4 application ports.

- [ ] **Step 1: Write failing extraction tests**

Use this fixture:

```ts
const text = 'Before building it, run the idea by a few users. Later, run the company with care.';
```

Assert that:

- every English word occurrence is captured with exact offsets;
- unresolved word items use `senseKey: 'unresolved-cluster'`, remain `qualityStatus: 'unresolved'`, and are ineligible;
- reviewed rules emit `run something by someone#seek-feedback` and `run a company#manage-business` as separate resolved items;
- the word `run` and each containing collocation have distinct item IDs and valid overlapping occurrences;
- only reviewed catalog entries may receive `qualityStatus: 'verified'`;
- every verified entry has at least one non-AI `dictionary | corpus | syntax` evidence record;
- no productive facet, task, or evidence is emitted.

- [ ] **Step 2: Write failing capture-service tests**

Use an in-memory `LearningRepository` fake to verify:

1. `segmentSourceText()` omits blank paragraphs while preserving non-empty paragraph order and returns no client-controlled IDs.
2. A persisted source version plus its segments becomes every occurrence and occurrence-item link.
3. Importing the same reviewed collocation from a second source reuses the item ID and retains both source occurrences.
4. Capture creates no session, attempt, success counter, or delayed evidence.
5. A batch retry writes identical deterministic IDs rather than duplicates.
6. Text over 50,000 characters is rejected before persistence.
7. More than 400 non-empty paragraphs is rejected before persistence so source/version/run/segments fit one Firestore transaction.

- [ ] **Step 3: Write failing reviewed-challenge tests**

For `run something by someone#seek-feedback`, require four recognition templates: meaning, chunk/roles, syntax ordering, and pragmatics versus `tell`. Each template has two or three plausible options, two progressive hints, Traditional Chinese explanation, decisive clues, one explanation per option, named evidence locators, nullable ambiguity note, and either source or explicitly synthetic provenance. Add source-template cases proving the builder consumes an owner-resolved `SourceContextRef`, returns a fully resolved `ChallengeBlueprint`, preserves its exact span/provenance/fingerprint, and returns `null` for a missing, low-quality, or invalid-bounds context. Add novel-target cases proving `sourceContext: null` performs no storage lookup and selects the lowest stable unseen synthetic `templateId`, while a source-recognition request with `sourceContext: null` returns `null`. Pragmatics uses `可能／一種讀法`; no template asserts author intent or requests free production.

- [ ] **Step 4: Run tests and verify failure**

```powershell
cd backend
npm test -- --runInBand src/__tests__/learningExtraction.test.ts src/__tests__/learningCaptureSource.test.ts src/__tests__/learningSeedChallenges.test.ts
```

Expected: FAIL because capture and challenge adapters do not exist.

- [ ] **Step 5: Implement extraction adapters and the reviewed seed catalog**

Import and implement Task 4's application-owned `LanguageExtractor`/`ExtractedUnit` contracts; do not redefine them under `adapters/**`.

Tokenize words with `/\b[A-Za-z][A-Za-z'-]*\b/g`. Use explicit reviewed phrase rules. Each reviewed rule contains `pattern`, canonical expression, sense key, applicable facets, value signals, and immutable evidence metadata. The initial catalog contains only:

- `run something by someone#seek-feedback`, citing `Cambridge Dictionary` at `https://dictionary.cambridge.org/us/dictionary/english/run-by`;
- `run a company#manage-business`, citing `Merriam-Webster Dictionary` at `https://www.merriam-webster.com/dictionary/run`, locator `transitive verb: to direct the business or activities of; manage, conduct`.

If a catalog record lacks evidence, throw `invalid_seed_catalog` at process startup rather than silently marking it verified.

- [ ] **Step 6: Implement idempotent source capture**

`segmentSourceText()` splits on one or more blank lines, rejects more than 400 non-empty paragraphs, and returns ordered `{ ordinal, text }` records. Task 4's repository creates stable segment IDs from `sourceVersionId + ordinal + text hash` and persists those segments before enqueueing. `captureSourceVersion()` loads the already-persisted segments, runs the extractor per segment, and sends batches of at most 400 Firestore operations to `saveCaptureBatch()`. It returns:

```ts
export interface CaptureSummary {
  segmentCount: number;
  capturedItemCount: number;
  capturedOccurrenceCount: number;
  verifiedItemCount: number;
}
```

For verified challengeable items, initialize facet-memory scheduling projections with the default half-life and null evidence. This initialization is scheduling state only: it must not create an attempt, success counter, or capability evidence, and it must not persist an eligibility verdict. Task 3 recomputes first-challenge eligibility whenever a round starts.

- [ ] **Step 7: Implement the seed challenge builder**

The builder accepts only a verified catalog item plus `facet`, `target`, `stage`, `excludedContextFingerprints`, and an optional owner-resolved `SourceContextRef` supplied by the application. It returns a fully resolved `ChallengeBlueprint` whose stable `contextFingerprint` is absent from that exclusion set, or `null` when no quality unseen template exists. A source/authentic build requires a context reference with `contextQuality >= 0.7`, validates its offsets, persists only its owned segment ID and exact offsets, and copies the reference's `source | scheduled_authentic` provenance; it never discovers or trusts storage context itself. Synthetic blueprints persist their reviewed `templateId`, text, and `contextProvenance: 'synthetic'`. A scheduled builder never emits `organic_reencounter`; that stage is reserved for evidence created from a later authentic source occurrence.

- [ ] **Step 8: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningExtraction.test.ts src/__tests__/learningCaptureSource.test.ts src/__tests__/learningSeedChallenges.test.ts
npm run build
git add backend/src/learning/application/segmentSourceText.ts backend/src/learning/application/captureSourceVersion.ts backend/src/learning/adapters/extraction backend/src/learning/adapters/challenges backend/src/__tests__/learningExtraction.test.ts backend/src/__tests__/learningCaptureSource.test.ts backend/src/__tests__/learningSeedChallenges.test.ts
git commit -m "feat: capture total learning knowledge deterministically"
```

Expected: tests and build PASS before commit.

---

### Task 6: Round and Attempt Application Services

**Files:**
- Create: `backend/src/learning/domain/round/nextStepPolicy.ts`
- Create: `backend/src/learning/application/createLearningRound.ts`
- Create: `backend/src/learning/application/submitLearningAttempt.ts`
- Create: `backend/src/learning/application/reportChallengeIssue.ts`
- Create: `backend/src/learning/application/listLearningKnowledge.ts`
- Test: `backend/src/__tests__/learningRoundApplication.test.ts`
- Test: `backend/src/__tests__/learningRoundPolicy.test.ts`
- Test: `backend/src/__tests__/learningAttemptApplication.test.ts`
- Test: `backend/src/__tests__/learningKnowledgeApplication.test.ts`

**Interfaces:**
- Consumes: selection, memory, evidence, challenge builder, and `LearningRepository` from Tasks 1–5.
- Produces: `createLearningRound(input, deps)`, `submitLearningAttempt(input, deps)`, `reportChallengeIssue(input, deps)`, and `listLearningKnowledge(input, deps)`.

- [ ] **Step 1: Write failing round-service tests**

Assert that `createLearningRound()`:

- requests no more than 100 candidate projections using `{ currentSourceId }`;
- selects one adaptive main unit plus at most two one-step additional units;
- when a source is supplied, never chooses a main item found only in another source;
- resolves every selected unit's context and calls the challenge builder before saving the round, so each unit persists one fully resolved server-only `ChallengeBlueprint`; for required `source_recognition`, another owner, an incomplete source, excluded fingerprint, invalid bounds, or no quality context causes that unit to be omitted rather than replaced with synthetic text. For `novel_context_recognition`, absence of unseen scheduled-authentic context triggers the documented reviewed-synthetic fallback, and the unit is omitted only when that fallback also has no unseen quality template;
- allocates round/unit/challenge IDs before persistence, materializes only the first blueprint as an internal challenge, persists all units and their blueprints plus that one challenge, and returns one redacted public challenge;
- returns `{ roundId, challenge: null, roundComplete: true }` without error when no item has a quality challenge;
- emits no due count, XP, review label, unfinished count, or backlog metadata;
- assigns `immediate_source` to first encounters, `immediate_novel` only to same-session unseen contexts, and `delayed_novel` only when prior evidence is at least 24 hours old and the context has not been used before.
- loads `listAttemptEvidenceContext()` for each selected item/facet; it excludes fingerprints from all prior attempts (including later-invalidated ones) but uses only non-invalidated attempts for capability, stage, and early-stop decisions. A novel target falls back from unseen scheduled-authentic context to an unseen reviewed-synthetic template; only when neither exists does it omit the challenge rather than re-label a repeated context as novel.
- labels a repeated authentic source context after 24 hours as `delayed_source`, never `delayed_novel` or `organic_reencounter`.

- [ ] **Step 2: Write failing attempt-service tests**

Assert that `submitLearningAttempt()`:

- loads the internal challenge server-side and ignores client claims about correctness;
- rejects any non-null first/final answer ID absent from the server challenge options with `invalid_answer_option`, creating no attempt, transition, or memory update;
- derives correctness from `finalAnswerId` while preserving `firstAnswerId`;
- derives the immutable attempt ID from `userId + challengeId`; the request schema has no client-supplied attempt ID and a second ID cannot create duplicate memory evidence;
- computes a stable `answerHash` from the normalized attempt payload;
- records skip without lowering memory;
- records direct answer without unaided success;
- updates only the challenged facet and target;
- returns the post-attempt answer, decisive clues, option-by-option reasons, named evidence locators, ambiguity note, exact `EvidenceSummary`, and at most one next public challenge;
- treats a network replay of the same attempt as success without applying memory twice;
- rejects a conflicting replay with `attempt_id_conflict`;
- ends an adaptive main unit after unaided success only when the challenged target is `novel_context_recognition` or the same item and facet already have valid unaided `novel_context_recognition` evidence; report-invalidated evidence never triggers early stop. An unaided first-source answer alone schedules at most one verified unseen novel-context comparison;
- after a hint, direct answer, or wrong response, creates only one targeted next comparison on the same item, stopping after sufficient evidence or three main-unit steps;
- completes skip without a remedial branch and makes every additional unit exactly one step;
- after main completion or a pre-submit report, loads the next unit's owner-scoped knowledge item and materializes that unit's already-resolved blueprint with deterministic IDs as exactly one next challenge; it never reselects source context or regenerates options, and completing a unit does not imply `roundComplete` while another selected unit remains;
- never creates more than five total challenge steps and never returns remaining-step metadata;
- never creates productive C evidence.

Add pure `learningRoundPolicy.test.ts` cases for `chooseNextStep()`: unaided source recognition without prior novel evidence creates one unseen novel-context comparison; unaided novel-context recognition completes the main unit; prior valid unaided novel evidence for the same item/facet/target permits early completion; evidence for another facet or an invalidated attempt does not; invalidated fingerprints still cannot be reused; skip; single-step additional; per-unit cap; global five-step cap; supported/wrong response with an unattempted applicable facet; and supported/wrong response falling back to an unseen novel context on the same facet. Add application tests proving a current-source first challenge requests only `source`, a novel target requests `scheduled_authentic` then falls back once to synthetic without a second lookup, cross-owner/incomplete/missing required source context yields a safe empty/next-unit result, and main completion, skip, or report still returns an additional unit's initial challenge when one was selected.

- [ ] **Step 3: Write failing challenge-report and knowledge tests**

Assert that reporting `ambiguous`, `wrong_evidence`, or `other`:

- creates an immutable report event;
- changes the internal challenge to `suspended`;
- before submission, creates no attempt or memory update and advances neutrally;
- after submission, records an immutable invalidation reference to that attempt, rebuilds only the affected facet/target memory from remaining non-invalidated attempts, and preserves the already-determined next transition;
- prevents the challenge from being selected again.

For pragmatics and author-effect feedback, assert explanations use `可能／一種讀法` and cite observable wording; they never state an author's private intention as fact.

Assert that the knowledge view:

- includes unresolved and excluded items;
- groups occurrences under canonical expression and sense;
- reports meaning, chunk, syntax, and pragmatics evidence independently;
- uses `尚無證據` rather than `不會` when a facet has no attempt;
- never uses `已學會`, `精通`, or another permanent mastery label.
- excludes report-invalidated attempts from strongest-stage summaries while retaining their audit events.

- [ ] **Step 4: Run tests and verify failure**

```powershell
cd backend
npm test -- --runInBand src/__tests__/learningRoundPolicy.test.ts src/__tests__/learningRoundApplication.test.ts src/__tests__/learningAttemptApplication.test.ts src/__tests__/learningKnowledgeApplication.test.ts
```

Expected: FAIL because application services do not exist.

- [ ] **Step 5: Implement the application contracts**

Use these signatures:

```ts
export async function createLearningRound(
  input: { userId: string; sourceId: string | null; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{ roundId: string; challenge: PublicChallenge | null; roundComplete: boolean }>;

export async function submitLearningAttempt(
  input: { userId: string; attempt: AttemptInput; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{
  feedback: ChallengeFeedback;
  evidence: EvidenceSummary;
  replayed: boolean;
  nextChallenge: PublicChallenge | null;
  roundComplete: boolean;
}>;

export async function reportChallengeIssue(
  input: { userId: string; challengeId: string; issue: 'ambiguous' | 'wrong_evidence' | 'other'; detail: string | null; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{ suspended: true; evidenceInvalidated: boolean; nextChallenge: PublicChallenge | null; roundComplete: boolean }>;
```

`LearningIdFactory` is an injected `{ create(kind: 'round' | 'unit' | 'challenge'): string }`; production uses `crypto.randomUUID()` and tests use deterministic IDs. This avoids a session-ID/challenge-ID persistence cycle. Derive `attempt.id` from `challenge.id`, not from client input.

At round creation, load each selected owner-scoped `KnowledgeItem` and build its initial blueprint deterministically. A `source_recognition` plan must resolve `findChallengeContext(... provenance: 'source', sourceId: currentSourceId)` and is omitted if none exists. A `novel_context_recognition` plan first requests an unseen `scheduled_authentic` context with `sourceId: null`; when none exists, it passes `sourceContext: null` so the reviewed builder may choose the lowest stable unseen synthetic `templateId`. Call the builder once and persist its fully resolved `ChallengeBlueprint` as the unit's server-only `initialPlan`. The first unit's blueprint is materialized immediately; when a later selected unit begins, load its item only to confirm it remains present/verified/not suspended, then materialize the stored blueprint with deterministic IDs—do not call `findChallengeContext()` or the builder again. For an adaptive same-item branch created after an attempt, repeat the same authentic-first/synthetic-fallback rule with all prior fingerprints and persist that next challenge in the transition. A missing/suspended item, missing required source context, or `null` builder result completes/omits that unit safely without fabricating a challenge.

Before serializing a source challenge, resolve its segment/offset reference with owner-scoped `getSourceSpan()` and pass the result into redaction. A missing or out-of-bounds span suspends that challenge as invalid context and never falls back to ungrounded AI text.

`chooseNextStep()` is framework-free. It returns `complete_unit` for skip, a single-step additional, unit cap, global cap, or unaided correct only when the current target is `novel_context_recognition` or valid non-invalidated unaided `novel_context_recognition` evidence already exists for the same item and facet. An unaided `source_recognition` answer without such evidence requests at most one unseen novel-context comparison. Otherwise it chooses the highest-priority applicable facet without round evidence; when none exists, it may request one unseen novel-context comparison on the same facet. If the challenge builder has no verified unseen template, complete the unit. `complete_unit` advances to the next selected unit when present; it does not by itself mean the round is complete.

Define `ChallengeFeedback` with `correctOptionId`, `explanationZh`, `decisiveCluesZh[]`, `optionExplanations[{ optionId, explanationZh }]`, named language `evidence[]`, and nullable `ambiguityNoteZh`. Only a successful attempt result—including direct answer—exposes it. Challenge-report results never expose answer or feedback fields, whether reported before or after submission. Use a default new-memory half-life of 24 hours and uncertainty `1`. Store priority reasons for the knowledge view, but never include them in a public challenge.

- [ ] **Step 6: Implement paginated knowledge projection**

`listLearningKnowledge()` accepts `limit` from 1 through 50 and an opaque cursor. It returns:

```ts
export interface KnowledgePage {
  items: KnowledgeItemView[];
  nextCursor: string | null;
}
```

Each item includes source titles, occurrence count, eligibility, collapsed priority reasons, and one `EvidenceSummary | null` per applicable facet.

- [ ] **Step 7: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningRoundPolicy.test.ts src/__tests__/learningRoundApplication.test.ts src/__tests__/learningAttemptApplication.test.ts src/__tests__/learningKnowledgeApplication.test.ts
npm run build
git add backend/src/learning/domain/round backend/src/learning/application backend/src/__tests__/learningRoundPolicy.test.ts backend/src/__tests__/learningRoundApplication.test.ts backend/src/__tests__/learningAttemptApplication.test.ts backend/src/__tests__/learningKnowledgeApplication.test.ts
git commit -m "feat: create evidence-safe learning rounds"
```

Expected: tests and build PASS before commit.

---

### Task 7: Learning Access Gate and Idempotent Cloud Tasks Ingestion

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Create: `backend/src/learning/application/checkLearningAccess.ts`
- Create: `backend/src/learning/adapters/jobs/inlineLearningQueue.ts`
- Create: `backend/src/learning/adapters/jobs/cloudTasksLearningQueue.ts`
- Create: `backend/src/learning/adapters/jobs/verifyLearningTaskToken.ts`
- Create: `backend/src/learning/application/runLearningIngestion.ts`
- Create: `backend/src/learning/application/retryLearningIngestion.ts`
- Create: `backend/src/learning/application/reconcileLearningEnqueues.ts`
- Create: `backend/src/learning/http/internalLearningRouter.ts`
- Create: `backend/src/scripts/setLearningAccess.ts`
- Modify: `backend/src/app.ts`
- Modify: `deployment/production.env`
- Modify: `.github/workflows/deploy.yml`
- Create: `docs/learning-infrastructure.md`
- Test: `backend/src/__tests__/learningAccess.test.ts`
- Test: `backend/src/__tests__/learningQueue.test.ts`
- Test: `backend/src/__tests__/learningIngestionWorker.test.ts`
- Test: `backend/src/__tests__/internalLearningRouter.test.ts`

**Interfaces:**
- Consumes: repository run methods and source capture from Tasks 4–5.
- Produces: `LearningAccessPolicy`, `LearningQueue`, `CloudTasksLearningQueue`, OIDC-verified internal ingestion/reconciliation, and a canary access script.

- [ ] **Step 1: Add explicit Cloud Tasks/OIDC dependencies and access script**

Run from `backend/`:

```powershell
npm install @google-cloud/tasks@^6 google-auth-library@^10
```

Add:

```json
"learning:access": "ts-node src/scripts/setLearningAccess.ts"
```

- [ ] **Step 2: Write failing access tests**

Assert that:

- missing `learningAccess/{uid}` returns disabled;
- `{ enabled: true }` returns enabled;
- `{ enabled: false }` returns disabled;
- the access record is backend-only and never read from a client-controlled user field;
- disabling access immediately blocks new imports and rounds but does not delete data.

- [ ] **Step 3: Write failing queue and worker tests**

Assert that:

1. Production without all required `LEARNING_*` queue variables fails with `learning_queue_not_configured`; it never falls back to an inline long-running request.
2. Development may use an explicitly injected `InlineLearningQueue`.
3. Cloud Task names are deterministic from `runId`, and provider `ALREADY_EXISTS` is accepted as success for that same name.
4. The HTTP request includes an OIDC token configuration, exact worker audience, and no shared-secret fallback.
5. A duplicate delivery cannot acquire an unexpired run lease and returns retryable 503 `lease_active` with bounded `Retry-After`; a running lease becomes reclaimable only after expiry, while a completed run returns 2xx.
6. A completed run returns success without recapturing.
7. A retryable infrastructure failure records `retryable`; invalid source/catalog data records `failed` and returns 2xx to stop retry.
8. The worker never stores source body or raw text in operational logs.
9. A missing, invalid, wrong-audience, or wrong-service-account token returns 401/403 before Firestore access.
10. Shutdown or one failed delivery never scans or rewrites unrelated runs; recovery uses only bounded reconciliation, per-run leases, and Cloud Tasks retry.
11. An owned `retryable` run can be claimed for enqueue exactly once; concurrent retry requests do not create duplicate tasks, and a second enqueue failure leaves a recoverable `queue_unavailable` state.
12. Reconciliation reads at most 50 due `pending_enqueue | retryable` runs and processes each through the same claim/finish methods.
13. Delivery before enqueue acknowledgement is safe: worker claim from `pending_enqueue` succeeds and the late acknowledgement cannot regress `running | publishing | completed`.
14. `InlineLearningQueue.enqueue()` schedules ingestion on the next event-loop turn and resolves immediately; it never awaits the worker inside the source HTTP request.
15. A crash during `publishing` is reclaimed after lease expiry, skips completed publication batches, and finalizes the source exactly once.

- [ ] **Step 4: Run tests and verify failure**

```powershell
cd backend
npm test -- --runInBand src/__tests__/learningAccess.test.ts src/__tests__/learningQueue.test.ts src/__tests__/learningIngestionWorker.test.ts src/__tests__/internalLearningRouter.test.ts
```

Expected: FAIL because access and queue modules do not exist.

- [ ] **Step 5: Implement access and queue contracts**

Define:

```ts
export interface LearningAccessPolicy {
  isEnabled(userId: string): Promise<boolean>;
}
```

Use Task 4's application-owned `LearningQueue` port; `cloudTasksLearningQueue.ts` and the emulator-only inline queue are adapters and never define a competing interface.

`CloudTasksLearningQueue` requires these non-empty variables in production:

```text
LEARNING_TASKS_PROJECT
LEARNING_TASKS_LOCATION
LEARNING_TASKS_QUEUE
LEARNING_WORKER_URL
LEARNING_WORKER_AUDIENCE
LEARNING_TASKS_SERVICE_ACCOUNT
```

Create task name `projects/{project}/locations/{location}/queues/{queue}/tasks/learning-{runId}` and send `{ runId }` only. Set `oidcToken.serviceAccountEmail`, `oidcToken.audience`, and a nine-minute dispatch deadline; do not add `X-Harness-Secret`. Treat gRPC/HTTP `ALREADY_EXISTS` as accepted success and classify every other provider error before retry.

- [ ] **Step 6: Implement leased ingestion and the internal router**

`runLearningIngestion()` claims a fifteen-minute lease using an injected `workerId` and `now`, longer than the nine-minute task deadline, including reclaim of a running/publishing run only after `leaseUntil`; it loads the owned source version, captures and validates all deterministic batches, enters `publishing`, publishes verified facet states through idempotent batches, then marks the source/run completed and stores counts. Retryable runs retain `resumePhase: 'capture' | 'publish'` so a publication retry never restarts or downgrades capture state. It catches only classified retryable infrastructure errors for Cloud Tasks retry; schema, source, and catalog errors before publication become terminal run failures.

`retryLearningIngestion()` verifies ownership and `retryable` status, transactionally claims an enqueue attempt, calls the queue, and changes the run to `queued` only after task acceptance. Already queued/running/completed states return their current status idempotently.

`reconcileLearningEnqueues()` is the bounded outbox repair path. It lists at most 50 due `pending_enqueue | retryable` runs, invokes the same claim/enqueue/finish sequence, applies capped exponential `nextEnqueueAt` backoff on classified queue failure, and never loads source bodies. This closes the Firestore-commit/process-crash gap between source creation and Cloud Tasks acceptance.

Mount the worker at `/api/internal/learning/ingest` and the bounded reconciler at `/api/internal/learning/reconcile` under:

```ts
app.use('/api/internal/learning', express.json({ limit: '32kb' }), internalLearningRouter);
```

Verify the OIDC ID token against `LEARNING_WORKER_AUDIENCE` and require the token email to equal `LEARNING_TASKS_SERVICE_ACCOUNT` before invoking either handler.

- [ ] **Step 7: Make production infrastructure reproducible**

Add these non-secret values to `deployment/production.env`:

```text
LEARNING_TASKS_PROJECT=wippy-mvp
LEARNING_TASKS_LOCATION=asia-east1
LEARNING_TASKS_QUEUE=wippy-learning-ingestion
LEARNING_TASKS_SERVICE_ACCOUNT=wippy-learning-tasks@wippy-mvp.iam.gserviceaccount.com
LEARNING_RECONCILE_JOB=wippy-learning-reconcile
```

Update deploy workflow environment variables so the worker URL is `${CLOUD_RUN_URL}/api/internal/learning/ingest` and audience is `${CLOUD_RUN_URL}`.

Document exact one-time `gcloud` commands in `docs/learning-infrastructure.md` to create the service account and queue, then grant: the Cloud Run runtime service account `roles/cloudtasks.enqueuer`; that runtime identity `roles/iam.serviceAccountUser` on the task OIDC service account; the task OIDC service account `roles/run.invoker` on `wippy-backend`; the Cloud Tasks service agent `roles/iam.serviceAccountTokenCreator` on the task service account; and the corresponding Cloud Scheduler service-agent/token permissions. Create a once-per-minute Scheduler job calling `/api/internal/learning/reconcile` with the verified OIDC identity. The document must include commands to print each principal, inspect every IAM binding, verify the queue and scheduler, pause the scheduler, and perform a safe rollback that disables access without deleting data.

The same document includes these exact TTL operations, each with `--project=wippy-mvp`: `gcloud firestore fields ttls update expiresAt --collection-group=learningSessions --enable-ttl`, repeated for `learningRoundUnits`, `learningChallenges`, `learningIngestionRuns`, and `learningIngestionBatches`, followed by `gcloud firestore fields ttls list`. Do not enable TTL on durable source, knowledge, attempt, or report collections.

- [ ] **Step 8: Implement the canary-access script**

`setLearningAccess.ts` accepts exactly:

```powershell
npm run learning:access -- --uid <firebase-uid> --enabled true
```

Reject missing UID and values other than `true | false`. Write `learningAccess/{uid}` with `schemaVersion: 1`, `userId`, `enabled`, and server timestamp.

- [ ] **Step 9: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningAccess.test.ts src/__tests__/learningQueue.test.ts src/__tests__/learningIngestionWorker.test.ts src/__tests__/internalLearningRouter.test.ts
npm run build
git add backend/package.json backend/package-lock.json backend/src/learning backend/src/scripts/setLearningAccess.ts backend/src/app.ts backend/src/__tests__/learningAccess.test.ts backend/src/__tests__/learningQueue.test.ts backend/src/__tests__/learningIngestionWorker.test.ts backend/src/__tests__/internalLearningRouter.test.ts deployment/production.env .github/workflows/deploy.yml docs/learning-infrastructure.md
git commit -m "feat: queue canary learning ingestion safely"
```

Expected: tests and build PASS before commit.

---

### Task 8: Authenticated Learning HTTP API

**Files:**
- Create: `backend/src/learning/http/learningErrors.ts`
- Create: `backend/src/learning/http/learningSchemas.ts`
- Create: `backend/src/learning/http/learningAccessMiddleware.ts`
- Create: `backend/src/learning/http/learningRouter.ts`
- Create: `backend/src/learning/application/container.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/src/__tests__/learningApi.integration.test.ts`

**Interfaces:**
- Consumes: Firebase `authMiddleware`, access policy, queue, repository, and application services from Tasks 4–7.
- Produces: authenticated `/api/learning/*` endpoints and a dependency-injectable learning container.

- [ ] **Step 1: Write failing route-integration tests**

Test exact behavior:

- `GET /api/learning/access`: 401 without Firebase token; 200 `{ enabled: false }` without access; 200 `{ enabled: true }` with access.
- All other routes: 401 without Firebase token and 404 `{ error: 'Not found', code: 'not_found' }` when access is disabled.
- `POST /api/learning/sources`: 202 for valid pasted text; 400 for blank title/body, more than 400 non-empty paragraphs, or other limit violations; strict validation rejects unknown `userId`; same request ID/payload returns the existing source/run and current safe status, while conflicting reuse returns 409. A definite enqueue failure is accepted as `retryable` because the source is safely stored and reconcilable.
- `GET /api/learning/sources/:sourceId`: returns owned source metadata and maps ordered internal segments to public `paragraphs`; another user's ID returns 404.
- `GET /api/learning/runs/:runId`: returns only the authenticated user's safe run view; another user's ID returns 404.
- `POST /api/learning/runs/:runId/retry`: re-enqueues only an owned `retryable` run and is idempotent when already queued/running/completed.
- `POST /api/learning/rounds`: 201 with one redacted first challenge or an explicit complete/empty result; a supplied `sourceId` constrains the main unit to that source.
- `POST /api/learning/attempts`: 200 with post-attempt feedback/evidence, optional next challenge, and `roundComplete`; 400 `invalid_answer_option` for an answer ID outside server options with no write; 404 for unknown/suspended challenge; 409 for a conflicting replay of the same challenge.
- `POST /api/learning/challenges/:id/reports`: 200 with suspension, evidence-invalidation status, optional next challenge, and `roundComplete`.
- `GET /api/learning/knowledge?limit=20&cursor=opaqueCursor123`: returns a bounded page.
- `PATCH /api/learning/knowledge/:itemId`: accepts only `{ excludedByUser: boolean }`.
- Every `/api/learning/*` response, including access and owned source paragraphs, includes `Cache-Control: private, no-store`.
- Pre-attempt challenge responses contain no answer keys. Post-attempt feedback may contain the correct option and cited language evidence. Only the authenticated owned-source endpoint may return raw source paragraphs; run, round, challenge, attempt, report, and knowledge responses never return source bodies. No response contains stack traces, raw Firestore paths, priority scores, or review identity.

- [ ] **Step 2: Run route tests and verify failure**

```powershell
cd backend
npm test -- --runInBand src/__tests__/learningApi.integration.test.ts
```

Expected: FAIL because the learning router does not exist.

- [ ] **Step 3: Implement strict request schemas and error mapping**

Use `z.strictObject()` for every body. The source schema is:

```ts
export const createSourceSchema = z.strictObject({
  requestId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().max(200).optional(),
  url: z.string().trim().url().max(2048).refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Only http/https URLs are allowed').optional(),
  learningObjective: z.string().trim().max(500).optional(),
  body: z.string().min(1).refine(value => Array.from(value).length <= 50_000, 'Source exceeds 50,000 characters'),
});
```

Every error is:

```ts
export interface LearningApiError {
  error: string;
  code: string;
}
```

The challenge-report schema is `z.strictObject({ issue: z.enum(['ambiguous', 'wrong_evidence', 'other']), detail: z.string().trim().max(500).nullable().optional() })`. The attempt schema reuses Task 1's validated `attemptInputSchema`; routes never maintain a looser duplicate.

This deliberately matches WiPPY's existing `getResponseErrorMessage()` contract in `frontend/src/lib/apiError.ts`. Map ownership failures to 404, validation to 400, conflicting idempotency keys to 409, queue failure before any source was persisted to 503, and unexpected failures to a generic 500.

- [ ] **Step 4: Implement container and routes**

`container.ts` exports `getLearningContainer()` and `setLearningContainerForTests(container | null)`. Production construction is lazy and wires one Firestore repository, access policy, Cloud Tasks queue, deterministic extractor, seed challenge builder, and injected clock factory.

Mount:

```ts
app.use('/api/learning', express.json({ limit: '256kb' }), learningRouter);
```

Apply `authMiddleware` to every route. Apply access middleware to every route except `/access`. Obtain `userId` only from `req.userId`.

Install one router-level response middleware before handlers to set `Cache-Control: private, no-store` on success and error responses.

For `POST /sources`, validate the body, call `segmentSourceText(body)`, pass only the resulting ordered segments to idempotent `createSourceAndRun()`, then enqueue only when the returned run is `pending_enqueue | retryable`. A replay whose run is queued/running/publishing/completed returns that current safe status without enqueueing another task. If enqueueing fails after persistence, mark the run `retryable` with safe code `queue_unavailable` and return 202 with the source/run IDs so the UI can recover; never report `queued` when no task was accepted. `POST /runs/:runId/retry` acquires an idempotent enqueue claim, retries the same run, and leaves it `retryable` on another queue failure.

- [ ] **Step 5: Run backend checks and commit**

```powershell
npm test -- --runInBand src/__tests__/learningApi.integration.test.ts
npm run build
git add backend/src/learning/http backend/src/learning/application/container.ts backend/src/app.ts backend/src/__tests__/learningApi.integration.test.ts
git commit -m "feat: expose authenticated learning APIs"
```

Expected: route tests and build PASS before commit.

---

### Task 9: WiPPY Learning Client Boundary, Access State, and Nested Shell

**Files:**
- Create: `frontend/src/learning/api/types.ts`
- Create: `frontend/src/learning/api/learningApi.ts`
- Create: `frontend/src/learning/api/LearningApiContext.tsx`
- Create: `frontend/src/learning/access/LearningAccessProvider.tsx`
- Create: `frontend/src/learning/access/useLearningAccess.ts`
- Create: `frontend/src/learning/layout/LearningAccessGate.tsx`
- Create: `frontend/src/learning/layout/LearningShell.tsx`
- Create: `frontend/src/learning/pages/LearningHomePage.tsx`
- Create: `frontend/src/learning/index.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Test: `frontend/src/__tests__/LearningRouting.test.tsx`
- Test: `frontend/src/__tests__/LearningArchitecture.test.ts`

**Interfaces:**
- Consumes: authenticated `/api/learning/*` endpoints from Task 8 and WiPPY's existing Firebase `auth` instance.
- Produces: a replaceable `LearningApi`, owner-aware access state, one `/learn/*` product surface, and exactly one WiPPY navigation entry.

- [ ] **Step 1: Define frontend DTOs and the injectable client contract**

Mirror public HTTP DTOs without importing backend source files. Define:

```ts
export interface LearningApi {
  getAccess(): Promise<{ enabled: boolean }>;
  createSource(input: CreateLearningSourceRequest): Promise<{ sourceId: string; runId: string; status: LearningRunStatus }>;
  getSource(sourceId: string): Promise<LearningSourceView>;
  getRun(runId: string): Promise<LearningRunView>;
  retryRun(runId: string): Promise<LearningRunView>;
  createRound(input: { sourceId?: string }): Promise<LearningRoundView>;
  submitAttempt(input: SubmitLearningAttemptRequest): Promise<AttemptResultView>;
  reportChallenge(challengeId: string, input: ChallengeReportRequest): Promise<ChallengeReportResultView>;
  listKnowledge(input: { limit: number; cursor?: string }): Promise<KnowledgePageView>;
  setKnowledgeExcluded(itemId: string, excludedByUser: boolean): Promise<{ excludedByUser: boolean }>;
}
```

Define the public DTOs explicitly:

```ts
export type LearningFacet = 'meaning' | 'chunk' | 'syntax' | 'pragmatics';
export type LearningSupportLevel = 'none' | 'hint_1' | 'hint_2' | 'answer' | 'skip';
export type LearningEvidenceStage =
  | 'explained' | 'immediate_source' | 'immediate_novel'
  | 'delayed_source' | 'delayed_novel' | 'organic_reencounter';
export type LearningRunStatus = 'pending_enqueue' | 'queued' | 'running' | 'publishing' | 'retryable' | 'completed' | 'failed';

export interface CreateLearningSourceRequest {
  requestId: string;
  title: string;
  author?: string;
  url?: string;
  learningObjective?: string;
  body: string;
}

export interface LearningSourceView {
  id: string;
  title: string;
  author: string | null;
  url: string | null;
  learningObjective: string | null;
  paragraphs: Array<{ id: string; ordinal: number; text: string }>;
  verifiedItemCount: number;
}

export interface LearningRunView {
  id: string;
  sourceId: string;
  status: LearningRunStatus;
  counts: { segments: number; items: number; occurrences: number; verifiedItems: number } | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicLearningChallenge {
  id: string;
  facet: LearningFacet;
  taskMode: 'meaning_choice' | 'chunk_choice' | 'syntax_choice' | 'pragmatics_choice';
  promptZh: string;
  excerptEn: string;
  options: Array<{ id: string; text: string }>;
  hints: string[];
  contextProvenance: 'source' | 'scheduled_authentic' | 'synthetic';
  recommendedSupport: 'none' | 'hint_1';
}

export interface SubmitLearningAttemptRequest {
  challengeId: string;
  firstAnswerId: string | null;
  finalAnswerId: string | null;
  supportLevel: LearningSupportLevel;
  answerRevealed: boolean;
  skipped: boolean;
  responseMs: number | null;
}

export interface EvidenceSummaryView {
  headline: string;
  details: string[];
  strongestStage: LearningEvidenceStage;
}

export interface AttemptResultView {
  feedback: ChallengeFeedbackView;
  evidence: EvidenceSummaryView;
  replayed: boolean;
  nextChallenge: PublicLearningChallenge | null;
  roundComplete: boolean;
}
```

Define:

```ts
export interface ChallengeFeedbackView {
  correctOptionId: string;
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  evidence: Array<{ sourceType: string; sourceName: string; locator: string }>;
  ambiguityNoteZh: string | null;
}

export interface ChallengeReportResultView {
  suspended: true;
  evidenceInvalidated: boolean;
  nextChallenge: PublicLearningChallenge | null;
  roundComplete: boolean;
}
```

`LearningRoundView` is `{ roundId: string; challenge: PublicLearningChallenge | null; roundComplete: boolean }`. `ChallengeReportRequest` is `{ issue: 'ambiguous' | 'wrong_evidence' | 'other'; detail?: string | null }`. `KnowledgePageView` mirrors Task 6's paginated view and uses one `EvidenceSummaryView | null` for each applicable facet. All public timestamps are ISO-8601 strings; never expose serialized Firestore `Timestamp` internals.

`learningApi.ts` obtains the current Firebase ID token, calls only `/api/learning/*`, sends JSON, and parses the shared top-level `{ error: string; code: string }` error shape. It exports no Firestore client and accepts no `userId`. `LearningApiContext` supplies the real adapter in production and an explicit fake in component tests.

- [ ] **Step 2: Write failing routing, access, and isolation tests**

Cover these exact states:

1. Authenticated user with `{ enabled: true }` sees exactly one top-level navigation item labelled `探索` linking to `/learn`.
2. Authenticated user with `{ enabled: false }` sees no `探索` item; direct navigation to `/learn`, `/learn/round`, or `/learn/knowledge` redirects to `/groups` with `replace`.
3. Access loading renders a neutral `正在確認使用權限…` state and does not flash the nav item.
4. Access request failure renders retry UI on a direct learning route but does not break existing WiPPY pages.
5. `/learn` uses one nested shell; feature-local destinations are added to that shell by Tasks 10–12 and never added to the global header.
6. Existing `/groups`, `/activities`, `/history`, `/settings`, and LIFF routes render unchanged.
7. A learning page can be rendered with a fake `LearningApi` and no network request.

Create `LearningArchitecture.test.ts` to recursively inspect `frontend/src/learning/**/*.{ts,tsx}` and reject imports containing `Activity`, `Water`, `LiffContext`, `MessagePlanTable`, `AgentChatPanel`, `ReviewBanner`, or `Leaderboard`.

- [ ] **Step 3: Run frontend tests and verify failure**

```powershell
cd frontend
npm test -- src/__tests__/LearningRouting.test.tsx src/__tests__/LearningArchitecture.test.ts
```

Expected: FAIL because the learning client and routes do not exist.

- [ ] **Step 4: Implement access ownership and the nested route tree**

`LearningAccessProvider` runs only after Firebase auth has resolved. Reset its state whenever `user.uid` changes, skip the request when no user exists, and expose:

```ts
type LearningAccessState =
  | { status: 'loading'; enabled: false }
  | { status: 'enabled'; enabled: true }
  | { status: 'disabled'; enabled: false }
  | { status: 'error'; enabled: false; retry(): void };
```

Wrap the protected WiPPY layout with this provider in `App.tsx`. Add this nested tree inside the existing Firebase-authenticated layout:

```tsx
<Route path="/learn" element={<LearningAccessGate><LearningShell /></LearningAccessGate>}>
  <Route index element={<LearningHomePage />} />
</Route>
```

Tasks 10–12 add their routes and feature-local links only when their real page components are committed. Do not commit placeholder pages.

- [ ] **Step 5: Make the WiPPY shell learning-aware without creating a second app**

In `Layout.tsx`, read the access state to conditionally add `探索`. Make the header nav horizontally scrollable on narrow screens. Use `useLocation()` to set the main container to `max-w-6xl` only for `/learn`; retain `max-w-lg` for every existing route. `LearningShell` limits prose to `max-w-3xl`, provides a compact local header, and renders `<Outlet />`. Do not add a separate logo, login, or top-level product switcher.

- [ ] **Step 6: Run checks and commit**

```powershell
npm test -- src/__tests__/LearningRouting.test.tsx src/__tests__/LearningArchitecture.test.ts
npm run lint
npm run build
git add frontend/src/learning frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/__tests__/LearningRouting.test.tsx frontend/src/__tests__/LearningArchitecture.test.ts
git commit -m "feat: add gated WiPPY learning shell"
```

Expected: targeted tests, lint, and build PASS before commit.

---

### Task 10: Optional-Objective Source Import, Processing State, and Reader

**Files:**
- Create: `frontend/src/learning/source/SourceImportPage.tsx`
- Create: `frontend/src/learning/source/SourceProcessingStatus.tsx`
- Create: `frontend/src/learning/source/ReaderPage.tsx`
- Create: `frontend/src/learning/source/useIngestionRun.ts`
- Modify: `frontend/src/learning/api/types.ts`
- Modify: `frontend/src/learning/pages/LearningHomePage.tsx`
- Modify: `frontend/src/learning/layout/LearningShell.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/__tests__/LearningSourceFlow.test.tsx`

**Interfaces:**
- Consumes: `LearningApi.createSource()`, `getRun()`, and `getSource()` from Task 9.
- Produces: the first usable flow: paste private English text, optionally name an understanding objective, observe ingestion without blocking the page, and read the original source.

Add real routes `/learn/sources/new` and `/learn/sources/:sourceId`, plus the feature-local `來源` link, in this task.

- [ ] **Step 1: Write failing source-flow tests**

Assert:

1. Form fields are `標題`, `作者（選填）`, `原始連結（選填）`, `這次想理解什麼（選填）`, and `英文內容`.
2. Only title and body are required. Leaving the objective blank submits no empty string: optional blank fields become `undefined`.
3. Client length counters match backend limits and server validation errors remain visible without clearing user text.
4. The URL is sent only as provenance metadata; no UI claims WiPPY will fetch it.
5. A valid submit generates one UUID `requestId`, reuses it across transport retries, calls the exact DTO, receives `{ sourceId, runId }`, and navigates to `/learn/sources/:sourceId?run=:runId` for every accepted safe run status.
6. `pending_enqueue`, `queued`, `running`, and `publishing` display neutral processing copy plus a manual refresh button; `retryable` shows `重新處理` wired to `retryRun(runId)`; `failed` displays the safe error code and preserves a route back to the source form.
7. Polling stops after `completed`, terminal `failed`, unmount, or auth/access change.
8. The reader renders title, author/link provenance, optional objective only when present, and ordered source paragraphs.
9. A completed source with `verifiedItemCount > 0` shows `開始 3–5 分鐘練習` linking to `/learn/round?sourceId=:sourceId`; an incomplete source does not start a round.
10. A completed source with zero verified items says `內容已完整收進知識庫；目前沒有足夠可靠、適合出題的英文項目。` and offers `查看已收錄內容` plus `加入另一篇`, while unresolved words remain visible in knowledge.

- [ ] **Step 2: Run test and verify failure**

```powershell
cd frontend
npm test -- src/__tests__/LearningSourceFlow.test.tsx
```

Expected: FAIL because source components do not exist.

- [ ] **Step 3: Implement resilient import and polling**

Use controlled fields and an `AbortController` for submit and polling. Generate the source `requestId` once when the user first submits and keep it with the draft until the server returns source/run IDs; a network retry never creates another ID. `useIngestionRun()` fetches immediately, then every two seconds only while `pending_enqueue | queued | running | publishing`; it reuses one timeout rather than stacking intervals and cancels on cleanup. A retryable run waits for the explicit `重新處理` action. After five consecutive transport errors, stop automatic polling and show `再試一次`; do not convert transport failure into a terminal ingestion failure. Refetch the owned source view after completion so `verifiedItemCount` and the CTA are current.

Disable only the submit button during submission. Never disable copy/select in the source textarea. Use `aria-live="polite"` for processing state and move focus to the status heading after navigation.

- [ ] **Step 4: Implement the reading surface**

Render authentic paragraphs in a centered `max-w-[72ch]` article with comfortable line height. Do not insert word-level highlights, quizzes, automatic pauses, or AI interpretations into the reader in this slice. The page may show the optional objective as a dismissible context note; the objective is not required for ingestion or practice.

- [ ] **Step 5: Run checks and commit**

```powershell
npm test -- src/__tests__/LearningSourceFlow.test.tsx src/__tests__/LearningRouting.test.tsx
npm run lint
npm run build
git add frontend/src/learning/source frontend/src/learning/api/types.ts frontend/src/learning/pages/LearningHomePage.tsx frontend/src/learning/layout/LearningShell.tsx frontend/src/App.tsx frontend/src/__tests__/LearningSourceFlow.test.tsx
git commit -m "feat: import and read private English sources"
```

Expected: tests, lint, and build PASS before commit.

---

### Task 11: Concrete Low-Pressure 3–5 Minute Round UI

**Files:**
- Create: `frontend/src/learning/round/roundReducer.ts`
- Create: `frontend/src/learning/round/RoundPage.tsx`
- Create: `frontend/src/learning/round/ChallengeCard.tsx`
- Create: `frontend/src/learning/round/ChallengeFeedback.tsx`
- Create: `frontend/src/learning/round/ChallengeIssueDialog.tsx`
- Create: `frontend/src/learning/round/RoundEvidenceSummary.tsx`
- Modify: `frontend/src/learning/api/types.ts`
- Modify: `frontend/src/learning/layout/LearningShell.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/__tests__/LearningRound.test.tsx`

**Interfaces:**
- Consumes: round, attempt, and report methods from `LearningApi`.
- Produces: a fully concrete recognition round where support is always available, evidence conditions remain visible, and stopping creates no debt.

Add the real `/learn/round` route and feature-local `來一輪` link in this task. Accept optional `sourceId` from the query string and pass it to `createRound()`.

- [ ] **Step 1: Define the reducer before components**

Use this closed UI state:

```ts
export type RoundUiState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'answering'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: EvidenceSummaryView[] }
  | { kind: 'submitting'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: EvidenceSummaryView[] }
  | { kind: 'feedback'; challenge: PublicLearningChallenge; result: AttemptResultView; evidence: EvidenceSummaryView[] }
  | { kind: 'reporting'; challenge: PublicLearningChallenge; afterAttempt: boolean; evidence: EvidenceSummaryView[] }
  | { kind: 'complete'; evidence: EvidenceSummaryView[] }
  | { kind: 'error'; message: string; recoverable: boolean };

export interface ChallengeDraft {
  firstAnswerId: string | null;
  finalAnswerId: string | null;
  shownHints: 0 | 1 | 2;
  answerRevealed: boolean;
  skipped: boolean;
  activeElapsedMs: number;
  visibleSinceMs: number | null;
}
```

The backend derives the attempt ID from the server-issued challenge ID. The first option click sets `firstAnswerId` once; later option changes update only `finalAnswerId`. Track active visible time only, pause on `visibilitychange`, cap at 1,800,000 ms, and send `null` if a reliable duration is unavailable.

- [ ] **Step 2: Write failing interaction tests**

Use a fake API whose response supplies the next challenge only after each transition and prove:

1. The page contains no text matching `複習|到期|連勝|XP|排行榜|剩餘.*題|未完成|欠題|待辦`.
2. Clicking option A, opening hint one, then changing to B submits `firstAnswerId: 'a'`, `finalAnswerId: 'b'`, `supportLevel: 'hint_1'`, `answerRevealed: false`, and `skipped: false`.
3. Option selection never auto-submits; the user presses `確認答案`.
4. `再給我一點提示` reveals one hint at a time without creating an attempt.
5. `直接看答案` with no provisional choice submits null answer IDs, `supportLevel: 'answer'`, and `answerRevealed: true`; if a provisional choice already exists it preserves only `firstAnswerId` and sends `finalAnswerId: null`. Feedback never calls either case unaided success.
6. `跳過` submits null answers, `supportLevel: 'skip'`, and `skipped: true`; it advances without red failure styling.
7. Retrying a failed submission reuses the same challenge ID and payload; leaving the tab hidden for 31 minutes still submits with paused/capped timing and creates no debt.
8. Reporting `題意有歧義` or `語言證據可能有誤` before submission calls the report endpoint, creates no attempt in the fake, and advances neutrally.
9. An unaided source-sentence success without prior novel-context evidence may return one verified unseen same-item comparison; unaided novel-context success creates no remedial same-item branch. When another selected unit remains, either path returns that unit's initial challenge after the main unit completes; `nextChallenge: null` appears only when no unit remains. The UI renders every transition without revealing branching or remaining count.
10. Feedback renders the correct option, decisive clues, reasons for each option, named evidence locator, and ambiguity note; pragmatics copy remains explicitly interpretive rather than claiming author intent.
11. Reporting after feedback shows `這次證據已標記為有疑問，不會用來更新記憶模型` only when `evidenceInvalidated: true`; it never falsely claims a previously stored attempt vanished.
12. The final summary says exactly what each response demonstrated and never claims delayed retention for an immediate attempt.
13. An empty API result shows `目前沒有足夠可靠、適合出題的英文項目` with links to knowledge and source import, without blaming ability.
14. Closing the page after any completed challenge produces no debt, warning, confirmation trap, or unfinished badge on return.

- [ ] **Step 3: Run test and verify failure**

```powershell
cd frontend
npm test -- src/__tests__/LearningRound.test.tsx
```

Expected: FAIL because round components do not exist.

- [ ] **Step 4: Implement the challenge card and support actions**

Render prompt, excerpt, and two or three options as a semantic `fieldset` with radio inputs. Keep `確認答案`, `再給我一點提示`, `直接看答案`, and `跳過` visible in every answering state. All targets are at least 44 by 44 CSS pixels. Do not show a timer, item count, progress percentage, correct-answer sound, celebratory confetti, or red punishment state.

Use `recommendedSupport` only to decide whether the first hint button has a quiet `可以先看提示` note; do not expose why the item was selected. After feedback, focus the feedback heading, render `ChallengeFeedbackView`, and offer one primary action labelled `繼續` when `nextChallenge` exists or `完成` when the round is complete, plus a secondary `這題有問題` action.

- [ ] **Step 5: Implement report and completion behavior**

The issue dialog offers exactly `題意有歧義`, `語言證據可能有誤`, and `其他`, with an optional detail field capped at 500 characters. Closing the dialog changes nothing. A pre-submit report shows `已暫停這題，這次不會產生學習證據`; a post-submit report uses the API's `evidenceInvalidated` result and never makes a stronger claim than the server state.

The completion screen lists evidence summaries and optional links `再來一輪`, `回到原文`, and `查看知識庫`. No action is presented as required and no next visit is scheduled in user-facing copy.

- [ ] **Step 6: Run checks and commit**

```powershell
npm test -- src/__tests__/LearningRound.test.tsx
npm run lint
npm run build
git add frontend/src/learning/round frontend/src/learning/api/types.ts frontend/src/learning/layout/LearningShell.tsx frontend/src/App.tsx frontend/src/__tests__/LearningRound.test.tsx
git commit -m "feat: add low-pressure learning rounds"
```

Expected: test, lint, and build PASS before commit.

---

### Task 12: Total Knowledge and Facet-Evidence View

**Files:**
- Create: `frontend/src/learning/knowledge/KnowledgePage.tsx`
- Create: `frontend/src/learning/knowledge/KnowledgeItemCard.tsx`
- Create: `frontend/src/learning/knowledge/FacetEvidenceRow.tsx`
- Modify: `frontend/src/learning/api/types.ts`
- Modify: `frontend/src/learning/layout/LearningShell.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/__tests__/LearningKnowledge.test.tsx`

**Interfaces:**
- Consumes: paginated knowledge list and exclusion methods from `LearningApi`.
- Produces: one total knowledge base that includes all captured items while making challengeability and evidence conditions inspectable without mastery labels.

Add the real `/learn/knowledge` route and feature-local `知識庫` link in this task.

- [ ] **Step 1: Write failing knowledge-view tests**

Use fixtures for a verified collocation, unresolved word, excluded item, and one item with different evidence across four facets. Assert:

1. All four items render; total knowledge is not filtered down to the quiz pool.
2. Same canonical expression with different `senseKey` renders as separate sense cards.
3. Each card shows occurrence count and source titles.
4. Facets `意思`, `搭配／角色`, `句法`, and `語氣／作用` render independently only when applicable.
5. A facet with no attempt says `尚無證據`; it never says `不會`.
6. Immediate, hinted, direct-answer, delayed-unseen, and organic evidence use their exact conditions.
7. The page contains no `已學會|已掌握|精通|到期|應複習|積欠`.
8. Priority reasons and evidence details are collapsed by default and keyboard expandable.
9. Excluding an item updates optimistically, rolls back on API failure, and explains `仍保留在知識庫，但不再出題`.
10. `載入更多` uses the opaque cursor, appends without duplicates, and disappears when `nextCursor` is null.

- [ ] **Step 2: Run test and verify failure**

```powershell
cd frontend
npm test -- src/__tests__/LearningKnowledge.test.tsx
```

Expected: FAIL because knowledge components do not exist.

- [ ] **Step 3: Implement evidence-first cards**

Use semantic `<details>` for collapsed reasons and evidence. Display `expression`, a human-readable sense label when resolved, and `詞義待釐清` when unresolved. Never expose `priorityScore`, retrievability, half-life, uncertainty, due date, or internal eligibility formulas. A verified but not currently eligible item may say `目前不會出題`; an unresolved item says `需要更多語言證據才會出題`.

The exclusion control is labelled `暫停出題` rather than delete. It does not remove occurrences, evidence, or source links. Keep filters limited to `全部`, `可出題`, `待釐清`, and `已暫停`; do not add review queues.

- [ ] **Step 4: Run checks and commit**

```powershell
npm test -- src/__tests__/LearningKnowledge.test.tsx
npm run lint
npm run build
git add frontend/src/learning/knowledge frontend/src/learning/api/types.ts frontend/src/learning/layout/LearningShell.tsx frontend/src/App.tsx frontend/src/__tests__/LearningKnowledge.test.tsx
git commit -m "feat: show total learning knowledge evidence"
```

Expected: test, lint, and build PASS before commit.

---

### Task 13: Emulator E2E, Accessibility, CI, Canary Runbook, and Extraction Audit

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/firebase.ts`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/learning-core.spec.ts`
- Create: `frontend/e2e/learning-test-data.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/learning-canary-runbook.md`
- Create: `docs/learning-extraction-boundary.md`
- Modify: `docs/learning-infrastructure.md`
- Modify: `backend/src/__tests__/learningArchitecture.test.ts`
- Modify: `frontend/src/__tests__/LearningArchitecture.test.ts`

**Interfaces:**
- Consumes: the complete canary slice from Tasks 1–12.
- Produces: reproducible browser verification against Firebase emulators, accessibility checks, CI gates, a non-destructive rollout/rollback runbook, and evidence that later extraction remains a package move rather than a rewrite.

- [ ] **Step 1: Add browser-test dependencies and scripts**

Run from `frontend/`:

```powershell
npm install --save-dev @playwright/test@^1 @axe-core/playwright@^4
npx playwright install chromium
```

Add:

```json
"test:e2e:learning": "playwright test e2e/learning-core.spec.ts",
"test:e2e:learning:headed": "playwright test e2e/learning-core.spec.ts --headed"
```

- [ ] **Step 2: Make emulator connections explicit and production-safe**

In `frontend/src/firebase.ts`, call `connectAuthEmulator()` only when `VITE_FIREBASE_AUTH_EMULATOR_URL` is non-empty, and `connectFirestoreEmulator()` only when `VITE_FIRESTORE_EMULATOR_HOST` and `VITE_FIRESTORE_EMULATOR_PORT` are present. Guard each connection so Vite hot reload cannot connect twice. Production builds with absent variables behave exactly as before.

Extend Task 7's queue adapter with `InlineLearningQueue`, but permit it only when `LEARNING_INLINE_QUEUE=true` **and** `FIRESTORE_EMULATOR_HOST` is non-empty; otherwise startup fails. It invokes `runLearningIngestion()` through the same application boundary and exists only for emulator E2E, never as a production fallback.

- [ ] **Step 3: Configure three real local servers for Playwright**

`frontend/playwright.config.ts` uses Chromium and these `webServer` entries:

1. Firebase Auth and Firestore emulators for project `demo-wippy-learning` from the repository `firebase.json`, started with Task 4's backend-local binary using the exact command shown below.
2. Backend on `localhost:8088` with `GCLOUD_PROJECT=demo-wippy-learning`, `FIREBASE_PROJECT_ID=demo-wippy-learning`, both emulator hosts, `PORT=8088`, and `LEARNING_INLINE_QUEUE=true`.
3. Vite on `localhost:5173` with `VITE_FIREBASE_PROJECT_ID=demo-wippy-learning`, non-secret emulator placeholders for every required Firebase web field (`VITE_FIREBASE_API_KEY=fake-api-key`, auth domain, storage bucket, messaging sender ID, and app ID), auth/firestore emulator variables, and `VITE_API_BASE_URL=http://localhost:8088`, matching WiPPY's existing CORS allowlist.

Use these exact commands and readiness URLs in the config:

```ts
webServer: [
  {
    command: 'npm --prefix ../backend exec -- firebase emulators:start --config ../firebase.json --project demo-wippy-learning --only auth,firestore',
    url: 'http://localhost:4000',
  },
  {
    command: 'npm --prefix ../backend run dev',
    url: 'http://localhost:8088/health',
    env: {
      PORT: '8088', GCLOUD_PROJECT: 'demo-wippy-learning', FIREBASE_PROJECT_ID: 'demo-wippy-learning',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      LEARNING_INLINE_QUEUE: 'true',
    },
  },
  {
    command: 'npm run dev -- --host localhost',
    url: 'http://localhost:5173',
    env: {
      VITE_API_BASE_URL: 'http://localhost:8088', VITE_FIREBASE_PROJECT_ID: 'demo-wippy-learning',
      VITE_FIREBASE_API_KEY: 'fake-api-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-wippy-learning.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-wippy-learning.appspot.com', VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
      VITE_FIREBASE_APP_ID: '1:1234567890:web:e2e', VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1', VITE_FIRESTORE_EMULATOR_PORT: '8080',
    },
  },
]
```

Set `reuseExistingServer: false` in CI and a 120-second startup timeout. Do not use production Firebase credentials, Cloud Tasks, Cloud Run, or real user data.

- [ ] **Step 4: Write the failing vertical E2E test**

The test creates a unique email/password user through the Auth emulator REST API, reads the returned UID, then invokes Task 7's existing backend Admin script with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `GCLOUD_PROJECT=demo-wippy-learning`, and `FIREBASE_PROJECT_ID=demo-wippy-learning` to enable only that UID. `learning-test-data.ts` chooses `npm.cmd` on Windows and `npm` elsewhere and fails the test if the script exits non-zero; it does not bypass rules through an unauthenticated Firestore REST write. The primary user completes this supported-answer flow at `390x844`:

1. Sign in through the real WiPPY email login.
2. See one `探索` nav item and open `/learn/sources/new`.
3. Leave the objective blank and import `Before building it, run the idea by a few users. Later, run the company with care.`
4. Observe processing complete, open the authentic reader, and start a round.
5. Select one provisional option, reveal a hint, change the option, submit, and verify feedback names the support condition.
6. Follow the server-returned targeted challenge after the hinted answer and complete or skip it without any pressure/count UI.
7. Open the knowledge base and verify both reviewed senses of `run`, overlapping occurrences, separate facet rows, and no delayed-retention claim.
8. Reload the page and verify evidence persists.
9. Toggle `暫停出題`, start another round, and verify the item is not selected.

Create a second fresh access-enabled emulator user for an isolated transfer path. Import the same source, answer its first source-context challenge correctly without support, verify the API returns one unseen `novel_context_recognition` challenge, answer that correctly without support, and verify no further remedial same-item branch appears. Main-to-additional continuation remains covered by Task 6's application tests and Task 11's client fake so this browser test does not depend on seeding private scheduling state.

Run a second source fixture containing no reviewed seed expression. Verify ingestion completes, every unresolved word is visible in total knowledge, the reader shows the exact reliable-item empty state instead of a start button, and direct navigation with that returned `sourceId` produces the same neutral empty state.

Also run one challenge keyboard-only, assert visible focus, and run axe with zero serious or critical violations on import, reader, round, feedback, and knowledge states.

- [ ] **Step 5: Add negative product-language and ownership assertions**

Across every learning page, assert no rendered text matches:

```regex
/複習|到期|連勝|\bXP\b|排行榜|剩餘\s*\d+\s*題|未完成|欠題|待審核|已學會|精通/
```

Create a second emulator user without access and prove `/learn` redirects to `/groups`, `/api/learning/knowledge` returns 404, and the first user's source ID cannot be read through either API or Firestore client SDK.

- [ ] **Step 6: Run E2E locally and verify failure, then make it pass**

```powershell
cd frontend
npm run test:e2e:learning
```

Expected before wiring: FAIL at the first missing emulator/UI contract. Expected after implementation: Chromium PASS at mobile viewport with no serious/critical axe violations.

- [ ] **Step 7: Add CI without deploying the canary**

Add a `learning-emulator` CI job after backend and frontend unit jobs. Use Node 20, set up Temurin Java 21 for Firebase Emulator Suite, run `npm ci` in both directories, install Playwright Chromium with dependencies, then run `npm run test:e2e:learning` from `frontend/`. Do not edit deploy triggers and do not grant any CI identity production Firestore or Cloud Tasks permission.

- [ ] **Step 8: Document canary operation and future extraction**

`docs/learning-canary-runbook.md` must include:

- prerequisites and exact infrastructure verification commands;
- enabling one Firebase UID, verifying `/api/learning/access`, and disabling it again;
- safe failure checks for queue, worker, API, and Firestore indexes;
- rollback by setting access false, with no data deletion;
- privacy note: source text, attempts, knowledge, and share-independent notes are private;
- explicit statement that broad rollout waits for a separately approved verified-ingestion plan.

`docs/learning-extraction-boundary.md` maps the movable units:

```text
backend/src/learning/domain/**       -> standalone domain package
backend/src/learning/application/**  -> application package
backend/src/learning/adapters/**     -> WiPPY/Firebase adapters
backend/src/learning/http/**         -> replaceable transport
frontend/src/learning/**             -> feature package
/api/learning/*                      -> stable external contract
learning* collections                -> migration namespace
Firebase UID                         -> identity bridge
```

List forbidden coupling to Activity, Water, LIFF, scheduler, Harness, and global WiPPY completion state.

- [ ] **Step 9: Strengthen automated extraction-boundary audits**

Backend architecture tests reject domain imports from application/adapters/http and reject every learning-layer import from Activity, Water, LIFF, scheduler, or Harness modules. Frontend architecture tests reject imports from feature-specific WiPPY modules while allowing only shared auth, error parsing, and visual primitives. Add a repository search gate:

```powershell
rg -n "reviewStatus|streak|backlog|dueAt|remainingCount|leaderboard|activityKnowledge|harnessRuns" backend/src/learning frontend/src/learning -g "!*.test.*"
```

Expected: no production matches. If a legitimate internal field is later required, update the design review first; do not weaken the gate ad hoc.

- [ ] **Step 10: Run the full release-candidate verification**

From the repository root:

```powershell
cd backend
npm test -- --runInBand
npm run test:learning:emulator
npm run build
cd ../frontend
npm test
npm run lint
npm run build
npm run test:e2e:learning
cd ..
git diff --check
git status --short
```

Expected: all commands exit 0; only intended learning, infrastructure, CI, and documentation files are changed; `.clone/` and all pre-existing unrelated user files remain untouched.

- [ ] **Step 11: Commit the verification layer**

```powershell
git add frontend/package.json frontend/package-lock.json frontend/src/firebase.ts frontend/playwright.config.ts frontend/e2e .github/workflows/ci.yml docs/learning-canary-runbook.md docs/learning-extraction-boundary.md docs/learning-infrastructure.md backend/src/learning/adapters/jobs backend/src/__tests__/learningArchitecture.test.ts frontend/src/__tests__/LearningArchitecture.test.ts
git commit -m "test: verify WiPPY learning canary end to end"
```

Do not enable any production UID, merge, deploy, or delete learning data as part of this plan. Those are separate explicit operations after review.

---

## Final Acceptance Checklist

- [ ] A Firebase-authenticated, access-enabled user can paste English text with no required learning objective.
- [ ] The source body is private, segmented before queueing, captured idempotently, and never copied into operational traces.
- [ ] Every detected word occurrence enters total knowledge; only evidence-backed, quality-verified items become eligible.
- [ ] A round has one adaptive main knowledge unit plus at most two one-step additions; unaided novel-context evidence ends the main item early, source-only recognition receives at most one unseen transfer check, support triggers only the minimum needed branch, and a long absence creates no backlog.
- [ ] Every challenge supports provisional choice, progressive hints, direct answer, skip, and evidence-quality reporting.
- [ ] Attempts preserve first and final answers; retries are idempotent; one attempt updates only one facet/target transactionally.
- [ ] Same-session evidence is never labelled delayed; answer reveal and skip never become unaided success.
- [ ] Knowledge shows all captured items, source occurrences, independent facet evidence, and exclusion without deletion.
- [ ] A source with no reliable challengeable item finishes honestly, preserves all unresolved knowledge, and shows a neutral empty state rather than a broken or blaming round.
- [ ] The learning UI contains no streak, XP, heart, leaderboard, timer, due/review queue, unfinished debt, or mastery claim.
- [ ] Existing WiPPY and LIFF flows remain unchanged and the learning nav appears only for enabled UIDs.
- [ ] Firestore client access is denied, cross-user API access returns 404, worker OIDC is fail-closed, and emulator ownership tests pass.
- [ ] Domain, application, adapter, HTTP, frontend, and `learning*` data boundaries are documented and automatically audited for later extraction.
- [ ] Production rollout remains canary-only and requires a separate verified-ingestion plan before broad access.
