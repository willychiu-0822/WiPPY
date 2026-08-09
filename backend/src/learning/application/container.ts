import { getDb } from '../../firebase';
import { FirestoreLearningRepository } from '../adapters/firestore/firestoreLearningRepository';
import { CloudTasksLearningQueue } from '../adapters/jobs/cloudTasksLearningQueue';
import { InlineLearningQueue } from '../adapters/jobs/inlineLearningQueue';
import { seedChallengeBuilder } from '../adapters/challenges/seedChallengeBuilder';
import { runLearningIngestion } from './runLearningIngestion';
import type { ChallengeBuilder, LearningQueue, LearningRepository } from './ports';
import type { LearningIdFactory } from './learningIds';

export interface LearningContainer {
  repository: LearningRepository;
  queue: LearningQueue;
  challengeBuilder: ChallengeBuilder;
  idFactory: LearningIdFactory;
  now: () => Date;
}

let testContainer: LearningContainer | null = null;
let productionContainer: LearningContainer | null = null;

export function setLearningContainerForTests(container: LearningContainer | null): void {
  testContainer = container;
}

export function getLearningContainer(): LearningContainer {
  if (testContainer) return testContainer;
  if (productionContainer) return productionContainer;

  const repository = new FirestoreLearningRepository(getDb());
  const queue =
    process.env['LEARNING_INLINE_QUEUE'] === 'true'
      ? new InlineLearningQueue({
          firestoreEmulatorHost: process.env['FIRESTORE_EMULATOR_HOST'],
          run: (input) =>
            runLearningIngestion(
              {
                ...input,
                workerId: 'inline-learning-e2e',
                now: new Date(),
              },
              { repository },
            ),
        })
      : new CloudTasksLearningQueue({
          projectId: process.env['LEARNING_TASKS_PROJECT_ID'],
          location: process.env['LEARNING_TASKS_LOCATION'],
          queue: process.env['LEARNING_TASKS_QUEUE'],
          serviceUrl: process.env['LEARNING_WORKER_BASE_URL'],
          serviceAccountEmail: process.env['LEARNING_TASKS_SERVICE_ACCOUNT'],
          audience: process.env['LEARNING_TASKS_AUDIENCE'],
        });
  productionContainer = {
    repository,
    queue,
    challengeBuilder: seedChallengeBuilder,
    idFactory: { create: () => crypto.randomUUID() },
    now: () => new Date(),
  };
  return productionContainer;
}
