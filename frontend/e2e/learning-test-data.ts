import { spawn } from 'node:child_process';
import path from 'node:path';

const authHost = 'http://127.0.0.1:9099';
const projectId = 'demo-wippy-learning';

export async function createEmulatorUser(): Promise<{ uid: string; email: string; password: string }> {
  const email = `learning-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const password = 'learning-pass-123';
  const response = await fetch(`${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) {
    throw new Error(`Auth emulator signUp failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { localId: string };
  return { uid: body.localId, email, password };
}

export async function signInEmulatorUser(email: string, password: string): Promise<{ idToken: string }> {
  const response = await fetch(`${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) {
    throw new Error(`Auth emulator signIn failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { idToken: string };
  return { idToken: body.idToken };
}

export async function setLearningAccess(uid: string, enabled = true): Promise<void> {
  const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args = process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'learning:access', '--', uid, String(enabled)]
    : ['run', 'learning:access', '--', uid, String(enabled)];
  const backendDir = path.resolve(process.cwd(), '../backend');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: backendDir,
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        GCLOUD_PROJECT: projectId,
        FIREBASE_PROJECT_ID: projectId,
      },
      stdio: 'pipe',
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`learning:access failed (${code}): ${output}`));
    });
  });
}
