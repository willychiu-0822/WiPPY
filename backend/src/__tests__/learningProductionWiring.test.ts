import request from 'supertest';

import { createApp } from '../app';

describe('learning production wiring', () => {
  it('mounts the authenticated internal ingestion endpoint', async () => {
    const response = await request(createApp())
      .post('/api/internal/learning/ingest')
      .send({ userId: 'user-a', runId: 'run-a' });

    expect(response.status).toBe(401);
  });
});
