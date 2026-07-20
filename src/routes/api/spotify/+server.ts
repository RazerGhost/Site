import { json } from '@sveltejs/kit';
import { getCurrentlyPlaying, spotifyConfigured } from '$lib/server/spotify';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	if (!spotifyConfigured()) {
		return json({ configured: false, playing: false });
	}

	try {
		const current = await getCurrentlyPlaying();
		return json({ configured: true, fetchedAt: Date.now(), ...current });
	} catch {
		return json({ configured: true, playing: false, error: true });
	}
};
