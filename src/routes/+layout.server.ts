import { getAllDevlogEntries } from '$lib/server/devlog';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		// Lightweight index for the Cmd+K command palette — every page loads
		// this, so keep it to just what the palette needs to search/link to,
		// not full post bodies.
		commandPaletteEntries: getAllDevlogEntries().map((entry) => ({
			slug: entry.slug,
			title: entry.title
		}))
	};
};
