import type { Facet, FacetMemory, KnowledgeItem } from '../model';

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

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
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

export interface SelectRoundInput {
  currentSourceId: string | null;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
