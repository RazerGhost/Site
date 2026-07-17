import { error } from '@sveltejs/kit';
import { getDevlogEntry } from '$lib/server/devlog';
import { renderOgImage } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const entry = getDevlogEntry(params.slug);
	if (!entry) error(404, 'Devlog entry not found');

	const png = await renderOgImage({ title: entry.title, tags: entry.tags, eyebrow: 'Devlog' });

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
