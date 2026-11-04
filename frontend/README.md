# WiPPY Frontend

React + TypeScript + Vite frontend for WiPPY.

## Development

```powershell
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## LIFF Development

Create a local LIFF dev env file:

```powershell
Copy-Item .env.liff-dev.example .env.liff-dev
```

Start LIFF dev mode:

```powershell
npm run dev:liff
```

`VITE_LIFF_DEV=true` makes `LiffProvider` return a dev profile and mock group context outside LINE. Use `?mockPreset=no_group` or `?mockPreset=share_unavailable` to reproduce edge cases.

Full PM UAT and LINE App debugging instructions live in:

```text
../docs/liff-dev-uat.md
```

## Checks

```powershell
npm run lint
npm run build
npm test
```

Frontend tests use Vitest + Testing Library. Test files live in `src/__tests__/`.
