import path from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import { writeEntry } from '$lib/server/content-editor';
import { slugifyHeading } from '$lib/server/content';
import type { Actions } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/devlog');

export const actions: Actions = {
	default: async ({ request }) => {
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
		// The date is embedded in the filename slug — anything but YYYY-MM-DD
		// would make writeEntry's slug validation throw a 500 instead of this.
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return fail(400, { title, date, tags, cover, excerpt, series, draft, body, error: 'Date must be YYYY-MM-DD.' });
		}

		const slug = `${date}-${slugifyHeading(title)}`;

		writeEntry(
			CONTENT_DIR,
			slug,
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

		redirect(303, `/notes/devlog/${slug}`);
	}
};
