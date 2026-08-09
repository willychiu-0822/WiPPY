export interface LearningIdFactory {
  create(kind: 'round' | 'unit' | 'challenge'): string;
}
