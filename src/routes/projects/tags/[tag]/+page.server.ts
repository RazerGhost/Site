import { getAllProjects } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const allProjects = getAllProjects();

	return {
		tag: params.tag,
		projects: allProjects.filter((p) => p.tags.includes(params.tag)),
		allTags: [...new Set(allProjects.flatMap((p) => p.tags))].sort()
	};
};
