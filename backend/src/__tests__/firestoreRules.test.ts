import fs from 'fs';
import path from 'path';

describe('firestore.rules production ownership guardrails', () => {
  const rules = fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8');

  function block(collection: string): string {
    const match = rules.match(new RegExp(`match /${collection}/\\{[^}]+\\} \\{[\\s\\S]*?\\n    \\}`));
    if (!match) {
      throw new Error(`rules block for ${collection} not found`);
    }
    return match[0];
  }

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
    for (const collection of ['groups', 'sendLogs', 'harnessRuns', 'rateLimits', 'activityKnowledge', 'agentSessions']) {
      expect(rules).toMatch(new RegExp(`match /${collection}/\\{[^}]+\\} \\{[\\s\\S]*allow (read, )?write: if false`));
    }
  });

  it('keeps every Agent Hub collection closed to frontend clients', () => {
    for (const collection of ['groupMessages', 'mediaAssets', 'agents', 'agentRules', 'hubRuleState', 'agentDispatches', 'agentInbox', 'digests', 'hubActions', 'agentRecords', 'hubSettings', 'hubCounters', 'hubQuota', 'hubAlerts', 'hubAuditLogs', 'hubAccounts', 'hubGroupStats']) {
      expect(rules).toMatch(new RegExp(`match /${collection}/\\{id\\} \\{ allow read, write: if false; \\}`));
    }
  });

  it('rejects client create and update on activityKnowledge and agentSessions, including the document owner', () => {
    for (const collection of ['activityKnowledge', 'agentSessions']) {
      const text = block(collection);
      expect(text).toMatch(/allow write: if false/);
      expect(text).not.toMatch(/allow (create|update|write): if request\.auth/);
      expect(text).toMatch(/allow read: if request\.auth != null && resource\.data\.userId == request\.auth\.uid/);
    }
  });

  it('rejects a non-owner create or update on users, activityKnowledge and agentSessions', () => {
    const users = block('users');
    expect(users).toMatch(/allow read: if request\.auth != null && request\.auth\.uid == userId/);
    expect(users).toMatch(/allow create, update: if request\.auth != null && request\.auth\.uid == userId/);
    expect(users).not.toMatch(/allow read, write:/);
    expect(users).toMatch(/allow delete: if false/);
    expect(users).toMatch(/keys\(\)\.hasOnly\(\['displayName', 'email', 'timezone', 'createdAt'\]\)/);

    for (const collection of ['activityKnowledge', 'agentSessions']) {
      expect(block(collection)).toMatch(/allow write: if false/);
    }
  });
});
