import path from 'node:path';
import { error, fail, redirect } from '@sveltejs/kit';
import { getRawEntry, writeEntry, deleteEntry } from '$lib/server/content-editor';
import { toDateString } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export const load: PageServerLoad = ({ params }) => {
	const entry = getRawEntry(CONTENT_DIR, params.slug);
	if (!entry) error(404, 'Project not found');

	return {
		slug: entry.slug,
		name: String(entry.meta.name ?? entry.slug),
		description: entry.meta.description ? String(entry.meta.description) : '',
		href: entry.meta.href ? String(entry.meta.href) : '',
		live: entry.meta.live ? String(entry.meta.live) : '',
		cover: entry.meta.cover ? String(entry.meta.cover) : '',
		tags: Array.isArray(entry.meta.tags) ? (entry.meta.tags as string[]).join(', ') : '',
		date: toDateString(entry.meta.date),
		body: entry.body
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const date = String(data.get('date') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const href = String(data.get('href') ?? '').trim();
		const live = String(data.get('live') ?? '').trim();
		const cover = String(data.get('cover') ?? '').trim();
		const tags = String(data.get('tags') ?? '');
		const body = String(data.get('body') ?? '');

		if (!name || !date) {
			return fail(400, { name, date, description, href, live, cover, tags, body, error: 'Name and date are required.' });
		}

		writeEntry(
			CONTENT_DIR,
			params.slug,
			{
				name,
				description,
				...(href ? { href } : {}),
				...(live ? { live } : {}),
				...(cover ? { cover } : {}),
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				date
			},
			body
		);

		redirect(303, `/notes/projects/${params.slug}`);
	},

	delete: async ({ params }) => {
		deleteEntry(CONTENT_DIR, params.slug);
		redirect(303, '/notes/projects');
	}
};
