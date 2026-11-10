import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  admin: {
    groups: vi.fn(), setGroupAccess: vi.fn(), agents: vi.fn(), createAgent: vi.fn(), updateAgent: vi.fn(),
    rotateKey: vi.fn(), resetPassword: vi.fn(), testAgent: vi.fn(), rules: vi.fn(), createRule: vi.fn(),
    updateRule: vi.fn(), deleteRule: vi.fn(), settings: vi.fn(), saveSettings: vi.fn(), dashboard: vi.fn(),
    log: vi.fn(), retry: vi.fn(),
  },
  agent: { groups: vi.fn(), inbox: vi.fn(), dispatch: vi.fn(), messages: vi.fn(), search: vi.fn(), records: vi.fn(), quota: vi.fn(), act: vi.fn() },
}));

vi.mock('../hub/hubApi', async () => {
  const actual = await vi.importActual<typeof import('../hub/hubApi')>('../hub/hubApi');
  return { ...actual, hubApi: api };
});
vi.mock('../firebase', () => ({ auth: {} }));

import GroupAccessPage from '../hub/pages/GroupAccessPage';
import AgentsPage from '../hub/pages/AgentsPage';
import RulesPage from '../hub/pages/RulesPage';
import WorkbenchPage from '../hub/pages/WorkbenchPage';
import HubSettingsPage from '../hub/pages/HubSettingsPage';
import LogsPage from '../hub/pages/LogsPage';
import DashboardPage from '../hub/pages/DashboardPage';

const GROUPS = [
  { groupId: 'C1', name: 'Alpha', memberCount: 5, agentEnabled: false },
  { groupId: 'C2', name: 'Beta', memberCount: 1, agentEnabled: true },
];

function renderPage(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  api.admin.groups.mockResolvedValue({ groups: GROUPS });
  api.agent.groups.mockResolvedValue({ groups: GROUPS });
  api.admin.agents.mockResolvedValue({ agents: [] });
});

describe('GroupAccessPage', () => {
  it('lists groups closed by default and opens one to agents', async () => {
    api.admin.setGroupAccess.mockResolvedValue({ group: { ...GROUPS[0], agentEnabled: true } });
    renderPage(<GroupAccessPage />);
    const toggle = await screen.findByRole('switch', { name: 'Alpha 允許 Agent 讀取' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(api.admin.setGroupAccess).toHaveBeenCalledWith('C1', true);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });
});

describe('AgentsPage', () => {
  it('creates a Grok Bot and shows its API key and MCP URL once', async () => {
    api.admin.createAgent.mockResolvedValue({ agent: { id: 'g1', name: 'Grok', kind: 'grok_bot', enabled: true, allowedGroupIds: ['C2'], dailySendLimit: 20, inboxAlertHours: 24, routineUrl: 'https://grok.example/r', hasRoutineKey: true, apiKeyPrefix: 'wpy_abcdef', accountUid: null, accountEmail: null, createdAt: '' }, apiKey: 'wpy_secret_key' });
    renderPage(<AgentsPage />);
    await userEvent.type(await screen.findByLabelText('名稱'), 'Grok');
    await userEvent.type(screen.getByLabelText('Routine Webhook 網址'), 'https://grok.example/r');
    await userEvent.type(screen.getByLabelText('Routine Webhook Key'), 'rk');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    await userEvent.click(screen.getByRole('button', { name: '建立 Agent' }));
    expect(api.admin.createAgent).toHaveBeenCalledWith({ kind: 'grok_bot', name: 'Grok', allowedGroupIds: ['C2'], dailySendLimit: 20, inboxAlertHours: 24, routineUrl: 'https://grok.example/r', routineKey: 'rk' });
    const secret = await screen.findByRole('region', { name: '只顯示一次的憑證' });
    expect(within(secret).getByText('wpy_secret_key')).toBeInTheDocument();
    expect(within(secret).getByText(/\/api\/hub\/mcp$/)).toBeInTheDocument();
  });

  it('creates an Instinct login account and shows its password once', async () => {
    api.admin.createAgent.mockResolvedValue({ agent: { id: 'i1', name: 'Instinct', kind: 'instinct', enabled: true, allowedGroupIds: [], dailySendLimit: 20, inboxAlertHours: 24, routineUrl: null, hasRoutineKey: false, apiKeyPrefix: null, accountUid: 'u1', accountEmail: 'i@example.com', createdAt: '' }, password: 'Pw-123456789abcdefg' });
    renderPage(<AgentsPage />);
    await userEvent.selectOptions(await screen.findByLabelText('類型'), 'instinct');
    await userEvent.type(screen.getByLabelText('名稱'), 'Instinct');
    await userEvent.type(screen.getByLabelText('登入 Email'), 'i@example.com');
    await userEvent.click(screen.getByRole('button', { name: '建立 Agent' }));
    expect(api.admin.createAgent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'instinct', email: 'i@example.com' }));
    const secret = await screen.findByRole('region', { name: '只顯示一次的憑證' });
    expect(within(secret).getByText('Pw-123456789abcdefg')).toBeInTheDocument();
    expect(within(secret).getByText('i@example.com')).toBeInTheDocument();
  });

  it('updates the Grok routine webhook on an existing agent, keeping the key when left empty', async () => {
    api.admin.agents.mockResolvedValue({ agents: [{ id: 'g1', name: 'Grok', kind: 'grok_bot', enabled: true, allowedGroupIds: ['C2'], dailySendLimit: 20, inboxAlertHours: 24, routineUrl: null, hasRoutineKey: false, apiKeyPrefix: 'wpy_x', accountUid: null, accountEmail: null, createdAt: '' }] });
    api.admin.updateAgent.mockResolvedValue({ agent: {} });
    renderPage(<AgentsPage />);
    await userEvent.type(await screen.findByLabelText('Routine 網址（Grok）'), 'https://grok.example/r/2');
    await userEvent.click(screen.getByRole('button', { name: '儲存 Grok 設定' }));
    expect(api.admin.updateAgent).toHaveBeenCalledWith('g1', { allowedGroupIds: ['C2'], dailySendLimit: 20, routineUrl: 'https://grok.example/r/2' });
    await userEvent.type(screen.getByLabelText('Routine Key（Grok，留空表示不變）'), 'new-key');
    await userEvent.click(screen.getByRole('button', { name: '儲存 Grok 設定' }));
    expect(api.admin.updateAgent).toHaveBeenLastCalledWith('g1', { allowedGroupIds: ['C2'], dailySendLimit: 20, routineUrl: 'https://grok.example/r/2', routineKey: 'new-key' });
  });

  it('edits and persists the existing Instinct inbox alert hours', async () => {
    let agent = { id: 'i1', name: 'Instinct', kind: 'instinct', enabled: true, allowedGroupIds: ['C2'], dailySendLimit: 5, inboxAlertHours: 12, routineUrl: null, hasRoutineKey: false, apiKeyPrefix: null, accountUid: 'u1', accountEmail: 'i@example.com', createdAt: '' };
    api.admin.agents.mockImplementation(async () => ({ agents: [agent] }));
    api.admin.updateAgent.mockImplementation(async (_id, patch) => {
      agent = { ...agent, ...patch };
      return { agent };
    });
    const view = renderPage(<AgentsPage />);
    const field = await screen.findByLabelText('收件匣逾時預警（Instinct，小時）');
    expect(field).toHaveValue(12);
    await userEvent.clear(field);
    await userEvent.type(field, '48');
    await userEvent.click(screen.getByRole('button', { name: '儲存 Instinct 設定' }));
    expect(await screen.findByText('已儲存')).toBeInTheDocument();
    expect(api.admin.updateAgent).toHaveBeenCalledWith('i1', { allowedGroupIds: ['C2'], dailySendLimit: 5, inboxAlertHours: 48 });
    view.unmount();
    renderPage(<AgentsPage />);
    expect(await screen.findByLabelText('收件匣逾時預警（Instinct，小時）')).toHaveValue(48);
  });

  it('disables an agent', async () => {
    api.admin.agents.mockResolvedValue({ agents: [{ id: 'g1', name: 'Grok', kind: 'grok_bot', enabled: true, allowedGroupIds: [], dailySendLimit: 20, inboxAlertHours: 24, routineUrl: null, hasRoutineKey: false, apiKeyPrefix: 'wpy_x', accountUid: null, accountEmail: null, createdAt: '' }] });
    api.admin.updateAgent.mockResolvedValue({ agent: {} });
    renderPage(<AgentsPage />);
    await userEvent.click(await screen.findByRole('button', { name: '停用 Grok' }));
    expect(api.admin.updateAgent).toHaveBeenCalledWith('g1', { enabled: false });
  });
});

describe('RulesPage', () => {
  it('creates a keyword rule from the form', async () => {
    api.admin.agents.mockResolvedValue({ agents: [{ id: 'g1', name: 'Grok', kind: 'grok_bot', enabled: true, allowedGroupIds: ['C2'] }] });
    api.admin.rules.mockResolvedValue({ rules: [] });
    api.admin.createRule.mockResolvedValue({ rule: { id: 'r1' } });
    renderPage(<RulesPage />);
    await userEvent.type(await screen.findByLabelText('規則名稱'), '緊急通知');
    await userEvent.selectOptions(screen.getByLabelText('交給哪個 Agent'), 'g1');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    await userEvent.type(screen.getByLabelText('關鍵字（用逗號分隔）'), '緊急, 停電');
    await userEvent.click(screen.getByRole('checkbox', { name: '附重點整理（會用免費模型）' }));
    await userEvent.type(screen.getByLabelText('給 Agent 的指令'), '判斷是否需要預警');
    await userEvent.clear(screen.getByLabelText('冷卻時間（分鐘）'));
    await userEvent.type(screen.getByLabelText('冷卻時間（分鐘）'), '10');
    await userEvent.click(screen.getByRole('button', { name: '儲存規則' }));
    expect(api.admin.createRule).toHaveBeenCalledWith({
      name: '緊急通知', enabled: true, agentId: 'g1', groupIds: ['C2'],
      trigger: { type: 'keyword', keywords: ['緊急', '停電'], regex: null },
      include: { digest: true, raw: true, media: true, contextCount: 20 },
      instruction: '判斷是否需要預警', cooldownMinutes: 10,
    });
  });

  it('switches trigger fields by type', async () => {
    api.admin.rules.mockResolvedValue({ rules: [] });
    renderPage(<RulesPage />);
    await userEvent.selectOptions(await screen.findByLabelText('觸發條件'), 'schedule');
    expect(screen.getByLabelText('每隔幾分鐘')).toBeInTheDocument();
    expect(screen.queryByLabelText('關鍵字（用逗號分隔）')).not.toBeInTheDocument();
  });
});

describe('WorkbenchPage', () => {
  it('PR42-UAT-19 preserves completion notes after a failure and allows retry', async () => {
    const item = { id: 'i1', dispatchId: 'd1', ruleName: '復原工作', groupId: 'C2', groupName: 'Beta', instruction: '讀活動', createdAt: '' };
    let completed = false;
    api.agent.inbox.mockImplementation(async () => ({ items: completed ? [] : [item] }));
    api.agent.dispatch.mockResolvedValue({ messages: [], messageCount: 0, quota: {} });
    api.agent.act.mockRejectedValueOnce(new Error('暫時無法完成，請再試一次')).mockImplementationOnce(async () => {
      completed = true;
      return { type: 'complete_inbox', status: 'done' };
    });
    renderPage(<WorkbenchPage />);
    await userEvent.click(await screen.findByRole('button', { name: /復原工作.*Beta/ }));
    await userEvent.type(screen.getByLabelText('完成備註'), '保留這段備註');
    await userEvent.click(screen.getByRole('button', { name: '標記完成' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('暫時無法完成，請再試一次');
    expect(screen.getByLabelText('完成備註')).toHaveValue('保留這段備註');
    expect(screen.getByRole('button', { name: '標記完成' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: '標記完成' }));
    expect(await screen.findByText('目前沒有待處理的項目')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(api.agent.act).toHaveBeenLastCalledWith('complete_inbox', { itemId: 'i1', note: '保留這段備註' });
  });

  it('PR42-UAT-19 clears stale search results, explains errors and recovers', async () => {
    api.agent.inbox.mockResolvedValue({ items: [] });
    api.agent.search.mockResolvedValueOnce({ messages: [{ id: 'm1', text: '先前搜尋結果' }] })
      .mockRejectedValueOnce(new Error('搜尋暫時失敗，請重試'))
      .mockResolvedValueOnce({ messages: [] });
    renderPage(<WorkbenchPage />);
    const query = await screen.findByLabelText('搜尋關鍵字');
    await userEvent.type(query, '活動');
    await userEvent.click(screen.getByRole('button', { name: /^搜尋$/ }));
    expect(await screen.findByText('先前搜尋結果')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^搜尋$/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('搜尋暫時失敗，請重試');
    expect(query).toHaveValue('活動');
    expect(screen.queryByText('先前搜尋結果')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^搜尋$/ }));
    expect(await screen.findByText('沒有符合的訊息')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens an inbox item, sends a message and completes the item', async () => {
    api.agent.inbox.mockResolvedValue({ items: [{ id: 'i1', agentId: 'instinct_1', dispatchId: 'd1', ruleName: '每日摘要', groupId: 'C2', groupName: 'Beta', instruction: '整理今天重點', messageIds: ['m1'], status: 'open', note: null, createdAt: '2026-11-04T02:00:00.000Z' }] });
    api.agent.dispatch.mockResolvedValue({ jobId: 'd1', rule: { id: 'r', name: '每日摘要', trigger: 'schedule', instruction: '整理今天重點' }, group: { id: 'C2', name: 'Beta', memberCount: 1 }, digest: { summary: '大家在討論退款', points: ['退款'], tags: [], skipped: false, skipReason: null, mediaList: [] }, messageCount: 1, messages: [{ id: 'm1', groupId: 'C2', at: '2026-11-04T01:00:00.000Z', sender: 'Alice', senderId: 'U1', type: 'text', text: '我要退款', fileName: null, fileSize: null, durationMs: null, mentionsBot: false, media: null }], quota: { lineRemaining: 100, lineReserve: 10, agentDailyRemaining: 19 } });
    api.agent.act.mockResolvedValueOnce({ actionId: 'a1', type: 'send_message', status: 'done', code: null, detail: null, result: { cost: 1 } })
      .mockResolvedValueOnce({ actionId: 'a2', type: 'complete_inbox', status: 'done', code: null, detail: null, result: {} });
    renderPage(<WorkbenchPage />);

    await userEvent.click(await screen.findByRole('button', { name: /每日摘要.*Beta/ }));
    expect(await screen.findByText('大家在討論退款')).toBeInTheDocument();
    expect(screen.getByText('我要退款')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('動作'), 'send_message');
    await userEvent.type(screen.getByLabelText('訊息內容'), '已收到，會盡快處理');
    await userEvent.click(screen.getByRole('button', { name: '送出動作' }));
    expect(api.agent.act).toHaveBeenCalledWith('send_message', { groupId: 'C2', text: '已收到，會盡快處理' });
    expect(await screen.findByRole('status')).toHaveTextContent('已完成');

    await userEvent.type(screen.getByLabelText('完成備註'), '已回覆');
    await userEvent.click(screen.getByRole('button', { name: '標記完成' }));
    expect(api.agent.act).toHaveBeenLastCalledWith('complete_inbox', { itemId: 'i1', note: '已回覆' });
  });

  it('shows why an action was rejected', async () => {
    api.agent.inbox.mockResolvedValue({ items: [] });
    api.agent.act.mockResolvedValue({ actionId: '', type: 'send_link', status: 'invalid', code: 'url_requires_login', detail: '未登入無法開啟（HTTP 401）', result: null });
    renderPage(<WorkbenchPage />);
    await userEvent.selectOptions(await screen.findByLabelText('動作'), 'send_link');
    await userEvent.selectOptions(screen.getByLabelText('群組'), 'C2');
    await userEvent.type(screen.getByLabelText('網址'), 'https://x.example/p');
    await userEvent.type(screen.getByLabelText('標題'), '報告');
    await userEvent.click(screen.getByRole('button', { name: '送出動作' }));
    expect(api.agent.act).toHaveBeenCalledWith('send_link', { groupId: 'C2', url: 'https://x.example/p', title: '報告' });
    expect(await screen.findByRole('status')).toHaveTextContent('url_requires_login');
  });
});

describe('HubSettingsPage', () => {
  it('saves parsed settings', async () => {
    api.admin.settings.mockResolvedValue({ settings: { alertGroupId: null, quotaWarnPercents: [70, 90], quotaReservePercent: 5, retentionDays: 180, mediaMaxBytes: 52428800, signedUrlDays: 7, llm: { maxRpm: 10, maxRpd: 500, minIntervalMs: 6000 } } });
    api.admin.saveSettings.mockImplementation(async (s) => ({ settings: s }));
    renderPage(<HubSettingsPage />);
    await userEvent.selectOptions(await screen.findByLabelText('預警群組'), 'C2');
    await userEvent.clear(screen.getByLabelText('額度預警門檻（%，逗號分隔）'));
    await userEvent.type(screen.getByLabelText('額度預警門檻（%，逗號分隔）'), '60, 85');
    await userEvent.click(screen.getByRole('button', { name: '儲存設定' }));
    expect(api.admin.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ alertGroupId: 'C2', quotaWarnPercents: [60, 85], quotaReservePercent: 5, mediaMaxBytes: 52428800, llm: { maxRpm: 10, maxRpd: 500, minIntervalMs: 6000 } }));
  });
});

describe('LogsPage', () => {
  it('retries failed dispatches', async () => {
    api.admin.log.mockResolvedValue({ items: [{ id: 'd1', status: 'failed', ruleName: '緊急', lastError: 'Grok down', createdAt: '2026-11-04T02:00:00.000Z' }] });
    api.admin.retry.mockResolvedValue({ ok: true });
    renderPage(<LogsPage />);
    expect(await screen.findByText('Grok down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重試 d1' }));
    expect(api.admin.retry).toHaveBeenCalledWith('dispatches', 'd1');
  });
});

describe('DashboardPage', () => {
  it('shows quota, model usage, failures and alerts', async () => {
    api.admin.dashboard.mockResolvedValue({ quota: { type: 'limited', limit: 200, used: 150, remaining: 50, reserve: 10, percent: 75, unknown: false, projectedMonthEnd: 210 }, llm: { today: 12, maxRpd: 500 }, agents: [{ id: 'g1', name: 'Grok', kind: 'grok_bot', enabled: true, sendsToday: 3, dailySendLimit: 20 }], failed: { dispatches: 1, actions: 0, media: 0 }, openInbox: 2, recentAlerts: [{ id: 'a1', severity: 'warning', source: 'line_quota', text: 'LINE 額度 75%', delivered: true, deliveryError: null, createdAt: '2026-11-04T02:00:00.000Z' }] });
    renderPage(<DashboardPage />);
    expect(await screen.findByText('150 / 200 則（75%）')).toBeInTheDocument();
    expect(screen.getByText('預估月底 210 則')).toBeInTheDocument();
    expect(screen.getByText('12 / 500 次')).toBeInTheDocument();
    expect(screen.getByText('Grok：今天 3 / 20 次')).toBeInTheDocument();
    expect(screen.getByText('LINE 額度 75%')).toBeInTheDocument();
  });
});
