import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { env } from '$env/dynamic/private';
import { createSessionToken, verifySessionToken } from './session';

// Mirrors session.ts's own signing (createHmac sha256 base64url) so tests can
// construct a validly-signed token with an arbitrary payload — sign() isn't
// exported, since nothing outside session.ts needs to produce a token from a
// hand-built payload. Signs with whatever secret session.ts itself reads
// (env.SESSION_SECRET) rather than process.env directly: under vitest,
// $env/dynamic/private resolves independently of ad-hoc process.env writes,
// so reading the same binding session.ts uses keeps this in sync with it.
function signPayload(payload: string, secret = env.SESSION_SECRET ?? ''): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

describe('createSessionToken / verifySessionToken', () => {
	it('round-trips a valid token', () => {
		const token = createSessionToken('RazerGhost');
		expect(verifySessionToken(token)).toEqual({ sub: 'RazerGhost' });
	});

	it('rejects a token with a tampered signature', () => {
		const token = createSessionToken('RazerGhost');
		const [payload, signature] = token.split('.');
		const tampered = `${payload}.${signature.slice(0, -1)}${signature.at(-1) === 'a' ? 'b' : 'a'}`;
		expect(verifySessionToken(tampered)).toBeNull();
	});

	it('rejects a token signed with a different secret', () => {
		const payload = Buffer.from(
			JSON.stringify({ sub: 'RazerGhost', exp: Date.now() + 10_000 })
		).toString('base64url');
		const token = `${payload}.${signPayload(payload, 'definitely-a-different-secret')}`;
		expect(verifySessionToken(token)).toBeNull();
	});

	it('rejects an expired token', () => {
		const payload = Buffer.from(
			JSON.stringify({ sub: 'RazerGhost', exp: Date.now() - 1000 })
		).toString('base64url');
		const token = `${payload}.${signPayload(payload)}`;
		expect(verifySessionToken(token)).toBeNull();
	});

	it.each([undefined, null, '', 'not-a-token', 'a.b.c', 'a.'])(
		'returns null for malformed input %p without throwing',
		(input) => {
			expect(() => verifySessionToken(input as string | undefined)).not.toThrow();
			expect(verifySessionToken(input as string | undefined)).toBeNull();
		}
	);
});
