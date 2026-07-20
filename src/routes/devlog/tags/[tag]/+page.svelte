<script lang="ts">
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { reveal } from '$lib/actions/reveal';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="#{data.tag} — Devlog — RazerGhost"
	description="Devlog posts tagged {data.tag}."
	path="/devlog/tags/{data.tag}"
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/devlog" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
		<ArrowLeft size={15} aria-hidden="true" /> Devlog
	</a>

	<h1 class="mt-4 text-3xl font-extrabold tracking-tight text-white">#{data.tag}</h1>
	<p class="mt-2 text-gray">
		{data.entries.length}
		{data.entries.length === 1 ? 'post' : 'posts'} tagged &ldquo;{data.tag}&rdquo;.
	</p>

	{#if data.allTags.length > 1}
		<ul class="mt-6 flex flex-wrap gap-2">
			{#each data.allTags as tag}
				<li>
					<a
						href="/devlog/tags/{tag}"
						class="chip rounded-full border px-3 py-1 text-xs {tag === data.tag
							? 'border-primary text-primary'
							: 'border-border text-gray'}"
					>
						{tag}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-8 grid gap-4" use:reveal>
		{#each data.entries as entry (entry.slug)}
			<DevlogCard {entry} seriesInfo={data.seriesInfo[entry.slug]} />
		{:else}
			<p class="text-sm text-dim">No entries with this tag.</p>
		{/each}
	</div>
</main>
