import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, verifySessionToken } from '$lib/server/session';

export const handle: Handle = ({ event, resolve }) => {
	const session = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));
	if (session) {
		event.locals.user = { username: session.sub };
	}
	return resolve(event);
};
