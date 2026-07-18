import { json } from '@sveltejs/kit';
import { getArtistTopTracks } from '$lib/server/spotify-history';
import type { RequestHandler } from './$types';

// Drill-down for the Top Artists list — an artist row expands to this.
export const GET: RequestHandler = ({ url }) => {
	const artist = url.searchParams.get('artist');
	if (!artist) return json({ tracks: [] });
	return json({ tracks: getArtistTopTracks(artist) });
};
