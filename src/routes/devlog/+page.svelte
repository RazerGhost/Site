<script lang="ts">
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import { reveal } from '$lib/actions/reveal';
	import Rss from '@lucide/svelte/icons/rss';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTag = $state<string | null>(null);

	const tags = $derived([...new Set(data.entries.flatMap((e) => e.tags))].sort());

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		return tag ? data.entries.filter((e) => e.tags.includes(tag)) : data.entries;
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}
</script>

<svelte:head>
	<title>Devlog — RazerGhost</title>
</svelte:head>

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
			<p class="text-sm text-dim">No entries match that tag.</p>
		{/each}
	</div>
</main>
