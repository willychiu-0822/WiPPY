import { evaluateMessage, matchesMessage, runScheduledRules, validateRuleInput } from '../../hub/rules';
import type { RuleTrigger } from '../../hub/core/types';
import { GROUP, GROUP_B, makeTestHub, seedGrokAgent, seedGroup, seedMessage, seedRule, type TestHub } from './helpers';

function msg(overrides: Record<string, unknown> = {}) {
  return { id: 'x', groupId: GROUP, type: 'text', text: 'hello', mentionsBot: false, ...overrides } as any;
}

describe('matchesMessage', () => {
  it('matches keywords case-insensitively and optional regex on text only', () => {
    const t: RuleTrigger = { type: 'keyword', keywords: ['Urgent', '緊急'] };
    expect(matchesMessage(t, msg({ text: 'this is URGENT' }))).toBe(true);
    expect(matchesMessage(t, msg({ text: '緊急！' }))).toBe(true);
    expect(matchesMessage(t, msg({ text: 'fine' }))).toBe(false);
    expect(matchesMessage(t, msg({ type: 'image', text: null }))).toBe(false);
    expect(matchesMessage({ type: 'keyword', keywords: [], regex: '\\d{4}-\\d{2}' }, msg({ text: '2026-11 結帳' }))).toBe(true);
  });

  it('matches message types and bot mentions', () => {
    expect(matchesMessage({ type: 'message_type', messageTypes: ['file', 'image'] }, msg({ type: 'file' }))).toBe(true);
    expect(matchesMessage({ type: 'message_type', messageTypes: ['file'] }, msg({ type: 'text' }))).toBe(false);
    expect(matchesMessage({ type: 'mention' }, msg({ mentionsBot: true }))).toBe(true);
    expect(matchesMessage({ type: 'mention' }, msg())).toBe(false);
  });
});

describe('validateRuleInput', () => {
  it('accepts a complete rule and normalises defaults', () => {
    const result = validateRuleInput({ name: 'r', agentId: 'grok_1', groupIds: [GROUP], trigger: { type: 'mention' }, instruction: 'do it' });
    expect(result).toMatchObject({ ok: true, rule: { enabled: true, cooldownMinutes: 0, include: { digest: false, raw: true, media: true, contextCount: 20 } } });
  });

  it('rejects bad triggers, unsafe regex and empty groups', () => {
    expect(validateRuleInput({ name: 'r', agentId: 'a', groupIds: [], trigger: { type: 'mention' }, instruction: 'x' })).toMatchObject({ ok: false });
    expect(validateRuleInput({ name: 'r', agentId: 'a', groupIds: [GROUP], trigger: { type: 'keyword', keywords: [] }, instruction: 'x' })).toMatchObject({ ok: false });
    expect(validateRuleInput({ name: 'r', agentId: 'a', groupIds: [GROUP], trigger: { type: 'keyword', keywords: [], regex: '(' }, instruction: 'x' })).toMatchObject({ ok: false });
    expect(validateRuleInput({ name: 'r', agentId: 'a', groupIds: [GROUP], trigger: { type: 'schedule', intervalMinutes: 1 }, instruction: 'x' })).toMatchObject({ ok: false });
    expect(validateRuleInput({ name: 'r', agentId: 'a', groupIds: [GROUP], trigger: { type: 'volume', windowMinutes: 10, threshold: 0 }, instruction: 'x' })).toMatchObject({ ok: false });
  });
});

describe('evaluateMessage', () => {
  let hub: TestHub;
  beforeEach(async () => {
    hub = makeTestHub();
    await seedGroup(hub);
    await seedGrokAgent(hub);
  });

  it('creates one queued dispatch with the trigger message and its context', async () => {
    await seedRule(hub, 'r1', { include: { digest: false, raw: true, media: false, contextCount: 3 } });
    for (let i = 0; i < 4; i += 1) {
      hub.clock.now = new Date(hub.clock.now.getTime() + 1000);
      await seedMessage(hub, { id: `c${i}`, text: 'chat' });
    }
    hub.clock.now = new Date(hub.clock.now.getTime() + 1000);
    const trigger = await seedMessage(hub, { id: 'trig', text: '緊急 停電了' });
    const fired = await evaluateMessage(hub, trigger);
    expect(fired).toHaveLength(1);
    const dispatch = hub.store.dump('agentDispatches')[fired[0]];
    expect(dispatch).toMatchObject({ ruleId: 'r1', agentId: 'grok_1', agentKind: 'grok_bot', groupId: GROUP, status: 'queued', trigger: 'keyword', messageIds: ['c2', 'c3', 'trig'], instruction: '判斷是否需要預警' });
    expect(hub.queue.jobs).toEqual([{ job: { type: 'dispatch', id: fired[0], attempt: 1, payload: { dispatchId: fired[0] } }, delaySeconds: 0 }]);
  });

  it('respects cooldown per rule and group, disabled rules and other groups', async () => {
    await seedRule(hub, 'r1', { cooldownMinutes: 10 });
    await seedRule(hub, 'off', { enabled: false });
    await seedRule(hub, 'other', { groupIds: [GROUP_B] });
    const first = await seedMessage(hub, { id: 'a', text: '緊急' });
    expect(await evaluateMessage(hub, first)).toHaveLength(1);
    hub.clock.now = new Date(hub.clock.now.getTime() + 5 * 60_000);
    expect(await evaluateMessage(hub, await seedMessage(hub, { id: 'b', text: '緊急' }))).toHaveLength(0);
    hub.clock.now = new Date(hub.clock.now.getTime() + 6 * 60_000);
    expect(await evaluateMessage(hub, await seedMessage(hub, { id: 'c', text: '緊急' }))).toHaveLength(1);
  });

  it('fires volume rules when the window threshold is reached', async () => {
    await seedRule(hub, 'vol', { trigger: { type: 'volume', windowMinutes: 10, threshold: 3 }, cooldownMinutes: 30 });
    const m1 = await seedMessage(hub, { id: 'v1' });
    expect(await evaluateMessage(hub, m1)).toHaveLength(0);
    await seedMessage(hub, { id: 'v2' });
    const m3 = await seedMessage(hub, { id: 'v3' });
    expect(await evaluateMessage(hub, m3)).toHaveLength(1);
  });

  it('skips rules whose agent is disabled or not allowed in the group', async () => {
    await seedRule(hub, 'r1');
    await seedGrokAgent(hub, { allowedGroupIds: [GROUP_B] });
    expect(await evaluateMessage(hub, await seedMessage(hub, { id: 'a', text: '緊急' }))).toHaveLength(0);
    await seedGrokAgent(hub, { enabled: false });
    expect(await evaluateMessage(hub, await seedMessage(hub, { id: 'b', text: '緊急' }))).toHaveLength(0);
    expect(hub.store.dump('agentDispatches')).toEqual({});
  });
});

describe('runScheduledRules', () => {
  it('opens a window on first run, then dispatches new messages every interval', async () => {
    const hub = makeTestHub();
    await seedGroup(hub);
    await seedGrokAgent(hub);
    await seedRule(hub, 'daily', { trigger: { type: 'schedule', intervalMinutes: 30 } });

    expect(await runScheduledRules(hub)).toEqual([]);
    hub.clock.now = new Date(hub.clock.now.getTime() + 10 * 60_000);
    await seedMessage(hub, { id: 's1' });
    await seedMessage(hub, { id: 's2' });
    expect(await runScheduledRules(hub)).toEqual([]); // interval not reached

    hub.clock.now = new Date(hub.clock.now.getTime() + 25 * 60_000);
    const fired = await runScheduledRules(hub);
    expect(fired).toHaveLength(1);
    expect(hub.store.dump('agentDispatches')[fired[0]]).toMatchObject({ trigger: 'schedule', messageIds: ['s1', 's2'] });

    hub.clock.now = new Date(hub.clock.now.getTime() + 31 * 60_000);
    expect(await runScheduledRules(hub)).toEqual([]); // nothing new
  });

  it('ignores groups that are no longer opened to agents', async () => {
    const hub = makeTestHub();
    await seedGroup(hub, GROUP, { agentEnabled: false });
    await seedGrokAgent(hub);
    await seedRule(hub, 'daily', { trigger: { type: 'schedule', intervalMinutes: 30 } });
    await runScheduledRules(hub);
    hub.clock.now = new Date(hub.clock.now.getTime() + 31 * 60_000);
    await seedMessage(hub, { id: 's1' });
    expect(await runScheduledRules(hub)).toEqual([]);
  });
});
