import { toWaterApiErrorResponse, validateDrinkInput } from '../routes/api/water';
import { MAX_DRINK_ML } from '../services/waterService';

describe('water API error response', () => {
  it('hides Firestore index URLs from LIFF users', () => {
    const response = toWaterApiErrorResponse(
      'Failed to initialize water session',
      new Error('FAILED_PRECONDITION: The query requires a COLLECTION_GROUP_ASC index. You can create it here: https://console.firebase.google.com/project/wippy-mvp/firestore/indexes')
    );

    expect(response).toEqual({
      status: 503,
      body: {
        error: '喝水戰場正在準備中，請稍後再試。',
        code: 'water_index_building',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('console.firebase.google.com');
  });
});

describe('validateDrinkInput', () => {
  it('accepts a normal drink within bounds', () => {
    expect(validateDrinkInput(300, 'water')).toEqual({ ok: true, ml: 300, drinkType: 'water' });
  });

  it('rejects non-positive or non-integer ml', () => {
    expect(validateDrinkInput(0, 'water')).toMatchObject({ ok: false });
    expect(validateDrinkInput(-100, 'water')).toMatchObject({ ok: false });
    expect(validateDrinkInput(150.5, 'water')).toMatchObject({ ok: false });
    expect(validateDrinkInput('300', 'water')).toMatchObject({ ok: false });
    expect(validateDrinkInput(undefined, 'water')).toMatchObject({ ok: false });
  });

  it('rejects values above the per-log cap to protect aggregates from abuse', () => {
    expect(validateDrinkInput(MAX_DRINK_ML, 'water')).toMatchObject({ ok: true });
    expect(validateDrinkInput(MAX_DRINK_ML + 1, 'water')).toMatchObject({ ok: false });
    expect(validateDrinkInput(2_000_000_000, 'water')).toMatchObject({ ok: false });
  });

  it('rejects unknown drink types', () => {
    expect(validateDrinkInput(300, 'beer')).toMatchObject({ ok: false });
    expect(validateDrinkInput(300, undefined)).toMatchObject({ ok: false });
  });
});
