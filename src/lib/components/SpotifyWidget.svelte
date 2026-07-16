<script lang="ts">
	import Music from '@lucide/svelte/icons/music';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Minus from '@lucide/svelte/icons/minus';
	import History from '@lucide/svelte/icons/history';

	interface SpotifyState {
		configured: boolean;
		playing: boolean;
		track?: string;
		artist?: string;
		url?: string;
		albumArt?: string;
		progressMs?: number;
		durationMs?: number;
		fetchedAt?: number;
		error?: boolean;
	}

	interface RecentItem {
		track: string;
		artist?: string;
		url?: string;
		albumArt?: string;
		playedAt: string;
	}

	function dateKey(d = new Date()) {
		// en-CA locale formats as YYYY-MM-DD, a stable sortable key.
		return d.toLocaleDateString('en-CA');
	}

	function loadListenedMs(): number {
		if (typeof localStorage === 'undefined') return 0;
		const raw = localStorage.getItem(`spotify-listened-${dateKey()}`);
		return raw ? Number(raw) : 0;
	}

	function saveListenedMs(ms: number) {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(`spotify-listened-${dateKey()}`, String(Math.round(ms)));
	}

	function formatClock(ms: number) {
		const totalSec = Math.max(0, Math.floor(ms / 1000));
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatListened(ms: number) {
		const mins = Math.floor(ms / 60_000);
		if (mins < 1) return 'under a minute';
		if (mins < 60) return `${mins}m`;
		return `${Math.floor(mins / 60)}h ${mins % 60}m`;
	}

	let data = $state<SpotifyState | null>(null);
	let recent = $state<RecentItem[]>([]);
	let recentAvailable = $state(false);
	let expanded = $state(false);
	let now = $state(Date.now());
	let listenedMsToday = $state(loadListenedMs());

	let pollTimeout: ReturnType<typeof setTimeout>;
	let lastTrack = '';

	async function pollRecent() {
		try {
			const res = await fetch('/api/spotify/recent');
			const body = await res.json();
			recentAvailable = Boolean(body.available);
			recent = body.items ?? [];
		} catch {
			recentAvailable = false;
		}
	}

	async function poll() {
		try {
			const res = await fetch('/api/spotify');
			data = await res.json();
		} catch {
			data = { configured: true, playing: false, error: true };
		}

		if (data?.track && data.track !== lastTrack) {
			if (lastTrack) pollRecent(); // a track just finished — refresh history
			lastTrack = data.track;
		}

		// Poll again right as the current track should end (clamped so we
		// never hammer the API, but also never sit stale for a full 30s after
		// a skip/track change like the old flat interval did).
		clearTimeout(pollTimeout);
		let delay = 30_000;
		if (data?.playing && data.durationMs && data.progressMs != null) {
			const remaining = data.durationMs - data.progressMs;
			delay = Math.min(30_000, Math.max(4_000, remaining + 1_500));
		}
		pollTimeout = setTimeout(poll, delay);
	}

	$effect(() => {
		poll();
		pollRecent();
		const recentInterval = setInterval(pollRecent, 60_000);

		// setInterval-based polling gets throttled in background tabs, which
		// is the other half of "doesn't refresh" — catch up as soon as the
		// tab is visible/focused again instead of waiting for the next tick.
		const onVisible = () => {
			if (document.visibilityState === 'visible') poll();
		};
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', onVisible);

		return () => {
			clearTimeout(pollTimeout);
			clearInterval(recentInterval);
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', onVisible);
		};
	});

	// Collapse the expanded card back to the pill if playback stops.
	$effect(() => {
		if (!data?.playing) expanded = false;
	});

	// Local 1s ticker while playing: drives the progress bar between polls
	// and accumulates today's listening time, without hitting the API.
	$effect(() => {
		if (!data?.playing) return;
		let last = Date.now();
		const id = setInterval(() => {
			const current = Date.now();
			listenedMsToday += current - last;
			last = current;
			now = current;
			saveListenedMs(listenedMsToday);
		}, 1000);
		return () => clearInterval(id);
	});

	const localProgressMs = $derived.by(() => {
		if (!data?.playing || !data.durationMs || data.fetchedAt == null) return data?.progressMs ?? 0;
		const elapsed = Math.max(0, now - data.fetchedAt);
		return Math.min(data.durationMs, (data.progressMs ?? 0) + elapsed);
	});

	const progressPct = $derived(
		data?.durationMs ? Math.min(100, (localProgressMs / data.durationMs) * 100) : 0
	);
</script>

{#if data?.playing && data.track}
	<div class="fixed bottom-6 left-6 z-10 flex flex-col items-start gap-2" data-hero-reveal="0">
		{#if expanded}
			<div
				class="card w-80 rounded-lg border border-border bg-surface p-3 shadow-[var(--shadow-card-hover)]"
			>
				<div class="flex items-center gap-3">
					{#if data.albumArt}
						<img src={data.albumArt} alt="" class="h-12 w-12 shrink-0 rounded-md object-cover" />
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-white">{data.track}</p>
						<p class="truncate text-xs text-dim">{data.artist}</p>
					</div>
					<a
						href={data.url}
						target="_blank"
						rel="noreferrer"
						aria-label="Open in Spotify"
						class="shrink-0 rounded-full p-1.5 text-dim transition-colors hover:text-primary"
					>
						<ExternalLink size={15} aria-hidden="true" />
					</a>
					<button
						type="button"
						aria-label="Minimize now-playing widget"
						class="shrink-0 rounded-full p-1.5 text-dim transition-colors hover:text-white"
						onclick={() => (expanded = false)}
					>
						<Minus size={15} aria-hidden="true" />
					</button>
				</div>

				{#if data.durationMs}
					<div class="mt-3">
						<div class="h-1 w-full overflow-hidden rounded-full bg-surface-2">
							<div
								class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
								style:width="{progressPct}%"
							></div>
						</div>
						<div class="mt-1 flex justify-between text-[11px] text-dim">
							<span>{formatClock(localProgressMs)}</span>
							<span>{formatClock(data.durationMs)}</span>
						</div>
					</div>
				{/if}

				<p class="mt-3 text-[11px] text-dim">
					{formatListened(listenedMsToday)} listened today
				</p>

				{#if recentAvailable && recent.length}
					<div class="mt-3 border-t border-border pt-3">
						<p class="flex items-center gap-1.5 text-[11px] font-medium text-dim">
							<History size={12} aria-hidden="true" /> Recently played
						</p>
						<ul class="mt-2 grid gap-2">
							{#each recent as item (item.playedAt)}
								<li>
									<a
										href={item.url}
										target="_blank"
										rel="noreferrer"
										class="flex items-center gap-2 rounded-md transition-colors hover:bg-surface-2"
									>
										{#if item.albumArt}
											<img
												src={item.albumArt}
												alt=""
												class="h-7 w-7 shrink-0 rounded object-cover"
											/>
										{/if}
										<span class="min-w-0 flex-1">
											<span class="block truncate text-xs text-gray">{item.track}</span>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{:else}
			<button
				type="button"
				aria-label={`Now playing: ${data.track} by ${data.artist}. Click to expand.`}
				class="card flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-4 pl-1.5 shadow-[var(--shadow-card-hover)] transition-colors hover:border-primary"
				onclick={() => (expanded = true)}
			>
				<span class="relative h-8 w-8 shrink-0">
					{#if data.albumArt}
						<img src={data.albumArt} alt="" class="h-8 w-8 rounded-full object-cover" />
					{:else}
						<span class="grid h-8 w-8 place-items-center rounded-full bg-surface-2">
							<Music size={14} class="text-primary" aria-hidden="true" />
						</span>
					{/if}
					<span
						class="absolute -right-0.5 -bottom-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface"
						aria-hidden="true"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
					</span>
				</span>
				<span class="max-w-[9rem] truncate text-xs font-medium text-white">{data.track}</span>
			</button>
		{/if}
	</div>
{/if}
