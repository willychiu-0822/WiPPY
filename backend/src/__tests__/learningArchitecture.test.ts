import fs from 'fs';
import path from 'path';

const forbiddenImportFragments = [
  'express',
  'firebase',
  'firebase-admin',
  '@google/genai',
  'cloudTasks',
  '/routes/',
  '/services/',
  '/water',
  '/harness',
  '/activities',
];

function collectTypeScriptFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTypeScriptFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : [];
  });
}

describe('learning domain architecture', () => {
  it('keeps domain files isolated from frameworks and WiPPY feature modules', () => {
    const domainRoot = path.join(__dirname, '..', 'learning', 'domain');
    const files = collectTypeScriptFiles(domainRoot);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      const importLines = source
        .split(/\r?\n/)
        .filter((line) => /^\s*(import|export)\s.+\sfrom\s/.test(line))
        .join('\n');
      for (const fragment of forbiddenImportFragments) {
        expect(importLines).not.toContain(fragment);
      }
      expect(source).not.toContain('Date.now(');
      expect(source).not.toContain('process.env');
    }
  });
});
