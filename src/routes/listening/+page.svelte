<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Music from '@lucide/svelte/icons/music';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	const listenTime = $derived.by(() => {
		const totalMinutes = data.stats.totalMsPlayed / 60000;
		const days = Math.floor(totalMinutes / (60 * 24));
		const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
		const minutes = Math.round(totalMinutes % 60);
		return { days, hours, minutes };
	});

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function trackHref(spotifyUri: string | null): string | null {
		if (!spotifyUri) return null;
		const id = spotifyUri.split(':').pop();
		return id ? `https://open.spotify.com/track/${id}` : null;
	}

	const maxArtistMs = $derived(Math.max(1, ...data.stats.topArtists.map((a) => a.msPlayed)));
	const maxTrackPlays = $derived(Math.max(1, ...data.stats.topTracks.map((t) => t.plays)));
</script>

<Seo
	title="Listening — RazerGhost"
	description="What I've been listening to on Spotify, built from my own extended streaming history export."
	path="/listening"
/>

<main class="mx-auto max-w-6xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Listening</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">
		My Spotify listening history, imported from my own data export — not a live feed, just
		everything I've listened to so far.
	</p>

	{#if !data.configured}
		<p class="mt-10 flex items-center gap-2 text-sm text-dim">
			<Music size={15} aria-hidden="true" /> No listening history imported yet.
		</p>
	{:else}
		<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			<div class="rounded-lg border border-border p-5 sm:p-6" use:reveal>
				<p class="text-xs font-medium uppercase tracking-wide text-dim">Spent listening</p>
				<p class="mt-2 flex items-baseline gap-1.5 text-white">
					<span class="text-4xl font-extrabold sm:text-5xl">{listenTime.days}</span>
					<span class="text-sm text-dim">d</span>
					<span class="text-4xl font-extrabold sm:text-5xl">{listenTime.hours}</span>
					<span class="text-sm text-dim">h</span>
					<span class="text-4xl font-extrabold sm:text-5xl">{listenTime.minutes}</span>
					<span class="text-sm text-dim">m</span>
				</p>

				<div class="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5 text-center">
					<div>
						<p class="text-xl font-bold text-white">{data.stats.totalPlays.toLocaleString()}</p>
						<p class="mt-0.5 text-xs text-dim">Total plays</p>
					</div>
					<div>
						<p class="text-xl font-bold text-white">{data.stats.peakYear ?? '—'}</p>
						<p class="mt-0.5 text-xs text-dim">Peak year</p>
					</div>
					<div>
						<p class="text-xl font-bold text-white">
							{data.stats.peakWeekday != null ? WEEKDAY_NAMES[data.stats.peakWeekday] : '—'}
						</p>
						<p class="mt-0.5 text-xs text-dim">Most active day</p>
					</div>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center">
					<div>
						<p class="text-xl font-bold text-white">{formatDate(data.stats.firstPlayedAt)}</p>
						<p class="mt-0.5 text-xs text-dim">Earliest play</p>
					</div>
					<div>
						<p class="text-xl font-bold text-white">{formatDate(data.stats.lastPlayedAt)}</p>
						<p class="mt-0.5 text-xs text-dim">Most recent play</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				{#if data.stats.topArtists.length}
					<div class="rounded-lg border border-border p-5 sm:p-6" use:reveal>
						<p class="text-xs font-medium uppercase tracking-wide text-dim">Top artists</p>
						<ul class="mt-4 flex flex-col gap-3">
							{#each data.stats.topArtists as artist}
								<li>
									<div class="flex items-center justify-between text-sm">
										<span class="text-white">{artist.artist}</span>
										<span class="text-dim">{artist.plays} plays</span>
									</div>
									<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
										<div
											class="h-full rounded-full bg-primary"
											style="width: {(artist.msPlayed / maxArtistMs) * 100}%"
										></div>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if data.stats.topTracks.length}
					<div class="rounded-lg border border-border p-5 sm:p-6" use:reveal>
						<p class="text-xs font-medium uppercase tracking-wide text-dim">Top tracks</p>
						<ul class="mt-4 flex flex-col gap-3">
							{#each data.stats.topTracks as track}
								{@const href = trackHref(track.spotifyUri)}
								<li>
									<div class="flex items-center justify-between text-sm">
										<span class="min-w-0 flex-1 truncate text-white">
											{#if href}
												<a {href} target="_blank" rel="noreferrer" class="link hover:text-primary"
													>{track.track}</a
												>
											{:else}
												{track.track}
											{/if}
											<span class="text-dim"> — {track.artist}</span>
										</span>
										<span class="ml-3 shrink-0 text-dim">{track.plays}</span>
									</div>
									<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
										<div
											class="h-full rounded-full bg-primary"
											style="width: {(track.plays / maxTrackPlays) * 100}%"
										></div>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>
