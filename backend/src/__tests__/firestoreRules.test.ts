import fs from 'fs';
import path from 'path';

describe('firestore.rules production ownership guardrails', () => {
  const rules = fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8');

  it('keeps user-owned top-level collections scoped to request.auth.uid', () => {
    for (const collection of [
      'activities',
      'activityKnowledge',
      'agentSessions',
      'capturedMessages',
      'sendLogs',
      'harnessRuns',
    ]) {
      expect(rules).toMatch(new RegExp(`match /${collection}/\\{[^}]+\\} \\{[\\s\\S]*request\\.auth != null[\\s\\S]*resource\\.data\\.userId == request\\.auth\\.uid`));
    }
  });

  it('keeps backend-only collections unwritable from clients', () => {
    for (const collection of ['groups', 'sendLogs', 'harnessRuns', 'rateLimits']) {
      expect(rules).toMatch(new RegExp(`match /${collection}/\\{[^}]+\\} \\{[\\s\\S]*allow (read, )?write: if false`));
    }
  });

  it('requires create requests to claim the authenticated owner for client-created docs', () => {
    for (const collection of ['activityKnowledge', 'agentSessions']) {
      expect(rules).toMatch(new RegExp(`match /${collection}/\\{[^}]+\\} \\{[\\s\\S]*allow create: if request\\.auth != null && request\\.resource\\.data\\.userId == request\\.auth\\.uid`));
    }
  });
});
