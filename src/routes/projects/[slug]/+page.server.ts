import { error } from '@sveltejs/kit';
import { getProject } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.slug);

	if (!project) {
		error(404, 'Project not found');
	}

	return { project };
};
