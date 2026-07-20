import path from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import { listRawEntries, deleteEntry } from '$lib/server/content-editor';
import { toDateString } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export const load: PageServerLoad = () => {
	const entries = listRawEntries(CONTENT_DIR)
		.map((e) => ({
			slug: e.slug,
			name: String(e.meta.name ?? e.slug),
			date: toDateString(e.meta.date),
			draft: e.meta.draft === true
		}))
		.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : a.slug.localeCompare(b.slug)));

	return { entries };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const slug = String(data.get('slug') ?? '');
		if (!slug) return fail(400, { error: 'Missing slug' });
		deleteEntry(CONTENT_DIR, slug);
		redirect(303, '/admin/projects');
	}
};
