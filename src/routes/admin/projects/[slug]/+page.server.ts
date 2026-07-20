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
		stack: Array.isArray(entry.meta.stack) ? (entry.meta.stack as string[]).join(', ') : '',
		images: Array.isArray(entry.meta.images) ? (entry.meta.images as string[]).join(', ') : '',
		status: entry.meta.status === 'paused' || entry.meta.status === 'archived' ? entry.meta.status : 'active',
		featured: entry.meta.featured === true,
		draft: entry.meta.draft === true,
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

		try {
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
		} catch (e) {
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
				error: (e as Error).message
			});
		}

		redirect(303, `/admin/projects/${params.slug}`);
	},

	delete: async ({ params }) => {
		deleteEntry(CONTENT_DIR, params.slug);
		redirect(303, '/admin/projects');
	}
};
