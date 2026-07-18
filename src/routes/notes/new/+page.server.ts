import { fail, redirect } from '@sveltejs/kit';
import { createNote } from '$lib/server/notes';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!title || !body) {
			return fail(400, { title, body, error: 'Title and body are required.' });
		}

		const note = createNote({ title, body });
		redirect(303, `/notes/${note.id}`);
	}
};
