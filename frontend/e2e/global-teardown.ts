import { execFile } from 'node:child_process';

const e2ePorts = [4000, 5173, 8088, 8080, 9099, 9199];

function stopWindowsPorts(): Promise<void> {
  const command = `
    $ports = @(${e2ePorts.join(',')});
    foreach ($port in $ports) {
      Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 0 } |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
  `;
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-Command', command], () => resolve());
  });
}

export default async function globalTeardown() {
  if (process.platform === 'win32') {
    await stopWindowsPorts();
  }
}
