import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export const SESSION_COOKIE_NAME = 'rg_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = { sub: string; exp: number };

// Refuses to sign with a missing secret rather than falling back to '' —
// an empty HMAC key is publicly known, so every token minted or accepted
// with it would be forgeable.
function sign(payload: string): string {
	if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
	return createHmac('sha256', env.SESSION_SECRET).update(payload).digest('base64url');
}

export function createSessionToken(username: string): string {
	const payload = Buffer.from(
		JSON.stringify({ sub: username, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 })
	).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): { sub: string } | null {
	if (!token || !env.SESSION_SECRET) return null;

	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [payload, signature] = parts;

	const expected = sign(payload);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

	let decoded: SessionPayload;
	try {
		decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
	} catch {
		return null;
	}

	if (typeof decoded.sub !== 'string' || typeof decoded.exp !== 'number') return null;
	if (decoded.exp <= Date.now()) return null;

	return { sub: decoded.sub };
}
