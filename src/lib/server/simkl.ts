import { env } from '$env/dynamic/private';

const APP_NAME = 'razerghost-site';
const APP_VERSION = '1.0';

export type LibraryItem = {
	title: string;
	posterUrl: string | null;
	href: string;
	watchedEpisodes: number;
	totalEpisodes: number | null;
};

export type Library = {
	watching: LibraryItem[];
	completed: LibraryItem[];
	planToWatch: LibraryItem[];
};

export function simklConfigured(): boolean {
	return Boolean(env.SIMKL_CLIENT_ID && env.SIMKL_ACCESS_TOKEN);
}

// Composes a full poster image URL from the path fragment the API returns
// (e.g. "16/16913426086fc13") — see https://api.simkl.org/conventions/images.
// "_c" (170x250) matches a compact card in a grid.
function posterUrl(path: string | null | undefined): string | null {
	if (!path) return null;
	return `https://wsrv.nl/?url=https://simkl.in/posters/${path}_c.webp&q=90`;
}

const SIMKL_PATH = { shows: 'tv', anime: 'anime', movies: 'movies' } as const;
type SimklType = keyof typeof SIMKL_PATH;

type AllItemsEntry = {
	status: string;
	watched_episodes_count: number;
	total_episodes_count: number;
	// Mutually exclusive: shows/anime nest under `show`, movies under `movie`.
	show?: { title: string; poster?: string | null; ids: { slug: string } };
	movie?: { title: string; poster?: string | null; ids: { slug: string } };
};

async function fetchAll(type: SimklType): Promise<{ status: string; item: LibraryItem }[]> {
	const params = new URLSearchParams({
		client_id: env.SIMKL_CLIENT_ID ?? '',
		'app-name': APP_NAME,
		'app-version': APP_VERSION
	});

	// status=all returns every bucket (watching/completed/plantowatch/hold/dropped)
	// in one call — cheaper than one request per bucket we care about.
	const res = await fetch(`https://api.simkl.com/sync/all-items/${type}/all?${params}`, {
		headers: {
			Authorization: `Bearer ${env.SIMKL_ACCESS_TOKEN}`,
			'User-Agent': `${APP_NAME}/${APP_VERSION}`
		}
	});

	if (!res.ok) throw new Error(`Simkl ${type} fetch failed: ${res.status}`);

	const data = await res.json();
	const entries: AllItemsEntry[] = data[type] ?? [];

	return entries.map((entry) => {
		const media = entry.show ?? entry.movie;
		if (!media) throw new Error(`Simkl ${type} entry missing both show and movie`);
		return {
			status: entry.status,
			item: {
				title: media.title,
				posterUrl: posterUrl(media.poster),
				href: `https://simkl.com/${SIMKL_PATH[type]}/${media.ids.slug}`,
				watchedEpisodes: entry.watched_episodes_count,
				// 0 on movies (not a meaningful episode count) — treat as absent.
				totalEpisodes: entry.total_episodes_count || null
			}
		};
	});
}

// Korean dramas and movies mostly live under "shows"/"movies" on Simkl (see
// simkl.com/tv/korean-drama), not "anime" — but querying all three buckets
// means the page still works if any title happens to be filed as anime.
export async function getLibrary(): Promise<Library> {
	const results = await Promise.all([fetchAll('shows'), fetchAll('anime'), fetchAll('movies')]);
	const all = results.flat();

	return {
		watching: all.filter((e) => e.status === 'watching').map((e) => e.item),
		completed: all.filter((e) => e.status === 'completed').map((e) => e.item),
		planToWatch: all.filter((e) => e.status === 'plantowatch').map((e) => e.item)
	};
}
