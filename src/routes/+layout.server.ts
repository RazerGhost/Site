import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		// Lightweight index for the Cmd+K command palette — every page loads
		// this, so keep it to just what the palette needs to search/link to,
		// not full post/project bodies.
		commandPaletteEntries: [
			...getAllDevlogEntries().map((entry) => ({
				slug: entry.slug,
				title: entry.title,
				kind: 'devlog' as const
			})),
			...getAllProjects().map((project) => ({
				slug: project.slug,
				title: project.name,
				kind: 'project' as const
			}))
		]
	};
};
