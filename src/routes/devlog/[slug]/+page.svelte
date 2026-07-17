<script lang="ts">
	import { attachCopyButtons } from '$lib/actions/copy-code';
	import { mountEmbeds } from '$lib/actions/mount-embeds';
	import Comments from '$lib/components/Comments.svelte';
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import { site } from '$lib/config';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formattedDate = $derived(
		new Date(data.entry.date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const shareUrl = $derived(`${site.url}/devlog/${data.entry.slug}`);

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
	image={data.entry.cover ?? `/devlog/${data.entry.slug}/og.png`}
	noindex={data.entry.draft}
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/devlog" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
		<ArrowLeft size={15} aria-hidden="true" /> Devlog
	</a>

	<article class="mt-4">
		{#if data.entry.draft}
			<p
				class="mb-4 inline-block rounded-full border border-warn/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warn"
			>
				Draft — not published
			</p>
		{/if}

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
					<li>
						<a
							href="/devlog/tags/{tag}"
							class="chip rounded-full border border-border px-3 py-1 text-xs text-gray"
						>
							{tag}
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-6">
			<ShareButtons url={shareUrl} title={data.entry.title} />
		</div>

		{#if data.entry.toc.length > 1}
			<div class="mt-6">
				<TableOfContents toc={data.entry.toc} />
			</div>
		{/if}

		<div class="devlog-content mt-8" bind:this={contentEl}>
			{@html data.entry.html}
		</div>
	</article>

	{#if data.older || data.newer}
		<nav class="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-6" aria-label="Post navigation">
			<div>
				{#if data.older}
					<a href="/devlog/{data.older.slug}" class="group block">
						<span class="flex items-center gap-1 text-xs uppercase tracking-wide text-dim">
							<ArrowLeft size={12} aria-hidden="true" /> Older
						</span>
						<span class="mt-1 block text-sm text-gray group-hover:text-primary">
							{data.older.title}
						</span>
					</a>
				{/if}
			</div>
			<div class="text-right">
				{#if data.newer}
					<a href="/devlog/{data.newer.slug}" class="group block">
						<span class="flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-dim">
							Newer <ArrowRight size={12} aria-hidden="true" />
						</span>
						<span class="mt-1 block text-sm text-gray group-hover:text-primary">
							{data.newer.title}
						</span>
					</a>
				{/if}
			</div>
		</nav>
	{/if}

	{#if data.related.length}
		<div class="mt-12">
			<p class="text-xs font-semibold uppercase tracking-wide text-dim">More like this</p>
			<div class="mt-4 grid gap-4">
				{#each data.related as entry (entry.slug)}
					<DevlogCard {entry} />
				{/each}
			</div>
		</div>
	{/if}

	<Comments />
</main>
