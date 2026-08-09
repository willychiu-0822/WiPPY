import { auth } from '../../firebase';
import { getResponseErrorMessage } from '../../lib/apiError';
import type {
  AttemptResultView,
  ChallengeReportRequest,
  ChallengeReportResultView,
  CreateLearningSourceRequest,
  KnowledgePageView,
  LearningApi,
  LearningRoundView,
  LearningRunView,
  LearningSourceView,
  SubmitLearningAttemptRequest,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/api/learning${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(await getResponseErrorMessage(response));
  return response.json() as Promise<T>;
}

export const learningApi: LearningApi = {
  getAccess: () => request<{ enabled: boolean }>('/access'),
  createSource: (input: CreateLearningSourceRequest) =>
    request<{ sourceId: string; runId: string; status: LearningRunView['status'] }>('/sources', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getSource: async (sourceId: string) => {
    const response = await request<{ source: LearningSourceView }>(`/sources/${sourceId}`);
    return response.source;
  },
  getRun: async (runId: string) => {
    const response = await request<{ run: LearningRunView }>(`/runs/${runId}`);
    return response.run;
  },
  retryRun: (runId: string) => request<LearningRunView>(`/runs/${runId}/retry`, { method: 'POST', body: JSON.stringify({}) }),
  createRound: (input: { sourceId?: string }) =>
    request<LearningRoundView>('/rounds', { method: 'POST', body: JSON.stringify(input) }),
  submitAttempt: (input: SubmitLearningAttemptRequest) =>
    request<AttemptResultView>('/attempts', { method: 'POST', body: JSON.stringify(input) }),
  reportChallenge: (challengeId: string, input: ChallengeReportRequest) =>
    request<ChallengeReportResultView>(`/challenges/${challengeId}/reports`, { method: 'POST', body: JSON.stringify(input) }),
  listKnowledge: ({ limit, cursor }: { limit: number; cursor?: string }) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request<KnowledgePageView>(`/knowledge?${params.toString()}`);
  },
  setKnowledgeExcluded: async (itemId: string, excludedByUser: boolean) => {
    await request<{ ok: boolean }>(`/knowledge/${itemId}`, { method: 'PATCH', body: JSON.stringify({ excludedByUser }) });
    return { excludedByUser };
  },
};
