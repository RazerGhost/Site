import { env } from '$env/dynamic/private';

const REFRESH_MS = 60 * 60 * 1000;
const DEFAULT_QUERY = 'minimal dark abstract';

export interface UnsplashPhoto {
	url: string;
	photographerName: string;
	photographerProfileUrl: string;
	photoPageUrl: string;
}

// Cache is keyed by query too — changing the query (via the /newtab settings
// panel) invalidates immediately rather than waiting out the hourly TTL.
let cached: { photo: UnsplashPhoto; query: string; fetchedAt: number } | null = null;
let inflight: Promise<UnsplashPhoto | null> | null = null;

export function unsplashConfigured(): boolean {
	return Boolean(env.UNSPLASH_ACCESS_KEY);
}

export function defaultUnsplashQuery(): string {
	return DEFAULT_QUERY;
}

// Required by the Unsplash API guidelines: links back to Unsplash/the
// photographer must carry these params for attribution tracking.
function withUtm(url: string): string {
	const withParams = new URL(url);
	withParams.searchParams.set('utm_source', 'razerghost-newtab');
	withParams.searchParams.set('utm_medium', 'referral');
	return withParams.toString();
}

async function fetchRandomPhoto(query: string): Promise<UnsplashPhoto | null> {
	const res = await fetch(
		`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
		{ headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } }
	);
	if (!res.ok) return null;
	const body = await res.json();

	// API Terms §6: each time a photo is used as a background, its
	// download_location must be pinged. We cache the photo for an hour, so
	// this fires once per refresh cycle rather than once per page view.
	if (body.links?.download_location) {
		fetch(body.links.download_location, {
			headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` }
		}).catch(() => {});
	}

	return {
		url: withUtm(body.urls.regular),
		photographerName: body.user.name,
		photographerProfileUrl: withUtm(body.user.links.html),
		photoPageUrl: withUtm(body.links.html)
	};
}

export async function getBackgroundPhoto(query: string): Promise<UnsplashPhoto | null> {
	if (!unsplashConfigured()) return null;

	const now = Date.now();
	if (cached && cached.query === query && now - cached.fetchedAt < REFRESH_MS) return cached.photo;

	if (!inflight) {
		inflight = fetchRandomPhoto(query)
			.then((photo) => {
				if (photo) cached = { photo, query, fetchedAt: Date.now() };
				return photo;
			})
			.catch(() => null)
			.finally(() => {
				inflight = null;
			});
	}

	return (await inflight) ?? (cached?.query === query ? cached.photo : null);
}
