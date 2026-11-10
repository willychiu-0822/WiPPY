import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MessagePlanTable from '../components/MessagePlanTable';
import type { ActivityMessage } from '../lib/api';

const now = { _seconds: 0, _nanoseconds: 0 };

function makeMessage(overrides: Partial<ActivityMessage> = {}): ActivityMessage {
  return {
    id: 'msg_1',
    activityId: 'act_1',
    userId: 'user_1',
    content: '活動即將開始！',
    targetGroups: ['group_a'],
    triggerType: 'scheduled',
    triggerValue: '2025-05-10T10:00:00+08:00',
    cooldownMinutes: null,
    status: 'pending',
    reviewStatus: 'pending_review',
    generatedByAgent: false,
    agentSessionId: null,
    sequenceOrder: 1,
    sendWindowStart: null,
    sendWindowEnd: null,
    sentAt: null,
    processingAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('MessagePlanTable — empty state', () => {
  it('shows empty message when no messages', () => {
    render(
      <MessagePlanTable messages={[]} locked={false} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText(/尚無推播訊息/)).toBeInTheDocument();
  });
});

describe('MessagePlanTable — rendering', () => {
  it('shows group names and explains unavailable names without exposing identifiers', () => {
    render(<MessagePlanTable messages={[makeMessage({ targetGroups: ['group_a', 'missing'] })]} groups={[{ groupId: 'group_a', name: '讀書會' }]} locked={false} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('群組：讀書會、無法取得名稱的群組')).toBeInTheDocument();
    expect(screen.queryByText(/missing|group_a/)).not.toBeInTheDocument();
  });
  it('renders message content', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage()]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('活動即將開始！')).toBeInTheDocument();
  });

  it('shows 待審核 badge for pending_review', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ reviewStatus: 'pending_review' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('待審核')).toBeInTheDocument();
  });

  it('shows 已核准 badge for approved', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ reviewStatus: 'approved' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('已核准')).toBeInTheDocument();
  });

  it('shows AI badge for agent-generated messages', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ generatedByAgent: true })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders messages sorted by sequenceOrder', () => {
    const msgs = [
      makeMessage({ id: 'm3', sequenceOrder: 3, content: '第三則' }),
      makeMessage({ id: 'm1', sequenceOrder: 1, content: '第一則' }),
      makeMessage({ id: 'm2', sequenceOrder: 2, content: '第二則' }),
    ];
    render(
      <MessagePlanTable messages={msgs} locked={false} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    const contents = screen.getAllByText(/第[一二三]則/).map((el) => el.textContent);
    expect(contents).toEqual(['第一則', '第二則', '第三則']);
  });

  it('shows sent status badge for sent messages', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ status: 'sent' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('已送出')).toBeInTheDocument();
  });
});

describe('MessagePlanTable — edit / delete controls', () => {
  it('shows 編輯 and 刪除 buttons when not locked and message is pending', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ status: 'pending' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '編輯' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument();
  });

  it('hides edit/delete when locked=true (plan approved)', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ status: 'pending' })]}
        locked={true}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: '編輯' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '刪除' })).not.toBeInTheDocument();
  });

  it('hides edit/delete for already-sent messages', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage({ status: 'sent' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: '編輯' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '刪除' })).not.toBeInTheDocument();
  });

  it('calls onDelete with correct id when 刪除 is clicked', () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <MessagePlanTable
        messages={[makeMessage({ id: 'msg_del' })]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '刪除' }));
    expect(onDelete).toHaveBeenCalledWith('msg_del');
  });

  it('opens edit form when 編輯 is clicked', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage()]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument();
  });

  it('calls onUpdate with new content when 儲存 is clicked', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <MessagePlanTable
        messages={[makeMessage({ id: 'msg_upd', content: '舊內容' })]}
        locked={false}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    const textarea = screen.getByDisplayValue('舊內容');
    fireEvent.change(textarea, { target: { value: '新內容' } });
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'msg_upd',
        expect.objectContaining({ content: '新內容' })
      );
    });
  });

  it('closes edit form when 取消 is clicked', () => {
    render(
      <MessagePlanTable
        messages={[makeMessage()]}
        locked={false}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByRole('button', { name: '儲存' })).not.toBeInTheDocument();
  });
});

describe('UAT-12 keyword message compatibility', () => {
  it('allows editing content when triggerValue is a keyword', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<MessagePlanTable messages={[makeMessage({ triggerType: 'keyword', triggerValue: '報名' })]} locked={false} onUpdate={onUpdate} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.change(screen.getByDisplayValue('活動即將開始！'), { target: { value: '關鍵字回覆內容' } });
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith('msg_1', { content: '關鍵字回覆內容', triggerValue: '報名' }));
  });
});

describe('UAT-23 message failure recovery', () => {
  it('explains a failed delete, retains the message and allows retry', async () => {
    const onDelete = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(undefined);
    render(<MessagePlanTable messages={[makeMessage()]} locked={false} onUpdate={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '刪除' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('刪除失敗，請檢查網路連線後重試');
    expect(screen.getByText('活動即將開始！')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '刪除' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it('blocks repeated deletion and editing while a deletion is pending', async () => {
    let finish!: () => void;
    const onDelete = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<MessagePlanTable messages={[makeMessage()]} locked={false} onUpdate={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '刪除' }));
    expect(screen.getByRole('button', { name: '刪除中...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '編輯' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '刪除中...' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    expect(screen.getByRole('button', { name: '刪除' })).toBeEnabled();
  });

  it('retains an offline draft while showing a readable retry message', async () => {
    render(<MessagePlanTable messages={[makeMessage()]} locked={false} onUpdate={vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    fireEvent.change(screen.getByDisplayValue('活動即將開始！'), { target: { value: '還沒儲存的草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('儲存失敗，請檢查網路連線後重試');
    expect(screen.getByDisplayValue('還沒儲存的草稿')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '儲存' })).toBeEnabled();
  });
});
