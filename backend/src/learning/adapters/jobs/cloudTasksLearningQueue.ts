import { CloudTasksClient } from '@google-cloud/tasks';
import type { LearningQueue } from '../../application/ports';

export interface CloudTasksLearningQueueConfig {
  projectId?: string;
  location?: string;
  queue?: string;
  serviceUrl?: string;
  serviceAccountEmail?: string;
  audience?: string;
  client?: Pick<CloudTasksClient, 'queuePath' | 'createTask'>;
}

export class CloudTasksLearningQueue implements LearningQueue {
  private readonly config: Required<Omit<CloudTasksLearningQueueConfig, 'client'>>;
  private readonly client: Pick<CloudTasksClient, 'queuePath' | 'createTask'>;

  constructor(config: CloudTasksLearningQueueConfig) {
    if (!config.projectId || !config.location || !config.queue || !config.serviceUrl || !config.serviceAccountEmail || !config.audience) {
      throw new Error('learning_queue_not_configured');
    }
    this.config = {
      projectId: config.projectId,
      location: config.location,
      queue: config.queue,
      serviceUrl: config.serviceUrl,
      serviceAccountEmail: config.serviceAccountEmail,
      audience: config.audience,
    };
    this.client = config.client ?? new CloudTasksClient();
  }

  async enqueue(input: { userId: string; runId: string }): Promise<void> {
    const parent = this.client.queuePath(this.config.projectId, this.config.location, this.config.queue);
    try {
      await this.client.createTask({
        parent,
        task: {
          name: `${parent}/tasks/${input.runId}`,
          httpRequest: {
            httpMethod: 'POST',
            url: `${this.config.serviceUrl.replace(/\/$/, '')}/api/internal/learning/ingest`,
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(JSON.stringify(input)).toString('base64'),
            oidcToken: {
              serviceAccountEmail: this.config.serviceAccountEmail,
              audience: this.config.audience,
            },
          },
        },
      });
    } catch (error) {
      if (String(error).includes('ALREADY_EXISTS') || (error as { code?: number }).code === 6) {
        return;
      }
      throw error;
    }
  }
}
