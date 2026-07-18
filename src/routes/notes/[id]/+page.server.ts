import { error, fail, redirect } from '@sveltejs/kit';
import { deleteNote, getNote, updateNote } from '$lib/server/notes';
import type { Actions, PageServerLoad } from './$types';

function parseId(raw: string): number {
	const id = Number(raw);
	if (!Number.isInteger(id)) error(404, 'Note not found');
	return id;
}

export const load: PageServerLoad = ({ params }) => {
	const note = getNote(parseId(params.id));
	if (!note) error(404, 'Note not found');
	return { note };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const id = parseId(params.id);
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!title || !body) {
			return fail(400, { title, body, error: 'Title and body are required.' });
		}

		const note = updateNote(id, { title, body });
		if (!note) error(404, 'Note not found');
		return { success: true, note };
	},
	delete: ({ params }) => {
		deleteNote(parseId(params.id));
		redirect(303, '/notes');
	}
};
