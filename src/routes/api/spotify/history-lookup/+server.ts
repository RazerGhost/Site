import { json } from '@sveltejs/kit';
import { getTrackHistory } from '$lib/server/spotify-history';
import type { RequestHandler } from './$types';

// Cross-references the currently-playing track (by Spotify URI) against the
// imported listening history — powers "you've played this N times" on the
// Listening page's now-playing card.
export const GET: RequestHandler = ({ url }) => {
	const uri = url.searchParams.get('uri');
	if (!uri) return json({ found: false });

	const history = getTrackHistory(uri);
	if (!history) return json({ found: false });

	return json({ found: true, ...history });
};
