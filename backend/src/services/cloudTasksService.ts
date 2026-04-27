import type { HarnessInput } from './harnessOrchestrator';

// Uses Cloud Tasks REST API with Application Default Credentials via google-auth-library,
// which firebase-admin already brings in as a transitive dependency.
// No extra package needed — we call the API via fetch + access token.

let _accessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_accessToken && _accessToken.expiresAt > now + 30_000) return _accessToken.token;

  // On Cloud Run, metadata server provides tokens automatically
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } }
  );
  if (!res.ok) throw new Error(`Metadata server error: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  _accessToken = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return _accessToken.token;
}

export function isCloudTasksEnabled(): boolean {
  return !!(process.env.CLOUD_TASKS_QUEUE && process.env.CLOUD_RUN_SERVICE_URL);
}

export async function enqueueHarnessRun(params: Omit<HarnessInput, 'runId'> & { runId: string }): Promise<void> {
  const project = process.env.CLOUD_TASKS_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
  const location = process.env.CLOUD_TASKS_LOCATION ?? 'asia-east1';
  const queue = process.env.CLOUD_TASKS_QUEUE!;
  const serviceUrl = process.env.CLOUD_RUN_SERVICE_URL!;
  const secret = process.env.INTERNAL_HARNESS_SECRET ?? '';

  const token = await getAccessToken();
  const queuePath = `projects/${project}/locations/${location}/queues/${queue}`;
  const url = `https://cloudtasks.googleapis.com/v2/${queuePath}/tasks`;

  const body = JSON.stringify({
    task: {
      httpRequest: {
        httpMethod: 'POST',
        url: `${serviceUrl}/api/internal/harness/run`,
        headers: {
          'Content-Type': 'application/json',
          'X-Harness-Secret': secret,
        },
        body: Buffer.from(JSON.stringify(params)).toString('base64'),
      },
    },
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloud Tasks enqueue failed ${res.status}: ${text}`);
  }
}
