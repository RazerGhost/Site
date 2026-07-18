import { fail } from '@sveltejs/kit';
import {
	createLink,
	deleteLink,
	deleteNote,
	getNote,
	listLinks,
	listNotesForGraph,
	restoreRevision,
	undoDeleteNote,
	updateLinkLabel,
	updateNote,
	updateNotePosition
} from '$lib/server/notes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { notes: listNotesForGraph(), links: listLinks() };
};

function parseId(raw: FormDataEntryValue | null): number | null {
	const id = Number(raw);
	return Number.isInteger(id) ? id : null;
}

export const actions: Actions = {
	update: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		if (id === null) return fail(400, { error: 'Invalid note id' });

		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '');
		const tags = data.get('tags');
		const folder = data.get('folder');
		if (!title) return fail(400, { error: 'Title is required' });

		const note = updateNote(id, {
			title,
			body,
			tags: tags === null ? undefined : String(tags),
			folder: folder === null ? undefined : String(folder)
		});
		if (!note) return fail(404, { error: 'Note not found' });
		return { success: true, note };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		if (id === null) return fail(400, { error: 'Invalid note id' });
		deleteNote(id);
		return { success: true };
	},

	undoDelete: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		if (id === null) return fail(400, { error: 'Invalid note id' });
		const note = undoDeleteNote(id);
		if (!note) return fail(404, { error: 'Note not found' });
		return { success: true, note };
	},

	restoreRevision: async ({ request }) => {
		const data = await request.formData();
		const revisionId = parseId(data.get('revisionId'));
		if (revisionId === null) return fail(400, { error: 'Invalid revision id' });
		const note = restoreRevision(revisionId);
		if (!note) return fail(404, { error: 'Revision not found' });
		return { success: true, note };
	},

	move: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		const x = Number(data.get('x'));
		const y = Number(data.get('y'));
		if (id === null || !Number.isFinite(x) || !Number.isFinite(y)) {
			return fail(400, { error: 'Invalid position' });
		}
		updateNotePosition(id, x, y);
		return { success: true };
	},

	link: async ({ request }) => {
		const data = await request.formData();
		const a = parseId(data.get('a'));
		const b = parseId(data.get('b'));
		const label = String(data.get('label') ?? '').trim();
		const directed = data.get('directed') === '1';
		if (a === null || b === null || a === b) return fail(400, { error: 'Invalid link' });
		if (!getNote(a) || !getNote(b)) return fail(404, { error: 'Note not found' });
		const link = createLink(a, b, label || undefined, directed);
		return { success: true, link };
	},

	relabel: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		const label = String(data.get('label') ?? '');
		if (id === null) return fail(400, { error: 'Invalid link id' });
		updateLinkLabel(id, label);
		return { success: true };
	},

	unlink: async ({ request }) => {
		const data = await request.formData();
		const id = parseId(data.get('id'));
		if (id === null) return fail(400, { error: 'Invalid link id' });
		deleteLink(id);
		return { success: true };
	}
};
