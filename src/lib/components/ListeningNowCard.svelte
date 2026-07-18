<script lang="ts">
	import Music from '@lucide/svelte/icons/music';

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
	}

	interface HistoryLookup {
		found: boolean;
		plays?: number;
		firstPlayedAt?: string;
	}

	let data = $state<SpotifyState | null>(null);
	let history = $state<HistoryLookup | null>(null);
	let now = $state(Date.now());
	let pollTimeout: ReturnType<typeof setTimeout>;
	let lastUri = '';

	function trackUri(): string | null {
		if (!data?.url) return null;
		const id = data.url.split('/').pop();
		return id ? `spotify:track:${id}` : null;
	}

	async function lookupHistory() {
		const uri = trackUri();
		if (!uri) {
			history = null;
			return;
		}
		try {
			const res = await fetch(`/api/spotify/history-lookup?uri=${encodeURIComponent(uri)}`);
			history = await res.json();
		} catch {
			history = null;
		}
	}

	async function poll() {
		try {
			const res = await fetch('/api/spotify');
			data = await res.json();
		} catch {
			data = { configured: true, playing: false };
		}

		const uri = trackUri();
		if (uri && uri !== lastUri) {
			lastUri = uri;
			lookupHistory();
		}

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
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => {
			clearTimeout(pollTimeout);
			clearInterval(id);
		};
	});

	const localProgressMs = $derived.by(() => {
		if (!data?.playing || !data.durationMs || data.fetchedAt == null) return data?.progressMs ?? 0;
		const elapsed = Math.max(0, now - data.fetchedAt);
		return Math.min(data.durationMs, (data.progressMs ?? 0) + elapsed);
	});

	const progressPct = $derived(
		data?.durationMs ? Math.min(100, (localProgressMs / data.durationMs) * 100) : 0
	);

	function formatDate(iso: string | undefined): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	}
</script>

{#if data?.playing && data.track}
	<div class="rounded-lg border border-border p-5 sm:p-6" data-hero-reveal="0">
		<p class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
			<span class="relative flex h-2 w-2">
				<span class="absolute h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
				<span class="h-2 w-2 rounded-full bg-primary"></span>
			</span>
			Listening now
		</p>
		<div class="mt-3 flex items-center gap-3">
			{#if data.albumArt}
				<img src={data.albumArt} alt="" class="h-14 w-14 shrink-0 rounded-md object-cover" />
			{:else}
				<span class="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface-2">
					<Music size={20} class="text-primary" aria-hidden="true" />
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<a
					href={data.url}
					target="_blank"
					rel="noreferrer"
					class="link block truncate text-sm font-medium text-white hover:text-primary"
				>
					{data.track}
				</a>
				<p class="truncate text-xs text-dim">{data.artist}</p>
				{#if history?.found}
					<p class="mt-1 text-xs text-dim">
						Played {history.plays} time{history.plays === 1 ? '' : 's'} before
						{#if history.firstPlayedAt}
							&middot; first in {formatDate(history.firstPlayedAt)}
						{/if}
					</p>
				{/if}
			</div>
		</div>
		{#if data.durationMs}
			<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
				<div
					class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
					style:width="{progressPct}%"
				></div>
			</div>
		{/if}
	</div>
{/if}
