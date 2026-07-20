import { importRecords } from './spotify-history-db';
import type { PlayRecord } from './spotify-history-db';

export type {
	ListeningStats,
	TrackHistory,
	SearchResult,
	TopAlbum,
	SkipShuffleStats,
	MonthlyTrendPoint,
	Discovery
} from './spotify-history-db';
export {
	getListeningStats,
	getAvailableYears,
	getHeatmap,
	getHourlyBreakdown,
	getTrackHistory,
	searchPlays,
	getArtistTopTracks,
	getOnThisDay,
	getTopAlbums,
	getSkipShuffleStats,
	getMonthlyTrend,
	getDiscoveries,
	getActiveDates
} from './spotify-history-db';

// Spotify's "Extended streaming history" export (requested from
// https://support.spotify.com/us/article/understanding-your-data/) ships as
// several JSON files. Field names have shifted over the export format's
// lifetime, so both are accepted:
//   - current: ts, ms_played, master_metadata_track_name,
//     master_metadata_album_artist_name, master_metadata_album_album_name,
//     spotify_track_uri
//   - older ("endsong_N.json"): endTime, msPlayed, trackName, artistName
// Podcast episodes (no track/artist metadata) are skipped — this page is
// about music listening, same scope as Watchlist being TV/movies/anime
// rather than every Simkl media type. Plays under MIN_MS_PLAYED are also
// dropped, matching stats.fm's behavior of not counting accidental
// taps/scroll-skips as real listens.
const MIN_MS_PLAYED = 3000;

function parseEntries(raw: unknown): PlayRecord[] {
	if (!Array.isArray(raw)) return [];

	const records: PlayRecord[] = [];
	for (const entry of raw) {
		if (!entry || typeof entry !== 'object') continue;
		const e = entry as Record<string, unknown>;

		// Real typeof checks, not just casts — a malformed entry (e.g. a string
		// ms_played) would otherwise slip through truthiness and get coerced
		// into the INTEGER column by SQLite.
		const playedAtRaw = e.ts ?? e.endTime;
		const msPlayed = e.ms_played ?? e.msPlayed;
		const track = e.master_metadata_track_name ?? e.trackName;
		const artist = e.master_metadata_album_artist_name ?? e.artistName;

		if (typeof playedAtRaw !== 'string' || !playedAtRaw) continue;
		if (typeof msPlayed !== 'number' || msPlayed < MIN_MS_PLAYED) continue;
		if (typeof track !== 'string' || !track) continue;
		if (typeof artist !== 'string' || !artist) continue;

		const playedAt = new Date(playedAtRaw);
		if (Number.isNaN(playedAt.getTime())) continue;

		records.push({
			playedAt: playedAt.toISOString(),
			msPlayed,
			track,
			artist,
			album: typeof e.master_metadata_album_album_name === 'string' ? e.master_metadata_album_album_name : null,
			spotifyUri: typeof e.spotify_track_uri === 'string' ? e.spotify_track_uri : null,
			platform: typeof e.platform === 'string' ? e.platform : null,
			shuffle: typeof e.shuffle === 'boolean' ? e.shuffle : null,
			skipped: typeof e.skipped === 'boolean' ? e.skipped : null
		});
	}
	return records;
}

export type ImportResult = {
	parsed: number;
	inserted: number;
	replacedScrobbles: number;
	error: string | null;
};

export function importExtendedHistoryFile(rawText: string): ImportResult {
	let json: unknown;
	try {
		json = JSON.parse(rawText);
	} catch {
		return { parsed: 0, inserted: 0, replacedScrobbles: 0, error: 'Not valid JSON.' };
	}

	const records = parseEntries(json);
	if (records.length === 0) {
		return { parsed: 0, inserted: 0, replacedScrobbles: 0, error: 'No music plays found in this file.' };
	}

	// Clear out any live-scrobbled rows (estimated ms_played) this file's date
	// range now supersedes with real data, then insert — one transaction via
	// importRecords, see deleteScrobbledRange's docstring for the ordering.
	let minPlayedAt = records[0].playedAt;
	let maxPlayedAt = records[0].playedAt;
	for (const r of records) {
		if (r.playedAt < minPlayedAt) minPlayedAt = r.playedAt;
		if (r.playedAt > maxPlayedAt) maxPlayedAt = r.playedAt;
	}
	const { inserted, replacedScrobbles } = importRecords(records, minPlayedAt, maxPlayedAt);
	return { parsed: records.length, inserted, replacedScrobbles, error: null };
}
