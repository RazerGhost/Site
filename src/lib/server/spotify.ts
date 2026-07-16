import { env } from '$env/dynamic/private';

// In-memory access-token cache (per server process). Avoids hitting
// Spotify's token endpoint on every poll from every visitor — refreshed
// lazily once it's within 60s of expiring. Shared by every route that
// talks to the Spotify API so they don't each keep their own cache.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export function spotifyConfigured(): boolean {
	return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REFRESH_TOKEN);
}

export async function getSpotifyAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
		return cachedToken.accessToken;
	}

	const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString(
		'base64'
	);

	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${basic}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: env.SPOTIFY_REFRESH_TOKEN ?? ''
		})
	});

	if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);

	const data = await res.json();
	cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
	return cachedToken.accessToken;
}
