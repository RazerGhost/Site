import { error } from '@sveltejs/kit';
import { getAllProjects, getProject } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.slug);

	if (!project) {
		error(404, 'Project not found');
	}

	// getAllProjects() is sorted newest-first, so the entry immediately
	// before this one in the array is newer and the one after is older.
	const allProjects = getAllProjects();
	const index = allProjects.findIndex((p) => p.slug === params.slug);
	const newer = index > 0 ? allProjects[index - 1] : null;
	const older = index >= 0 && index < allProjects.length - 1 ? allProjects[index + 1] : null;

	const related = allProjects
		.filter((p) => p.slug !== params.slug)
		.map((p) => ({ project: p, shared: p.tags.filter((tag) => project.tags.includes(tag)).length }))
		.filter((p) => p.shared > 0)
		.sort((a, b) => b.shared - a.shared || (a.project.date > b.project.date ? -1 : 1))
		.slice(0, 3)
		.map((p) => p.project);

	return { project, older, newer, related };
};
