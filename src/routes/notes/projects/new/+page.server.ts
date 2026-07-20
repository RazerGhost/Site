import path from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import { writeEntry } from '$lib/server/content-editor';
import { slugifyHeading } from '$lib/server/content';
import type { Actions } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const date = String(data.get('date') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const href = String(data.get('href') ?? '').trim();
		const live = String(data.get('live') ?? '').trim();
		const cover = String(data.get('cover') ?? '').trim();
		const tags = String(data.get('tags') ?? '');
		const stack = String(data.get('stack') ?? '');
		const images = String(data.get('images') ?? '');
		const status = String(data.get('status') ?? 'active');
		const featured = data.get('featured') === 'on';
		const draft = data.get('draft') === 'on';
		const body = String(data.get('body') ?? '');

		if (!name || !date) {
			return fail(400, {
				name,
				date,
				description,
				href,
				live,
				cover,
				tags,
				stack,
				images,
				status,
				featured,
				draft,
				body,
				error: 'Name and date are required.'
			});
		}

		const slug = slugifyHeading(name);

		writeEntry(
			CONTENT_DIR,
			slug,
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
				stack: stack
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				images: images
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				status,
				featured,
				draft,
				date
			},
			body
		);

		redirect(303, `/notes/projects/${slug}`);
	}
};
