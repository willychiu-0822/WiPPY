import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeEditor from '../components/KnowledgeEditor';
import type { ActivityKnowledge } from '../lib/api';

const now = { _seconds: 0, _nanoseconds: 0 };

function makeKnowledge(overrides: Partial<ActivityKnowledge> = {}): ActivityKnowledge {
  return {
    id: 'k1',
    activityId: 'act_1',
    userId: 'user_1',
    knowledgeType: 'background',
    title: '故事背景',
    content: '1920 年代上海密室逃脫。',
    sourceType: 'manual',
    targetGroupId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('KnowledgeEditor — empty state', () => {
  it('shows empty state message when no knowledge', () => {
    render(
      <KnowledgeEditor
        knowledge={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/尚無知識條目/)).toBeInTheDocument();
  });

  it('shows + 新增知識條目 button', () => {
    render(
      <KnowledgeEditor knowledge={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /新增知識條目/ })).toBeInTheDocument();
  });
});

describe('KnowledgeEditor — displaying items', () => {
  it('renders knowledge title and content', () => {
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge()]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('故事背景')).toBeInTheDocument();
    expect(screen.getByText(/1920 年代上海密室逃脫/)).toBeInTheDocument();
  });

  it('shows manual badge for sourceType manual', () => {
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge({ sourceType: 'manual' })]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('手動')).toBeInTheDocument();
  });

  it('shows AI 生成 badge for agent_generated', () => {
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge({ sourceType: 'agent_generated' })]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('AI 生成')).toBeInTheDocument();
  });

  it('renders multiple items', () => {
    const items = [
      makeKnowledge({ id: 'k1', title: '故事背景', knowledgeType: 'background' }),
      makeKnowledge({ id: 'k2', title: '主角艾瑞克', knowledgeType: 'character' }),
    ];
    render(
      <KnowledgeEditor knowledge={items} onAdd={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('故事背景')).toBeInTheDocument();
    expect(screen.getByText('主角艾瑞克')).toBeInTheDocument();
  });
});

describe('KnowledgeEditor — add form', () => {
  it('opens add form when + 新增知識條目 is clicked', () => {
    render(
      <KnowledgeEditor knowledge={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /新增知識條目/ }));
    expect(screen.getByPlaceholderText(/例：主角/)).toBeInTheDocument();
  });

  it('calls onAdd with correct data when form is submitted', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <KnowledgeEditor knowledge={[]} onAdd={onAdd} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /新增知識條目/ }));
    fireEvent.change(screen.getByPlaceholderText(/例：主角/), {
      target: { value: '新故事標題' },
    });
    fireEvent.change(screen.getByPlaceholderText(/詳細描述/), {
      target: { value: '詳細內容在這裡' },
    });
    fireEvent.click(screen.getByRole('button', { name: '新增' }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: '新故事標題', content: '詳細內容在這裡' })
      );
    });
  });

  it('新增 button is disabled when title or content is empty', () => {
    render(
      <KnowledgeEditor knowledge={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /新增知識條目/ }));
    expect(screen.getByRole('button', { name: '新增' })).toBeDisabled();
  });

  it('closes form when 取消 is clicked', () => {
    render(
      <KnowledgeEditor knowledge={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /新增知識條目/ }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByPlaceholderText(/例：主角/)).not.toBeInTheDocument();
  });
});

describe('KnowledgeEditor — delete', () => {
  it('calls onDelete with correct id when 刪除 is clicked', () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge({ id: 'k_del' })]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '刪除' }));
    expect(onDelete).toHaveBeenCalledWith('k_del');
  });
});

describe('KnowledgeEditor — edit', () => {
  it('shows edit form when 編輯 is clicked', () => {
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge()]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument();
  });

  it('calls onUpdate with correct id when 儲存 is clicked', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <KnowledgeEditor
        knowledge={[makeKnowledge({ id: 'k_edit', title: '舊標題' })]}
        onAdd={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    const titleInput = screen.getByDisplayValue('舊標題');
    fireEvent.change(titleInput, { target: { value: '新標題' } });
    fireEvent.click(screen.getByRole('button', { name: '儲存' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'k_edit',
        expect.objectContaining({ title: '新標題' })
      );
    });
  });
});
