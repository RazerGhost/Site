import { getStatus } from '$lib/server/status-db';
import { getBackgroundPhoto, defaultUnsplashQuery, unsplashConfigured } from '$lib/server/unsplash';
import {
	getNewtabSettings,
	setNewtabUnsplashQuery,
	getQuickLinks,
	addQuickLink,
	removeQuickLink,
	incrementQuickLinkClicks,
	listPhotoHistory,
	pickRandomPhotoHistory,
	toggleFavoritePhoto,
	getFocusStats,
	logFocusSession,
	getRecentSearches,
	logSearch
} from '$lib/server/newtab-settings';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { createNote, listNotes } from '$lib/server/notes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const status = getStatus();
	const settings = getNewtabSettings();
	const unsplashQuery = settings.unsplashQuery || defaultUnsplashQuery();
	const photo = await getBackgroundPhoto(unsplashQuery);
	const quickLinks = getQuickLinks();

	let watching: Awaited<ReturnType<typeof getLibraryWithFallback>>['library']['watching'] = [];
	if (simklConfigured()) {
		try {
			const { library } = await getLibraryWithFallback();
			watching = library.watching.slice(0, 3);
		} catch {
			watching = [];
		}
	}

	return {
		statusItems: status.items,
		photo,
		unsplashQuery,
		unsplashConfigured: unsplashConfigured(),
		quickLinks,
		watching,
		photoHistory: listPhotoHistory(),
		focusStats: getFocusStats(),
		recentSearches: getRecentSearches(),
		recentNotes: listNotes().slice(0, 3)
	};
};

export const actions: Actions = {
	updateBackground: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '').trim();
		setNewtabUnsplashQuery(query || null);
		return { success: true };
	},

	cyclePhoto: async ({ request }) => {
		const data = await request.formData();
		const currentUrl = String(data.get('currentUrl') ?? '');
		const picked = pickRandomPhotoHistory(currentUrl);
		return { success: Boolean(picked), photo: picked };
	},

	favoritePhoto: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return { success: false };
		toggleFavoritePhoto(id);
		return { success: true };
	},

	addQuickLink: async ({ request }) => {
		const data = await request.formData();
		const label = String(data.get('label') ?? '').trim();
		let url = String(data.get('url') ?? '').trim();
		if (!label || !url) return { success: false };
		if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
		addQuickLink(label, url);
		return { success: true };
	},

	removeQuickLink: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return { success: false };
		removeQuickLink(id);
		return { success: true };
	},

	clickQuickLink: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return { success: false };
		incrementQuickLinkClicks(id);
		return { success: true };
	},

	logSearch: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '');
		logSearch(query);
		return { success: true };
	},

	logFocusSession: async ({ request }) => {
		const data = await request.formData();
		const kind = String(data.get('kind') ?? '') === 'break' ? 'break' : 'focus';
		const completed = String(data.get('completed') ?? '') === 'true';
		const startedAt = String(data.get('startedAt') ?? '');
		const endedAt = String(data.get('endedAt') ?? '');
		if (!startedAt || !endedAt) return { success: false };
		logFocusSession(kind, completed, startedAt, endedAt);
		return { success: true };
	},

	quickNote: async ({ request }) => {
		const data = await request.formData();
		const body = String(data.get('body') ?? '').trim();
		if (!body) return { success: false };
		const title = body.split('\n')[0].slice(0, 80) || 'Quick note';
		createNote({ title, body, folder: '', tags: 'quick-capture' });
		return { success: true };
	}
};
