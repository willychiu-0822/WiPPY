import fs from 'node:fs';
import path from 'node:path';

describe('learning deployment configuration', () => {
  it('passes the queue and worker settings to Cloud Run', () => {
    const workflow = fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows/deploy.yml'), 'utf8');
    const productionEnv = fs.readFileSync(path.resolve(__dirname, '../../../deployment/production.env'), 'utf8');

    for (const key of [
      'LEARNING_CORE_ENABLED',
      'LEARNING_TASKS_PROJECT_ID',
      'LEARNING_TASKS_LOCATION',
      'LEARNING_TASKS_QUEUE',
      'LEARNING_WORKER_BASE_URL',
      'LEARNING_TASKS_SERVICE_ACCOUNT',
      'LEARNING_TASKS_AUDIENCE',
      'LEARNING_INLINE_QUEUE',
    ]) {
      expect(workflow).toContain(key);
    }
    expect(productionEnv).toContain('LEARNING_TASKS_QUEUE=wippy-learning-ingestion');
    expect(productionEnv).toContain('LEARNING_TASKS_SERVICE_ACCOUNT=wippy-learning-task@wippy-mvp.iam.gserviceaccount.com');
  });
});
