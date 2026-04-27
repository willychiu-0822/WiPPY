import express, { Request, Response } from 'express';
import { getDb } from '../../firebase';
import { authMiddleware } from '../../middleware/auth';
import {
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
  approveActivity,
  requestRevision,
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '../../services/activityService';
import type { KnowledgeType, KnowledgeSourceType } from '../../types';

const router = express.Router();

// ─── Activities ───────────────────────────────────────────────────────────────

// GET /api/activities
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const activities = await listActivities(getDb(), req.userId!);
    res.json({ activities });
  } catch (err) {
    console.error(JSON.stringify({ event: 'list_activities_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST /api/activities
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, targetGroups } = req.body as { name?: string; targetGroups?: string[] };
    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const activity = await createActivity(getDb(), req.userId!, {
      name: name.trim(),
      targetGroups: targetGroups ?? [],
    });
    res.status(201).json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'create_activity_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// GET /api/activities/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const activity = await getActivity(getDb(), req.params['id']! as string, req.userId!);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'get_activity_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// PATCH /api/activities/:id
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, targetGroups, status, eventStartAt, eventEndAt, agentSessionId } =
      req.body as {
        name?: string;
        targetGroups?: string[];
        status?: 'draft' | 'active' | 'completed';
        eventStartAt?: string | null;
        eventEndAt?: string | null;
        agentSessionId?: string | null;
      };

    const patch: Parameters<typeof updateActivity>[3] = {};
    if (name !== undefined) patch.name = name;
    if (targetGroups !== undefined) patch.targetGroups = targetGroups;
    if (status !== undefined) patch.status = status;
    if (agentSessionId !== undefined) patch.agentSessionId = agentSessionId;

    const activity = await updateActivity(getDb(), req.params['id']! as string, req.userId!, patch);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'update_activity_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// PATCH /api/activities/:id/approve
router.patch('/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const activity = await approveActivity(getDb(), req.params['id']! as string, req.userId!);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'approve_activity_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to approve activity' });
  }
});

// PATCH /api/activities/:id/request-revision
router.patch('/:id/request-revision', authMiddleware, async (req: Request, res: Response) => {
  try {
    const activity = await requestRevision(getDb(), req.params['id']! as string, req.userId!);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.json({ activity });
  } catch (err) {
    console.error(JSON.stringify({ event: 'request_revision_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────

// GET /api/activities/:id/messages
router.get('/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const messages = await listMessages(getDb(), req.params['id']! as string, req.userId!);
    res.json({ messages });
  } catch (err) {
    console.error(JSON.stringify({ event: 'list_messages_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/activities/:id/messages
router.post('/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, targetGroups, triggerType, triggerValue, sequenceOrder } =
      req.body as {
        content?: string;
        targetGroups?: string[];
        triggerType?: 'scheduled' | 'keyword';
        triggerValue?: string;
        sequenceOrder?: number;
      };

    if (!content?.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    if (!triggerType || !['scheduled', 'keyword'].includes(triggerType)) {
      res.status(400).json({ error: 'triggerType must be scheduled or keyword' });
      return;
    }
    if (!triggerValue?.trim()) {
      res.status(400).json({ error: 'triggerValue is required' });
      return;
    }

    const message = await createMessage(getDb(), req.params['id']! as string, req.userId!, {
      content: content.trim(),
      targetGroups: targetGroups ?? [],
      triggerType,
      triggerValue: triggerValue.trim(),
      sequenceOrder: sequenceOrder ?? 0,
    });

    if (!message) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.status(201).json({ message });
  } catch (err) {
    console.error(JSON.stringify({ event: 'create_message_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// PATCH /api/activities/:id/messages/:msgId
router.patch('/:id/messages/:msgId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, targetGroups, triggerValue, sequenceOrder } =
      req.body as {
        content?: string;
        targetGroups?: string[];
        triggerValue?: string;
        sequenceOrder?: number;
      };

    const patch: Parameters<typeof updateMessage>[4] = {};
    if (content !== undefined) patch.content = content;
    if (targetGroups !== undefined) patch.targetGroups = targetGroups;
    if (triggerValue !== undefined) patch.triggerValue = triggerValue;
    if (sequenceOrder !== undefined) patch.sequenceOrder = sequenceOrder;

    const message = await updateMessage(
      getDb(),
      req.params['id']! as string,
      req.params['msgId']! as string,
      req.userId!,
      patch
    );
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ message });
  } catch (err) {
    console.error(JSON.stringify({ event: 'update_message_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/activities/:id/messages/:msgId
router.delete('/:id/messages/:msgId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ok = await deleteMessage(
      getDb(),
      req.params['id']! as string,
      req.params['msgId']! as string,
      req.userId!
    );
    if (!ok) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'delete_message_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ─── Knowledge ────────────────────────────────────────────────────────────────

// GET /api/activities/:id/knowledge
router.get('/:id/knowledge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const knowledge = await listKnowledge(getDb(), req.params['id']! as string, req.userId!);
    res.json({ knowledge });
  } catch (err) {
    console.error(JSON.stringify({ event: 'list_knowledge_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// POST /api/activities/:id/knowledge
router.post('/:id/knowledge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { knowledgeType, title, content, sourceType, targetGroupId } =
      req.body as {
        knowledgeType?: KnowledgeType;
        title?: string;
        content?: string;
        sourceType?: KnowledgeSourceType;
        targetGroupId?: string | null;
      };

    const validTypes: KnowledgeType[] = ['background', 'restriction', 'character', 'faq'];
    if (!knowledgeType || !validTypes.includes(knowledgeType)) {
      res.status(400).json({ error: 'knowledgeType must be background, restriction, character, or faq' });
      return;
    }
    if (!title?.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    if (!content?.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const knowledge = await createKnowledge(getDb(), req.params['id']! as string, req.userId!, {
      knowledgeType,
      title: title.trim(),
      content: content.trim(),
      sourceType,
      targetGroupId,
    });

    if (!knowledge) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    res.status(201).json({ knowledge });
  } catch (err) {
    console.error(JSON.stringify({ event: 'create_knowledge_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to create knowledge' });
  }
});

// PATCH /api/activities/:id/knowledge/:knowledgeId
router.patch('/:id/knowledge/:knowledgeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, content, knowledgeType, targetGroupId } =
      req.body as {
        title?: string;
        content?: string;
        knowledgeType?: KnowledgeType;
        targetGroupId?: string | null;
      };

    const patch: Parameters<typeof updateKnowledge>[3] = {};
    if (title !== undefined) patch.title = title;
    if (content !== undefined) patch.content = content;
    if (knowledgeType !== undefined) patch.knowledgeType = knowledgeType;
    if (targetGroupId !== undefined) patch.targetGroupId = targetGroupId;

    const knowledge = await updateKnowledge(
      getDb(),
      req.params['knowledgeId']! as string,
      req.userId!,
      patch
    );
    if (!knowledge) {
      res.status(404).json({ error: 'Knowledge not found' });
      return;
    }
    res.json({ knowledge });
  } catch (err) {
    console.error(JSON.stringify({ event: 'update_knowledge_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to update knowledge' });
  }
});

// DELETE /api/activities/:id/knowledge/:knowledgeId
router.delete('/:id/knowledge/:knowledgeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ok = await deleteKnowledge(
      getDb(),
      req.params['knowledgeId']! as string,
      req.userId!
    );
    if (!ok) {
      res.status(404).json({ error: 'Knowledge not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'delete_knowledge_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to delete knowledge' });
  }
});

export { router as activitiesRouter };
