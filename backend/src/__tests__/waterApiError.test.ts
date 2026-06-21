import { toWaterApiErrorResponse } from '../routes/api/water';

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
