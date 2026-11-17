import { parseCorsOrigins } from '../config/corsOrigins';

describe('parseCorsOrigins', () => {
  const defaults = [
    'https://wippy-mvp.web.app',
    'https://wippy-mvp.firebaseapp.com',
    'http://localhost:5173',
  ];

  it('falls back to the current production and local origins when unset or blank', () => {
    expect(parseCorsOrigins(undefined)).toEqual(defaults);
    expect(parseCorsOrigins('')).toEqual(defaults);
    expect(parseCorsOrigins('   ')).toEqual(defaults);
  });

  it('reads a comma-separated list and trims spaces', () => {
    expect(parseCorsOrigins('https://a.example, https://b.example ')).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
  });
});
