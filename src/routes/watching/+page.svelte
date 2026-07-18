<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import Tv from '@lucide/svelte/icons/tv';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Star from '@lucide/svelte/icons/star';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import type { PageData } from './$types';
	import type { LibraryItem } from '$lib/server/simkl';

	let { data }: { data: PageData } = $props();

	let retrying = $state(false);
	let query = $state('');
	let sortMode = $state<'added' | 'title' | 'progress'>('added');
	let selectedGenre = $state<string | null>(null);
	let activeGroup = $state<'tv' | 'anime'>('tv');
	let pickedTitle = $state<string | null>(null);

	function switchGroup(group: 'tv' | 'anime') {
		activeGroup = group;
		selectedGenre = null;
	}

	function inGroup(item: LibraryItem, group: 'tv' | 'anime'): boolean {
		return group === 'anime' ? item.mediaType === 'anime' : item.mediaType !== 'anime';
	}

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}

	function progressRatio(item: LibraryItem): number {
		if (!item.totalEpisodes) return item.watchedEpisodes > 0 ? 1 : 0;
		return item.watchedEpisodes / item.totalEpisodes;
	}

	function prepare(items: LibraryItem[]): LibraryItem[] {
		const needle = query.trim().toLowerCase();
		const genre = selectedGenre;
		const filtered = items.filter((item) => {
			const matchesQuery = !needle || item.title.toLowerCase().includes(needle);
			const matchesGenre = !genre || item.genres.includes(genre);
			return matchesQuery && matchesGenre;
		});

		const sorted = [...filtered];
		if (sortMode === 'title') {
			sorted.sort((a, b) => a.title.localeCompare(b.title));
		} else if (sortMode === 'progress') {
			sorted.sort((a, b) => progressRatio(b) - progressRatio(a));
		} else {
			sorted.sort((a, b) => (a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0));
		}
		return sorted;
	}

	function emptyMessage(fallback: string): string {
		if (query && selectedGenre) return `No matches for "${query}" in ${selectedGenre}.`;
		if (query) return `No matches for "${query}".`;
		if (selectedGenre) return `Nothing tagged ${selectedGenre}.`;
		return fallback;
	}

	// Always pulls from TV/movies regardless of which tab is active — kept
	// separate from the anime library rather than a shared "surprise me
	// from whatever tab you're on", per explicit request.
	function surpriseMe() {
		const pool = data.planToWatch.filter((item) => item.mediaType !== 'anime');
		if (pool.length === 0) return;
		const pick = pool[Math.floor(Math.random() * pool.length)];
		pickedTitle = pick.title;
		window.open(pick.href, '_blank', 'noopener');
	}

	const hasAnime = $derived(
		[...data.watching, ...data.completed, ...data.planToWatch, ...data.onHold, ...data.dropped].some(
			(item) => item.mediaType === 'anime'
		)
	);

	const groupWatching = $derived(data.watching.filter((item) => inGroup(item, activeGroup)));
	const groupOnHold = $derived(data.onHold.filter((item) => inGroup(item, activeGroup)));
	const groupCompleted = $derived(data.completed.filter((item) => inGroup(item, activeGroup)));
	const groupDropped = $derived(data.dropped.filter((item) => inGroup(item, activeGroup)));
	const groupPlanToWatch = $derived(data.planToWatch.filter((item) => inGroup(item, activeGroup)));
	const groupSurprisePool = $derived(data.planToWatch.filter((item) => item.mediaType !== 'anime'));

	const filteredWatching = $derived(prepare(groupWatching));
	const filteredOnHold = $derived(prepare(groupOnHold));
	const filteredCompleted = $derived(prepare(groupCompleted));
	const filteredDropped = $derived(prepare(groupDropped));
	const filteredPlanToWatch = $derived(prepare(groupPlanToWatch));

	const totalEpisodesWatched = $derived(
		[...groupWatching, ...groupCompleted, ...groupOnHold, ...groupDropped, ...groupPlanToWatch].reduce(
			(sum, item) => sum + item.watchedEpisodes,
			0
		)
	);
	const completedThisYear = $derived.by(() => {
		const year = new Date().getFullYear();
		return groupCompleted.filter(
			(item) => item.lastWatchedAt && new Date(item.lastWatchedAt).getFullYear() === year
		).length;
	});

	const allGenres = $derived(
		[...new Set(
			[...groupWatching, ...groupCompleted, ...groupPlanToWatch, ...groupOnHold, ...groupDropped].flatMap(
				(item) => item.genres
			)
		)].sort()
	);
</script>

{#snippet grid(items: LibraryItem[])}
	<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
		{#each items as item, i (item.href)}
			<a
				href={item.href}
				target="_blank"
				rel="noreferrer"
				class="card group overflow-hidden rounded-lg border border-border bg-surface/50 transition-colors hover:border-primary"
				style="transition-delay: {Math.min(i, 12) * 60}ms"
				use:reveal
			>
				<div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-2">
					{#if item.posterUrl}
						<img
							src={item.posterUrl}
							alt=""
							loading="lazy"
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					{:else}
						<div class="grid h-full w-full place-items-center">
							<Tv size={24} class="text-dim" aria-hidden="true" />
						</div>
					{/if}
					{#if item.overview}
						<div
							class="absolute inset-0 hidden items-end bg-gradient-to-t from-bg/95 via-bg/60 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex"
						>
							<p class="line-clamp-6 text-[11px] leading-snug text-gray">{item.overview}</p>
						</div>
					{/if}
					{#if item.rating}
						<span
							class="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-bg/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
						>
							<Star size={10} class="fill-primary text-primary" aria-hidden="true" />
							{item.rating}
						</span>
					{/if}
					{#if item.totalEpisodes}
						<div class="absolute inset-x-0 bottom-0 h-1 bg-black/40">
							<div
								class="h-full bg-primary"
								style="width: {Math.min(100, progressRatio(item) * 100)}%"
							></div>
						</div>
					{/if}
				</div>
				<div class="p-3">
					<p class="truncate text-sm font-medium text-white">{item.title}</p>
					<p class="mt-0.5 text-xs text-dim">
						{item.totalEpisodes ? `${item.watchedEpisodes}/${item.totalEpisodes} episodes` : 'Movie'}
					</p>
					{#if item.genres.length}
						<p class="mt-0.5 truncate text-[11px] text-dim">{item.genres.slice(0, 2).join(' · ')}</p>
					{/if}
					{#if item.nextToWatch}
						<p class="mt-0.5 truncate text-[11px] text-primary">Up next: {item.nextToWatch}</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/snippet}

<Seo title="Watching — RazerGhost" description="Shows, movies, and anime I'm watching, have finished, and plan to watch." path="/watching" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Watching</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">What I'm working through, have finished, and want to get to.</p>

	{#if !data.configured}
		<p class="mt-10 flex items-center gap-2 text-sm text-dim">
			<Tv size={15} aria-hidden="true" /> Simkl not connected.
		</p>
	{:else if data.error}
		<div class="mt-10 flex items-center gap-3 text-sm text-dim">
			<p>Couldn't reach Simkl right now.</p>
			<button
				type="button"
				onclick={retry}
				disabled={retrying}
				class="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-primary disabled:opacity-50"
			>
				<RefreshCw size={12} class={retrying ? 'animate-spin' : ''} aria-hidden="true" />
				{retrying ? 'Retrying…' : 'Retry'}
			</button>
		</div>
	{:else}
		{#if hasAnime}
			<div class="mt-6 inline-flex rounded-lg border border-border p-1" role="tablist" aria-label="Media type">
				<button
					type="button"
					role="tab"
					aria-selected={activeGroup === 'tv'}
					onclick={() => switchGroup('tv')}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeGroup === 'tv'
						? 'bg-primary/10 text-primary'
						: 'text-gray hover:text-primary'}"
				>
					TV & Movies
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeGroup === 'anime'}
					onclick={() => switchGroup('anime')}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeGroup === 'anime'
						? 'bg-primary/10 text-primary'
						: 'text-gray hover:text-primary'}"
				>
					Anime
				</button>
			</div>
		{/if}

		<div class="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-border p-4 text-center">
			<div>
				<p class="text-2xl font-bold text-white">{groupCompleted.length}</p>
				<p class="mt-0.5 text-xs text-dim">Completed</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-white">{totalEpisodesWatched}</p>
				<p class="mt-0.5 text-xs text-dim">Episodes watched</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-white">{completedThisYear}</p>
				<p class="mt-0.5 text-xs text-dim">Completed this year</p>
			</div>
		</div>

		<div class="mt-6 flex flex-col gap-3 sm:flex-row">
			<input
				type="search"
				bind:value={query}
				placeholder="Search titles…"
				class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none sm:flex-1"
			/>
			<select
				bind:value={sortMode}
				aria-label="Sort"
				class="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
			>
				<option value="added">Recently added</option>
				<option value="title">Title (A–Z)</option>
				<option value="progress">Progress</option>
			</select>
		</div>

		{#if allGenres.length}
			<ul class="mt-4 flex flex-wrap gap-2">
				<li>
					<button
						type="button"
						class="chip rounded-full border px-3 py-1 text-xs {selectedGenre === null
							? 'border-primary text-primary'
							: 'border-border text-gray'}"
						onclick={() => (selectedGenre = null)}
					>
						All genres
					</button>
				</li>
				{#each allGenres as genre}
					<li>
						<button
							type="button"
							class="chip rounded-full border px-3 py-1 text-xs {selectedGenre === genre
								? 'border-primary text-primary'
								: 'border-border text-gray'}"
							onclick={() => (selectedGenre = selectedGenre === genre ? null : genre)}
						>
							{genre}
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if activeGroup === 'tv' && groupSurprisePool.length > 0}
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<button
					type="button"
					onclick={surpriseMe}
					class="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-primary"
				>
					<Shuffle size={12} aria-hidden="true" /> Surprise me
				</button>
				{#if pickedTitle}
					<p class="text-xs text-dim">How about <span class="text-primary">{pickedTitle}</span>?</p>
				{/if}
			</div>
		{/if}

		<section class="mt-10">
			<h2 class="text-lg font-semibold text-white">Watching</h2>
			{#if filteredWatching.length === 0}
				<p class="mt-4 text-sm text-dim">{emptyMessage('Nothing in progress right now.')}</p>
			{:else}
				{@render grid(filteredWatching)}
			{/if}
		</section>

		{#if groupOnHold.length > 0}
			<section class="mt-14">
				<h2 class="text-lg font-semibold text-white">On Hold <span class="text-dim">({groupOnHold.length})</span></h2>
				{#if filteredOnHold.length === 0}
					<p class="mt-4 text-sm text-dim">{emptyMessage('Nothing on hold.')}</p>
				{:else}
					{@render grid(filteredOnHold)}
				{/if}
			</section>
		{/if}

		<section class="mt-14">
			<h2 class="text-lg font-semibold text-white">Completed <span class="text-dim">({groupCompleted.length})</span></h2>
			{#if filteredCompleted.length === 0}
				<p class="mt-4 text-sm text-dim">{emptyMessage('Nothing finished yet.')}</p>
			{:else}
				{@render grid(filteredCompleted)}
			{/if}
		</section>

		{#if groupDropped.length > 0}
			<section class="mt-14">
				<h2 class="text-lg font-semibold text-white">Dropped <span class="text-dim">({groupDropped.length})</span></h2>
				{#if filteredDropped.length === 0}
					<p class="mt-4 text-sm text-dim">{emptyMessage('Nothing dropped.')}</p>
				{:else}
					{@render grid(filteredDropped)}
				{/if}
			</section>
		{/if}

		<section class="mt-14">
			<h2 class="text-lg font-semibold text-white">Plan to Watch <span class="text-dim">({groupPlanToWatch.length})</span></h2>
			{#if filteredPlanToWatch.length === 0}
				<p class="mt-4 text-sm text-dim">{emptyMessage('Nothing queued up.')}</p>
			{:else}
				{@render grid(filteredPlanToWatch)}
			{/if}
		</section>
	{/if}
</main>
