<script lang="ts">
	import { attachCopyButtons } from '$lib/actions/copy-code';
	import { mountEmbeds } from '$lib/actions/mount-embeds';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formattedDate = $derived(
		new Date(data.entry.date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	let contentEl: HTMLElement;

	$effect(() => {
		// re-run whenever the rendered post body changes (e.g. navigating
		// between posts client-side)
		data.entry.html;

		const cleanupCopy = attachCopyButtons(contentEl);
		const cleanupEmbeds = mountEmbeds(contentEl);

		return () => {
			cleanupCopy();
			cleanupEmbeds();
		};
	});
</script>

<Seo
	title="{data.entry.title} — RazerGhost"
	description={data.entry.excerpt}
	path="/devlog/{data.entry.slug}"
	image={data.entry.cover}
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/devlog" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
		<ArrowLeft size={15} aria-hidden="true" /> Devlog
	</a>

	<article class="mt-4">
		{#if data.entry.cover}
			<img
				src={data.entry.cover}
				alt=""
				class="mb-8 aspect-video w-full rounded-lg object-cover"
			/>
		{/if}

		<p class="text-xs uppercase tracking-wide text-dim">
			{formattedDate} · {data.entry.readingTime} min read
		</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-white">
			{data.entry.title}
		</h1>

		{#if data.entry.tags.length}
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each data.entry.tags as tag}
					<li class="chip rounded-full border border-border px-3 py-1 text-xs text-gray">
						{tag}
					</li>
				{/each}
			</ul>
		{/if}

		<div class="devlog-content mt-8" bind:this={contentEl}>
			{@html data.entry.html}
		</div>
	</article>
</main>
