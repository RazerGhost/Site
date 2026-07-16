import { json } from '@sveltejs/kit';
import { getSpotifyAccessToken, spotifyConfigured } from '$lib/server/spotify';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	if (!spotifyConfigured()) {
		return json({ configured: false, playing: false });
	}

	try {
		const accessToken = await getSpotifyAccessToken();
		const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (res.status === 204 || !res.ok) {
			return json({ configured: true, playing: false });
		}

		const data = await res.json();
		if (!data?.item) {
			return json({ configured: true, playing: false });
		}

		return json({
			configured: true,
			playing: Boolean(data.is_playing),
			track: data.item.name,
			artist: data.item.artists?.map((a: { name: string }) => a.name).join(', '),
			url: data.item.external_urls?.spotify,
			albumArt: data.item.album?.images?.[2]?.url ?? data.item.album?.images?.[0]?.url,
			progressMs: data.progress_ms ?? 0,
			durationMs: data.item.duration_ms ?? 0,
			fetchedAt: Date.now()
		});
	} catch {
		return json({ configured: true, playing: false, error: true });
	}
};
