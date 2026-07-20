import { fail, redirect } from '@sveltejs/kit';
import { getStatus, setStatus } from '$lib/server/status-db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return getStatus();
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const updated = String(data.get('updated') ?? '').trim();
		const itemsRaw = String(data.get('items') ?? '');
		const items = itemsRaw
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		if (!updated || items.length === 0) {
			return fail(400, { updated, items: itemsRaw, error: 'Updated date and at least one item are required.' });
		}

		setStatus(updated, items);
		redirect(303, '/admin/status');
	}
};
