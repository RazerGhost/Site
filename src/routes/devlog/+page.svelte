<script lang="ts">
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { reveal } from '$lib/actions/reveal';
	import Rss from '@lucide/svelte/icons/rss';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTag = $state<string | null>(null);
	let query = $state('');

	const tags = $derived([...new Set(data.entries.flatMap((e) => e.tags))].sort());

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		const q = query.trim().toLowerCase();
		return data.entries.filter((e) => {
			const matchesTag = !tag || e.tags.includes(tag);
			const matchesQuery = !q || e.title.toLowerCase().includes(q) || e.excerpt.toLowerCase().includes(q);
			return matchesTag && matchesQuery;
		});
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}
</script>

<Seo title="Devlog — RazerGhost" description="Notes on whatever I'm building at the moment." path="/devlog" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<div class="flex items-baseline justify-between" data-hero-reveal="0">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Devlog</h1>
		<a
			href="/devlog/rss.xml"
			class="link flex items-center gap-1.5 text-sm text-dim hover:text-primary"
		>
			<Rss size={14} aria-hidden="true" /> RSS
		</a>
	</div>
	<p class="mt-2 text-gray" data-hero-reveal="1">Notes on whatever I'm building at the moment.</p>

	<input
		type="search"
		bind:value={query}
		placeholder="Search posts…"
		class="mt-6 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
	/>

	{#if tags.length}
		<ul class="mt-6 flex flex-wrap gap-2">
			<li>
				<button
					class="chip rounded-full border px-3 py-1 text-xs {selectedTag === null
						? 'border-primary text-primary'
						: 'border-border text-gray'}"
					onclick={() => (selectedTag = null)}
				>
					All
				</button>
			</li>
			{#each tags as tag}
				<li>
					<button
						class="chip rounded-full border px-3 py-1 text-xs {selectedTag === tag
							? 'border-primary text-primary'
							: 'border-border text-gray'}"
						onclick={() => toggleTag(tag)}
					>
						{tag}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-8 grid gap-4" use:reveal>
		{#each filtered as entry (entry.slug)}
			<DevlogCard {entry} />
		{:else}
			<p class="text-sm text-dim">No entries match your search.</p>
		{/each}
	</div>
</main>
