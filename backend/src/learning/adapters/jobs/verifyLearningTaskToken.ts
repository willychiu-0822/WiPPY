import { OAuth2Client } from 'google-auth-library';

export async function verifyLearningTaskToken(input: {
  authorizationHeader: string | undefined;
  audience: string;
  client?: Pick<OAuth2Client, 'verifyIdToken'>;
}): Promise<boolean> {
  const header = input.authorizationHeader;
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length);
  const client = input.client ?? new OAuth2Client();
  try {
    await client.verifyIdToken({ idToken: token, audience: input.audience });
    return true;
  } catch {
    return false;
  }
}
