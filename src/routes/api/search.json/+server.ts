import { json } from '@sveltejs/kit';
import { getAllDevlogEntries } from '$lib/server/devlog';
import type { RequestHandler } from './$types';

// Fuller index than the layout's commandPaletteEntries (title/slug only) —
// fetched lazily by the command palette on first open so every page load
// doesn't have to carry every post's stripped body text.
export const GET: RequestHandler = () => {
	const entries = getAllDevlogEntries().map(({ slug, title, excerpt, searchText }) => ({
		slug,
		title,
		excerpt,
		searchText
	}));

	return json(entries);
};
