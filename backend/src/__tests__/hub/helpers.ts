import { RecordingQueue } from '../../hub/core/jobs';
import { InMemoryBlobStore, InMemoryDocStore } from '../../hub/core/memoryStore';
import type { HubContext } from '../../hub/core/context';
import {
  ContentTooLargeError,
  UpstreamError,
  type AuthAdmin,
  type LineGateway,
  type LineMessage,
  type LineTranscodingStatus,
} from '../../hub/core/ports';

export class FakeLine implements LineGateway {
  pushes: Array<{ to: string; messages: LineMessage[]; retryKey: string }> = [];
  pushError: Error | null = null;
  quota: { type: 'none' | 'limited'; value?: number } = { type: 'limited', value: 200 };
  consumption = 0;
  memberCounts: Record<string, number> = {};
  profiles: Record<string, string> = {};
  profileCalls = 0;
  transcoding: Record<string, LineTranscodingStatus> = {};
  contents: Record<string, { data: Buffer; contentType: string }> = {};
  contentError: Error | null = null;

  async push(to: string, messages: LineMessage[], retryKey: string): Promise<void> {
    if (this.pushError) throw this.pushError;
    this.pushes.push({ to, messages, retryKey });
  }
  async getQuota() { return this.quota; }
  async getConsumption() { return this.consumption; }
  async getGroupMemberCount(groupId: string) {
    if (!(groupId in this.memberCounts)) throw new UpstreamError('group not found', 404);
    return this.memberCounts[groupId];
  }
  async getGroupMemberProfile(_groupId: string, userId: string) {
    this.profileCalls += 1;
    if (!(userId in this.profiles)) throw new UpstreamError('profile not found', 404);
    return { displayName: this.profiles[userId] };
  }
  async getContentTranscoding(messageId: string) { return this.transcoding[messageId] ?? 'succeeded'; }
  async getContent(messageId: string, maxBytes: number) {
    if (this.contentError) throw this.contentError;
    const content = this.contents[messageId];
    if (!content) throw new UpstreamError('content not found', 404);
    if (content.data.length > maxBytes) throw new ContentTooLargeError(maxBytes);
    return content;
  }
}

export class FakeAuthAdmin implements AuthAdmin {
  users: Record<string, { email: string; password: string; displayName: string; disabled: boolean }> = {};
  private seq = 0;
  async createUser(input: { email: string; password: string; displayName: string }) {
    this.seq += 1;
    const uid = `uid_${this.seq}`;
    this.users[uid] = { ...input, disabled: false };
    return { uid };
  }
  async updatePassword(uid: string, password: string) { this.users[uid].password = password; }
  async setDisabled(uid: string, disabled: boolean) { this.users[uid].disabled = disabled; }
}

export interface TestHub extends HubContext {
  store: InMemoryDocStore;
  blobs: InMemoryBlobStore;
  line: FakeLine;
  queue: RecordingQueue;
  clock: { now: Date };
  fetchMock: jest.Mock;
  resolveHostMock: jest.Mock;
  llmMock: { chat: jest.Mock };
  authAdmin: FakeAuthAdmin;
}

export const OWNER = 'owner_1';
export const GROUP = 'C0123456789abcdef0123456789abcdef';
export const GROUP_B = 'C1123456789abcdef0123456789abcdef';

export function makeTestHub(overrides: Partial<HubContext> = {}): TestHub {
  const clock = { now: new Date('2026-11-04T02:00:00.000Z') };
  const fetchMock = jest.fn();
  const resolveHostMock = jest.fn().mockResolvedValue(['93.184.216.34']);
  const llmMock = { chat: jest.fn() };
  const hub: TestHub = {
    ownerId: OWNER,
    store: new InMemoryDocStore(),
    blobs: new InMemoryBlobStore(),
    line: new FakeLine(),
    queue: new RecordingQueue(),
    now: () => new Date(clock.now.getTime()),
    fetch: fetchMock,
    resolveHost: resolveHostMock,
    llm: llmMock,
    authAdmin: new FakeAuthAdmin(),
    env: { publicBaseUrl: 'https://wippy.test', encryptionKey: 'test-encryption-key' },
    clock,
    fetchMock,
    resolveHostMock,
    llmMock,
    ...overrides,
  } as TestHub;
  return hub;
}

export async function seedGroup(hub: TestHub, groupId = GROUP, opts: { agentEnabled?: boolean; name?: string; memberCount?: number } = {}) {
  await hub.store.set('groups', groupId, {
    groupId,
    name: opts.name ?? 'Team',
    userId: hub.ownerId,
    memberCount: opts.memberCount ?? 5,
    isActive: true,
    agentEnabled: opts.agentEnabled ?? true,
  });
  hub.line.memberCounts[groupId] = opts.memberCount ?? 5;
}

export function textEvent(opts: { id?: string; text?: string; groupId?: string; userId?: string; ts?: number; mentionSelf?: boolean } = {}) {
  const id = opts.id ?? 'evt1';
  return {
    type: 'message',
    webhookEventId: id,
    timestamp: opts.ts ?? Date.parse('2026-11-04T01:59:00.000Z'),
    source: { type: 'group', groupId: opts.groupId ?? GROUP, userId: opts.userId ?? 'U1' },
    message: {
      id: `msg_${id}`,
      type: 'text',
      text: opts.text ?? 'hello',
      ...(opts.mentionSelf ? { mention: { mentionees: [{ index: 0, length: 4, type: 'user', isSelf: true }] } } : {}),
    },
    deliveryContext: { isRedelivery: false },
  };
}

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
}
