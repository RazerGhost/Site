import { env } from '$env/dynamic/private';

// In-memory access-token cache (per server process). Avoids hitting
// Spotify's token endpoint on every poll from every visitor — refreshed
// lazily once it's within 60s of expiring. Shared by every route that
// talks to the Spotify API so they don't each keep their own cache.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// Single-flight guard: when the cache is cold, several concurrent requests
// (widget poll + recent + scrobble) would otherwise each hit the token
// endpoint at once — share one in-flight refresh instead.
let refreshInFlight: Promise<string> | null = null;

export function spotifyConfigured(): boolean {
	return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REFRESH_TOKEN);
}

async function refreshAccessToken(): Promise<string> {
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
		}),
		signal: AbortSignal.timeout(10_000)
	});

	if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);

	const data = await res.json();
	if (typeof data.access_token !== 'string' || typeof data.expires_in !== 'number') {
		throw new Error('Spotify token refresh: malformed response');
	}

	cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
	return cachedToken.accessToken;
}

export async function getSpotifyAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
		return cachedToken.accessToken;
	}

	if (!refreshInFlight) {
		refreshInFlight = refreshAccessToken().finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
}

export interface CurrentlyPlaying {
	playing: boolean;
	track?: string;
	artist?: string;
	url?: string;
	albumArt?: string;
	progressMs?: number;
	durationMs?: number;
}

// Shared by the /api/spotify polling route (floating widget) and the
// homepage server load — one fetch/parse implementation for both.
export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying> {
	const accessToken = await getSpotifyAccessToken();
	const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
		headers: { Authorization: `Bearer ${accessToken}` },
		signal: AbortSignal.timeout(10_000)
	});

	if (res.status === 204 || !res.ok) {
		return { playing: false };
	}

	const data = await res.json();
	if (!data?.item) {
		return { playing: false };
	}

	return {
		playing: Boolean(data.is_playing),
		track: data.item.name,
		artist: data.item.artists?.map((a: { name: string }) => a.name).join(', '),
		url: data.item.external_urls?.spotify,
		albumArt: data.item.album?.images?.[2]?.url ?? data.item.album?.images?.[0]?.url,
		progressMs: data.progress_ms ?? 0,
		durationMs: data.item.duration_ms ?? 0
	};
}
