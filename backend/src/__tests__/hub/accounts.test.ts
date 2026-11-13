import { resolveApiKeyActor, resolveFirebaseActor } from '../../hub/accounts';
import { decryptSecret, encryptSecret, generateApiKey, generatePassword, hashApiKey } from '../../hub/core/crypto';
import { makeTestHub, type TestHub } from './helpers';

describe('hub crypto helpers', () => {
  it('generates prefixed random API keys and stable hashes', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a).toMatch(/^wpy_[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(hashApiKey(a)).toBe(hashApiKey(a));
    expect(hashApiKey(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('encrypts secrets so only the same key decrypts them', () => {
    const enc = encryptSecret('routine-key-123', 'k1');
    expect(enc).not.toContain('routine-key-123');
    expect(decryptSecret(enc, 'k1')).toBe('routine-key-123');
    expect(() => decryptSecret(enc, 'k2')).toThrow();
    expect(encryptSecret('same', 'k1')).not.toBe(encryptSecret('same', 'k1'));
  });

  it('generates strong passwords', () => {
    const pw = generatePassword();
    expect(pw).toHaveLength(20);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[0-9]/);
  });
});

describe('resolveFirebaseActor', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await hub.store.set('agents', 'instinct_1', { ownerId: hub.ownerId, name: 'Instinct', kind: 'instinct', enabled: true });
    await hub.store.set('hubAccounts', 'uid_instinct', { role: 'agent', ownerId: hub.ownerId, agentId: 'instinct_1', disabled: false });
  });

  it('treats the configured owner uid as owner', async () => {
    expect(await resolveFirebaseActor(hub, 'owner_uid', 'owner_uid')).toEqual({ kind: 'owner', ownerId: 'owner_1', via: 'ui' });
  });

  it('falls back to owner for any user when no owner is configured (local dev)', async () => {
    expect(await resolveFirebaseActor(hub, 'anyone', undefined)).toEqual({ kind: 'owner', ownerId: 'owner_1', via: 'ui' });
  });

  it('maps agent accounts to their agent', async () => {
    expect(await resolveFirebaseActor(hub, 'uid_instinct', 'owner_uid')).toEqual({ kind: 'agent', ownerId: 'owner_1', agentId: 'instinct_1', via: 'ui' });
  });

  it.each([undefined, 'uid_instinct'])('never elevates existing hubAccounts with owner=%s', async (owner) => {
    expect(await resolveFirebaseActor(hub, 'uid_instinct', owner)).toMatchObject({ kind: 'agent' });
    await hub.store.update('hubAccounts', 'uid_instinct', { disabled: true });
    await expect(resolveFirebaseActor(hub, 'uid_instinct', owner)).rejects.toThrow('此 Agent 已停用');
    await hub.store.update('hubAccounts', 'uid_instinct', { disabled: false, ownerId: 'foreign' });
    expect(await resolveFirebaseActor(hub, 'uid_instinct', owner)).toBeNull();
  });

  it('rejects strangers, disabled accounts and accounts of disabled agents', async () => {
    expect(await resolveFirebaseActor(hub, 'stranger', 'owner_uid')).toBeNull();
    await hub.store.update('hubAccounts', 'uid_instinct', { disabled: true });
    await expect(resolveFirebaseActor(hub, 'uid_instinct', 'owner_uid')).rejects.toThrow('此 Agent 已停用');
    await hub.store.update('hubAccounts', 'uid_instinct', { disabled: false });
    await hub.store.update('agents', 'instinct_1', { enabled: false });
    await expect(resolveFirebaseActor(hub, 'uid_instinct', 'owner_uid')).rejects.toThrow('此 Agent 已停用');
  });
});

describe('resolveApiKeyActor', () => {
  it('finds the enabled agent that owns the key hash', async () => {
    const hub = makeTestHub();
    const key = generateApiKey();
    await hub.store.set('agents', 'grok_1', { ownerId: hub.ownerId, name: 'Grok', kind: 'grok_bot', enabled: true, apiKeyHash: hashApiKey(key) });
    expect(await resolveApiKeyActor(hub, key, 'mcp')).toEqual({ kind: 'agent', ownerId: 'owner_1', agentId: 'grok_1', via: 'mcp' });
    expect(await resolveApiKeyActor(hub, generateApiKey(), 'rest')).toBeNull();
    await hub.store.update('agents', 'grok_1', { enabled: false });
    await expect(resolveApiKeyActor(hub, key, 'rest')).rejects.toThrow('此 Agent 已停用');
  });
});
