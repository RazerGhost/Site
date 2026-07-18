<script lang="ts">
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { reveal } from '$lib/actions/reveal';
	import Rss from '@lucide/svelte/icons/rss';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTag = $state<string | null>(null);
	let query = $state('');

	const tagCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of data.entries) {
			for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
		return counts;
	});
	const tags = $derived([...tagCounts.keys()].sort());

	const latestDate = $derived(
		data.entries.reduce<string | null>((max, e) => (!max || e.date > max ? e.date : max), null)
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		const q = query.trim().toLowerCase();
		return data.entries.filter((e) => {
			const matchesTag = !tag || e.tags.includes(tag);
			const matchesQuery =
				!q ||
				e.title.toLowerCase().includes(q) ||
				e.excerpt.toLowerCase().includes(q) ||
				e.searchText.includes(q);
			return matchesTag && matchesQuery;
		});
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}
</script>

<Seo title="Devlog — RazerGhost" description="Notes on whatever I'm building at the moment." path="/devlog" />

<main class="mx-auto max-w-6xl px-6 py-16">
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

	<div class="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-border p-4 text-center" data-hero-reveal="2">
		<div>
			<p class="text-xl font-bold text-white">{data.entries.length}</p>
			<p class="mt-0.5 text-xs text-dim">Posts</p>
		</div>
		<div>
			<p class="text-xl font-bold text-white">{tags.length}</p>
			<p class="mt-0.5 text-xs text-dim">Tags</p>
		</div>
		<div>
			<p class="text-xl font-bold text-white">{latestDate ? formatDate(latestDate) : '—'}</p>
			<p class="mt-0.5 text-xs text-dim">Latest post</p>
		</div>
	</div>

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
					All <span class="text-dim">{data.entries.length}</span>
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
						{tag} <span class="text-dim">{tagCounts.get(tag)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-8 grid gap-4 sm:grid-cols-2" use:reveal>
		{#each filtered as entry (entry.slug)}
			<DevlogCard {entry} />
		{:else}
			<p class="text-sm text-dim">No entries match your search.</p>
		{/each}
	</div>
</main>
