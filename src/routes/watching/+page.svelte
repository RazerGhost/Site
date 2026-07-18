<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import Tv from '@lucide/svelte/icons/tv';
	import type { PageData } from './$types';
	import type { LibraryItem } from '$lib/server/simkl';

	let { data }: { data: PageData } = $props();
</script>

{#snippet grid(items: LibraryItem[])}
	<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3" use:reveal>
		{#each items as item, i (item.href)}
			<a
				href={item.href}
				target="_blank"
				rel="noreferrer"
				class="card group overflow-hidden rounded-lg border border-border bg-surface/50 transition-colors hover:border-primary"
				style="transition-delay: {Math.min(i, 12) * 60}ms"
			>
				<div class="aspect-[2/3] w-full overflow-hidden bg-surface-2">
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
				</div>
				<div class="p-3">
					<p class="truncate text-sm font-medium text-white">{item.title}</p>
					<p class="mt-0.5 text-xs text-dim">
						{item.totalEpisodes ? `${item.watchedEpisodes}/${item.totalEpisodes} episodes` : 'Movie'}
					</p>
				</div>
			</a>
		{/each}
	</div>
{/snippet}

<Seo title="Watching — RazerGhost" description="Kdramas I'm watching, have finished, and plan to watch." path="/watching" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Watching</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Kdramas I'm working through, have finished, and want to get to.</p>

	{#if !data.configured}
		<p class="mt-10 flex items-center gap-2 text-sm text-dim">
			<Tv size={15} aria-hidden="true" /> Simkl not connected.
		</p>
	{:else if data.error}
		<p class="mt-10 text-sm text-dim">Couldn't reach Simkl right now — try again later.</p>
	{:else}
		<section class="mt-10">
			<h2 class="text-lg font-semibold text-white">Watching</h2>
			{#if data.watching.length === 0}
				<p class="mt-4 text-sm text-dim">Nothing in progress right now.</p>
			{:else}
				{@render grid(data.watching)}
			{/if}
		</section>

		<section class="mt-14">
			<h2 class="text-lg font-semibold text-white">Completed <span class="text-dim">({data.completed.length})</span></h2>
			{#if data.completed.length === 0}
				<p class="mt-4 text-sm text-dim">Nothing finished yet.</p>
			{:else}
				{@render grid(data.completed)}
			{/if}
		</section>

		<section class="mt-14">
			<h2 class="text-lg font-semibold text-white">Plan to Watch <span class="text-dim">({data.planToWatch.length})</span></h2>
			{#if data.planToWatch.length === 0}
				<p class="mt-4 text-sm text-dim">Nothing queued up.</p>
			{:else}
				{@render grid(data.planToWatch)}
			{/if}
		</section>
	{/if}
</main>
