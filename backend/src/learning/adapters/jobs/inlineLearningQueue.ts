import type { LearningQueue } from '../../application/ports';

export class InlineLearningQueue implements LearningQueue {
  private readonly run: (input: { userId: string; runId: string }) => Promise<void>;

  constructor(input: { firestoreEmulatorHost: string | undefined; run: (input: { userId: string; runId: string }) => Promise<void> }) {
    if (!input.firestoreEmulatorHost) {
      throw new Error('inline_learning_queue_requires_emulator');
    }
    this.run = input.run;
  }

  async enqueue(input: { userId: string; runId: string }): Promise<void> {
    await this.run(input);
  }
}
