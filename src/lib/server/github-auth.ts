import { env } from '$env/dynamic/private';

export function githubAuthConfigured(): boolean {
	return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.SESSION_SECRET);
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
	const params = new URLSearchParams({
		client_id: env.GITHUB_CLIENT_ID ?? '',
		redirect_uri: redirectUri,
		scope: 'read:user',
		state
	});
	return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
	const res = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: env.GITHUB_CLIENT_ID ?? '',
			client_secret: env.GITHUB_CLIENT_SECRET ?? '',
			code,
			redirect_uri: redirectUri
		}),
		signal: AbortSignal.timeout(10_000)
	});

	if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);

	const data = await res.json();
	if (!data.access_token) throw new Error(`GitHub token exchange failed: ${JSON.stringify(data)}`);
	return data.access_token;
}

export async function fetchGithubUser(accessToken: string): Promise<{ id: number; login: string }> {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			// GitHub's API rejects unauthenticated-looking requests without one.
			'User-Agent': 'ghostbase'
		},
		signal: AbortSignal.timeout(10_000)
	});

	if (!res.ok) throw new Error(`GitHub user fetch failed: ${res.status}`);

	const data = await res.json();
	if (typeof data.id !== 'number' || typeof data.login !== 'string') {
		throw new Error('GitHub user fetch: missing id/login');
	}
	return { id: data.id, login: data.login };
}
