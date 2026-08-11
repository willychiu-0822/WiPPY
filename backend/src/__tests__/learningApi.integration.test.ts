import express, { RequestHandler } from 'express';
import request from 'supertest';
import { createLearningRouter } from '../learning/http/learningRouter';
import type { LearningContainer } from '../learning/application/container';
import type { LearningRepository } from '../learning/application/ports';

const fakeAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  req.userId = header.slice('Bearer '.length);
  next();
};

function app(container: LearningContainer) {
  const instance = express();
  instance.use('/api/learning', express.json({ limit: '256kb' }), createLearningRouter({ auth: fakeAuth, container }));
  return instance;
}

function container(overrides: Partial<LearningContainer> = {}): LearningContainer {
  const repository: Partial<LearningRepository> = {
    hasLearningAccess: jest.fn().mockResolvedValue(true),
    createSourceAndRun: jest.fn().mockResolvedValue({ sourceId: 'source-1', sourceVersionId: 'version-1', runId: 'run-1' }),
    getRun: jest.fn().mockResolvedValue({ id: 'run-1', sourceId: 'source-1', status: 'pending_enqueue', capturedItemCount: 0, verifiedItemCount: 0, safeErrorCode: null, createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z' }),
    getSource: jest.fn().mockResolvedValue({ id: 'source-1', title: 'Article', author: null, url: null, objective: null, status: 'completed', verifiedItemCount: 1, segments: [{ id: 'segment-1', ordinal: 0, text: 'Run it by Maya.' }], createdAt: '2026-08-10T00:00:00.000Z' }),
    saveRound: jest.fn(),
    listSelectionCandidates: jest.fn().mockResolvedValue([]),
    listKnowledgeRecords: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    setExcludedByUser: jest.fn().mockResolvedValue(true),
    getInternalChallenge: jest.fn().mockResolvedValue(null),
  };
  return {
    repository: repository as LearningRepository,
    queue: { enqueue: jest.fn().mockResolvedValue(undefined) },
    challengeBuilder: { build: jest.fn() },
    idFactory: { create: (kind) => `${kind}-1` },
    now: () => new Date('2026-08-10T00:00:00.000Z'),
    ...overrides,
  };
}

describe('learning API', () => {
  it('requires auth, reports access, and hides non-access routes when access is disabled', async () => {
    await request(app(container())).get('/api/learning/access').expect(401);

    const disabled = container({ repository: { hasLearningAccess: jest.fn().mockResolvedValue(false) } as unknown as LearningRepository });
    await request(app(disabled)).get('/api/learning/access').set('Authorization', 'Bearer user-a').expect(200, { enabled: false });
    await request(app(disabled)).get('/api/learning/knowledge').set('Authorization', 'Bearer user-a').expect(404, { error: 'Not found', code: 'not_found' });

    await request(app(container())).get('/api/learning/access').set('Authorization', 'Bearer user-a').expect(200, { enabled: true });
  });

  it('imports a pasted source with strict validation and no client userId', async () => {
    const server = app(container());

    await request(server).post('/api/learning/sources').set('Authorization', 'Bearer user-a').send({ requestId: crypto.randomUUID(), title: 'Article', body: 'Run it by Maya.', userId: 'evil' }).expect(400);
    await request(server).post('/api/learning/sources').set('Authorization', 'Bearer user-a').send({ requestId: crypto.randomUUID(), title: '', body: 'Run it by Maya.' }).expect(400);

    const response = await request(server)
      .post('/api/learning/sources')
      .set('Authorization', 'Bearer user-a')
      .send({ requestId: crypto.randomUUID(), title: 'Article', body: 'Run it by Maya.' })
      .expect(202);

    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body).toMatchObject({ sourceId: 'source-1', runId: 'run-1', status: 'queued' });
    expect(JSON.stringify(response.body)).not.toMatch(/Run it by Maya|stack|priority|review/);
  });

  it('returns owned source paragraphs only from the source endpoint', async () => {
    const response = await request(app(container())).get('/api/learning/sources/source-1').set('Authorization', 'Bearer user-a').expect(200);

    expect(response.body.source.paragraphs).toEqual([{ id: 'segment-1', text: 'Run it by Maya.', order: 0 }]);
  });

  it('maps application errors to safe HTTP codes', async () => {
    const invalidAttempt = container({
      repository: {
        hasLearningAccess: jest.fn().mockResolvedValue(true),
        getInternalChallenge: jest.fn().mockRejectedValue(new Error('invalid_answer_option')),
      } as unknown as LearningRepository,
    });

    await request(app(invalidAttempt))
      .post('/api/learning/attempts')
      .set('Authorization', 'Bearer user-a')
      .send({ challengeId: 'challenge-1', firstAnswerId: 'z', finalAnswerId: 'z', supportLevel: 'none', answerRevealed: false, skipped: false, responseMs: 1000 })
      .expect(400, { error: 'Invalid answer option', code: 'invalid_answer_option' });
  });

  it('lists knowledge and accepts only excludedByUser patches', async () => {
    const server = app(container());
    await request(server).get('/api/learning/knowledge?limit=20&cursor=opaque').set('Authorization', 'Bearer user-a').expect(200, { items: [], nextCursor: null });
    await request(server).patch('/api/learning/knowledge/item-1').set('Authorization', 'Bearer user-a').send({ excludedByUser: true }).expect(200, { ok: true });
    await request(server).patch('/api/learning/knowledge/item-1').set('Authorization', 'Bearer user-a').send({ excludedByUser: true, userId: 'evil' }).expect(400);
  });
});
