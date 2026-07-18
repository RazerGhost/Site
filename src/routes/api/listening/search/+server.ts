import { json } from '@sveltejs/kit';
import { searchPlays } from '$lib/server/spotify-history';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) return json({ results: [] });
	return json({ results: searchPlays(q) });
};
