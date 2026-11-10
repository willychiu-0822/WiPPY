const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');

// Execute the curl text a beginner copies, feeding credentials through stdin only.
// No shell text, response token, password, or key is written to an artifact.
async function runGuideExamples(values, check) {
  const guide = readFileSync('docs/agent-hub/INSTALL-GROK-BOT-AND-INSTINCT.md', 'utf8');
  let index = 0;
  for (const [, block] of guide.matchAll(/```bash\n([\s\S]*?)```/g)) {
    const commands = block.replace(/\\\n/g, ' ').split('\n').map(l => l.trim()).filter(l => l.startsWith('curl '));
    for (const command of commands) {
      index += 1;
      const isLogin = command.includes('accounts:signInWithPassword');
      const expanded = command
        .replace('https://identitytoolkit.googleapis.com', `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9299'}/identitytoolkit.googleapis.com`)
        .replace(/<([A-Z_]+)>/g, (_, name) => {
          if (!values[name]) throw new Error(`Guide example ${index}: missing placeholder ${name}`);
          // All fixture substitutions must fit the single-quoted example strings.
          if (values[name].includes("'")) throw new Error(`Unsafe fixture placeholder: ${name}`);
          return values[name];
        });
      const output = await new Promise((resolve, reject) => {
        const child = spawn('bash', ['-s'], { env: { PATH: process.env.PATH }, stdio: ['pipe', 'pipe', 'pipe'] });
        let stdout = '';
        child.stdout.on('data', b => { stdout += b; });
        child.stderr.resume(); // Never include response or command text in failure logs.
        child.on('error', () => reject(new Error(`Guide example ${index}: curl could not start`)));
        child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(`Guide example ${index}: curl exit ${code}`)));
        child.stdin.end(expanded.replace(/^curl /, "curl --max-time 15 --write-out '\\n%{http_code}' ") + '\n');
      });
      const boundary = output.lastIndexOf('\n');
      const status = Number(output.slice(boundary + 1));
      const body = JSON.parse(output.slice(0, boundary));
      if (isLogin) {
        if (status !== 200 || !body.idToken) throw new Error('Instinct guide login failed');
        values.FIREBASE_ID_TOKEN = body.idToken;
      }
      await check({ index, command, status, body, isLogin });
    }
  }
  return index;
}
module.exports = { runGuideExamples };
