import path from 'node:path';
import { error, fail, redirect } from '@sveltejs/kit';
import { getRawEntry, writeEntry, renameEntry, deleteEntry } from '$lib/server/content-editor';
import { slugifyHeading } from '$lib/server/content';
import { toDateString } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/devlog');

export const load: PageServerLoad = ({ params }) => {
	const entry = getRawEntry(CONTENT_DIR, params.slug);
	if (!entry) error(404, 'Post not found');

	return {
		slug: entry.slug,
		title: String(entry.meta.title ?? entry.slug),
		date: toDateString(entry.meta.date),
		tags: Array.isArray(entry.meta.tags) ? (entry.meta.tags as string[]).join(', ') : '',
		cover: entry.meta.cover ? String(entry.meta.cover) : '',
		excerpt: entry.meta.excerpt ? String(entry.meta.excerpt) : '',
		series: entry.meta.series ? String(entry.meta.series) : '',
		draft: entry.meta.draft === true,
		body: entry.body
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const date = String(data.get('date') ?? '').trim();
		const tags = String(data.get('tags') ?? '');
		const cover = String(data.get('cover') ?? '').trim();
		const excerpt = String(data.get('excerpt') ?? '').trim();
		const series = String(data.get('series') ?? '').trim();
		const draft = data.get('draft') === 'on';
		const body = String(data.get('body') ?? '');

		if (!title || !date) {
			return fail(400, { title, date, tags, cover, excerpt, series, draft, body, error: 'Title and date are required.' });
		}

		const newSlug = `${date}-${slugifyHeading(title)}`;
		if (newSlug !== params.slug) {
			try {
				renameEntry(CONTENT_DIR, params.slug, newSlug);
			} catch (e) {
				return fail(400, { title, date, tags, cover, excerpt, series, draft, body, error: (e as Error).message });
			}
		}

		writeEntry(
			CONTENT_DIR,
			newSlug,
			{
				title,
				date,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				...(cover ? { cover } : {}),
				...(excerpt ? { excerpt } : {}),
				...(series ? { series } : {}),
				draft
			},
			body
		);

		redirect(303, `/notes/devlog/${newSlug}`);
	},

	delete: async ({ params }) => {
		deleteEntry(CONTENT_DIR, params.slug);
		redirect(303, '/notes/devlog');
	}
};
