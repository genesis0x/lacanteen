import { jwtVerify } from 'jose';

export async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return verified.payload;
  } catch (err) {
    throw new Error('Invalid token');
  }
}

export function getTokenFromHeader(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}