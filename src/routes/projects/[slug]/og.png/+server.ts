import { error } from '@sveltejs/kit';
import { getProject } from '$lib/server/projects';
import { renderOgImage } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, 'Project not found');

	const png = await renderOgImage({
		title: project.name,
		tags: project.tags,
		eyebrow: 'Project'
	});

	// @types/node types Buffer as Uint8Array<ArrayBufferLike>, which DOM's
	// BodyInit requires narrowed to ArrayBuffer — a type-only mismatch, not
	// a runtime one (Node's Response accepts Buffer directly).
	return new Response(png as BodyInit, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
