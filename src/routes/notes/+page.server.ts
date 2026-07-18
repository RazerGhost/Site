import { deleteNote, listNotes } from '$lib/server/notes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { notes: listNotes() };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (Number.isInteger(id)) deleteNote(id);
		return { success: true };
	}
};
