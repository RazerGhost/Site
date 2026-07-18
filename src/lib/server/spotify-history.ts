import { insertPlays, getListeningStats } from './spotify-history-db';
import type { PlayRecord } from './spotify-history-db';

export type { ListeningStats } from './spotify-history-db';
export { getListeningStats };

// Spotify's "Extended streaming history" export (requested from
// https://support.spotify.com/us/article/understanding-your-data/) ships as
// several JSON files. Field names have shifted over the export format's
// lifetime, so both are accepted:
//   - current: ts, ms_played, master_metadata_track_name,
//     master_metadata_album_artist_name, master_metadata_album_album_name,
//     spotify_track_uri
//   - older ("endsong_N.json"): endTime, msPlayed, trackName, artistName
// Podcast episodes (no track/artist metadata) and zero-length entries are
// skipped — this page is about music listening, same scope as Watchlist
// being TV/movies/anime rather than every Simkl media type.
function parseEntries(raw: unknown): PlayRecord[] {
	if (!Array.isArray(raw)) return [];

	const records: PlayRecord[] = [];
	for (const entry of raw) {
		if (!entry || typeof entry !== 'object') continue;
		const e = entry as Record<string, unknown>;

		const playedAtRaw = (e.ts ?? e.endTime) as string | undefined;
		const msPlayed = (e.ms_played ?? e.msPlayed) as number | undefined;
		const track = (e.master_metadata_track_name ?? e.trackName) as string | null | undefined;
		const artist = (e.master_metadata_album_artist_name ?? e.artistName) as string | null | undefined;

		if (!playedAtRaw || !track || !artist || !msPlayed || msPlayed <= 0) continue;

		const playedAt = new Date(playedAtRaw);
		if (Number.isNaN(playedAt.getTime())) continue;

		records.push({
			playedAt: playedAt.toISOString(),
			msPlayed,
			track,
			artist,
			album: (e.master_metadata_album_album_name as string | null | undefined) ?? null,
			spotifyUri: (e.spotify_track_uri as string | null | undefined) ?? null,
			platform: (e.platform as string | undefined) ?? null,
			shuffle: typeof e.shuffle === 'boolean' ? e.shuffle : null,
			skipped: typeof e.skipped === 'boolean' ? e.skipped : null
		});
	}
	return records;
}

export type ImportResult = { parsed: number; inserted: number; error: string | null };

export function importExtendedHistoryFile(rawText: string): ImportResult {
	let json: unknown;
	try {
		json = JSON.parse(rawText);
	} catch {
		return { parsed: 0, inserted: 0, error: 'Not valid JSON.' };
	}

	const records = parseEntries(json);
	if (records.length === 0) {
		return { parsed: 0, inserted: 0, error: 'No music plays found in this file.' };
	}

	const { inserted } = insertPlays(records);
	return { parsed: records.length, inserted, error: null };
}
