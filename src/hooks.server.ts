import { error, redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, verifySessionToken } from '$lib/server/session';
import { startSimklRefreshLoop } from '$lib/server/simkl-refresh';

startSimklRefreshLoop();

// Auth is enforced here, not (only) in +layout.server.ts loads: form actions
// run *before* layout load functions, so a layout redirect alone would let an
// unauthenticated POST hit an action's side effects first. The per-endpoint
// locals.user checks in +server.ts files stay as defense in depth.
const PROTECTED_PREFIXES = ['/notes', '/admin', '/spotify-import', '/api/notes', '/newtab'];

function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const handle: Handle = ({ event, resolve }) => {
	const session = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));
	if (session) {
		event.locals.user = { username: session.sub };
	}

	if (!event.locals.user && isProtectedPath(event.url.pathname)) {
		// Only unauthenticated *page* GETs get bounced to the login flow; API
		// paths and side-effectful methods (form actions, API writes) get a
		// plain 401 — redirecting those into an OAuth dance helps nobody.
		const isPageGet =
			!event.url.pathname.startsWith('/api/') &&
			(event.request.method === 'GET' || event.request.method === 'HEAD');
		if (!isPageGet) error(401, 'Unauthorized');
		redirect(303, `/auth/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
};
