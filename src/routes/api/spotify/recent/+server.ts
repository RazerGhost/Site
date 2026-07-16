import { json } from '@sveltejs/kit';
import { getSpotifyAccessToken, spotifyConfigured } from '$lib/server/spotify';
import type { RequestHandler } from './$types';

// Requires the `user-read-recently-played` scope on top of
// `user-read-currently-playing` — a refresh token minted before that scope
// was requested won't have it. Rather than error, this degrades to
// `{ available: false }` so the widget just hides the history section.
export const GET: RequestHandler = async () => {
	if (!spotifyConfigured()) {
		return json({ available: false, items: [] });
	}

	try {
		const accessToken = await getSpotifyAccessToken();
		const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (res.status === 403) {
			return json({ available: false, items: [], reason: 'missing_scope' });
		}
		if (!res.ok) {
			return json({ available: false, items: [] });
		}

		const data = await res.json();
		const items = (data.items ?? []).map(
			(entry: {
				track: {
					name: string;
					artists: { name: string }[];
					external_urls?: { spotify?: string };
					album?: { images?: { url: string }[] };
				};
				played_at: string;
			}) => ({
				track: entry.track.name,
				artist: entry.track.artists?.map((a) => a.name).join(', '),
				url: entry.track.external_urls?.spotify,
				albumArt: entry.track.album?.images?.[2]?.url ?? entry.track.album?.images?.[0]?.url,
				playedAt: entry.played_at
			})
		);

		return json({ available: true, items });
	} catch {
		return json({ available: false, items: [] });
	}
};
