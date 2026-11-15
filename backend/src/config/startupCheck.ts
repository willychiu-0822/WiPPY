import { getLLMConfigStatus } from '../services/llmProvider';

export interface ConfigGap {
  name: string;
  why: string;
}

function has(env: NodeJS.ProcessEnv, name: string): boolean {
  return !!env[name]?.trim();
}

/**
 * Settings production needs to work end to end. Only names are reported,
 * never values. Local development is allowed to run with gaps.
 */
export function findConfigGaps(env: NodeJS.ProcessEnv = process.env): ConfigGap[] {
  const gaps: ConfigGap[] = [];
  const need = (name: string, why: string) => {
    if (!has(env, name)) gaps.push({ name, why });
  };

  need('OWNER_USER_ID', 'back office and Agent Hub reply 503 without an owner');
  need('LINE_CHANNEL_SECRET', 'LINE webhook signatures cannot be verified');
  need('LINE_CHANNEL_ACCESS_TOKEN', 'messages cannot be sent to LINE');
  need('SCHEDULER_SECRET', 'every /scheduler/* call is rejected');
  need('HUB_ENCRYPTION_KEY', 'Grok routine keys cannot be saved or used');

  if (has(env, 'HUB_TASKS_QUEUE') || has(env, 'CLOUD_TASKS_QUEUE')) {
    need('INTERNAL_HARNESS_SECRET', 'Cloud Tasks callbacks to /api/internal/* are rejected');
    need('CLOUD_RUN_SERVICE_URL', 'Cloud Tasks has no URL to call back');
  }

  for (const name of getLLMConfigStatus(env).missingEnv) {
    gaps.push({ name, why: 'AI planning and Hub replies are disabled' });
  }

  return gaps;
}

/**
 * Logs one WARN line listing missing settings. It never stops the server:
 * a half-configured service that still answers /health is easier to fix
 * than one that crash-loops during a deploy.
 */
export function reportConfigGaps(
  env: NodeJS.ProcessEnv = process.env,
  log: (line: string) => void = console.log,
): ConfigGap[] {
  // Same rule as isProduction() in hub/accounts.ts, but reading the given env.
  const production = env['K_SERVICE'] !== undefined || env['NODE_ENV'] === 'production';
  if (!production) return [];
  const gaps = findConfigGaps(env);
  if (gaps.length > 0) {
    log(JSON.stringify({
      severity: 'WARNING',
      message: `Missing production settings: ${gaps.map((g) => g.name).join(', ')}`,
      missing: gaps,
    }));
  }
  return gaps;
}
