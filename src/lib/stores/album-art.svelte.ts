// Album art isn't in our own DB (only track/artist/album text is) — fetched
// lazily per Spotify track URI from Spotify's public oEmbed endpoint (no auth
// needed). Shared across every card/list on /listens that shows tracks,
// artists, or albums, so a URI already looked up anywhere on the page is
// instant everywhere else. Any track on an album returns that album's cover
// via oEmbed, so a representative track URI works fine for artist/album art too.
const cache = $state<Record<string, string | null>>({});

// Plain (non-reactive) dedupe set — deliberately NOT part of `cache`.
// albumArt() is called from template expressions (`{@const art =
// albumArt(...)}`), and writing to $state synchronously inside a template
// expression throws Svelte's state_unsafe_mutation error, which unmounts the
// whole page. Tracking "already requested" outside of $state lets the lookup
// stay synchronous while every write to `cache` happens later, inside an
// async continuation (i.e. outside the render call stack).
const requested = new Set<string>();

export function albumArt(uri: string | null | undefined): string | null {
	if (!uri) return null;
	if (!requested.has(uri)) {
		requested.add(uri);
		enqueueFetch(uri);
	}
	return cache[uri] ?? null;
}

// A full /listens load can ask for ~20+ URIs at once (top artists/tracks/
// albums/skipped, each up to 5) — firing all of those as simultaneous
// requests risks Spotify's oEmbed endpoint rate-limiting the burst, which
// would silently blank out art across the whole page. A small worker pool
// spreads them out instead.
const MAX_CONCURRENT = 4;
const queue: string[] = [];
let active = 0;

function enqueueFetch(uri: string): void {
	queue.push(uri);
	pump();
}

function pump(): void {
	while (active < MAX_CONCURRENT && queue.length > 0) {
		const uri = queue.shift()!;
		active++;
		fetchArt(uri).finally(() => {
			active--;
			pump();
		});
	}
}

async function fetchArt(uri: string): Promise<void> {
	try {
		const trackId = uri.split(':').pop();
		const res = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`);
		if (!res.ok) return;
		const body = await res.json();
		if (body.thumbnail_url) cache[uri] = body.thumbnail_url;
	} catch {
		// Art is a nice-to-have — callers still render fine without it.
	}
}
