<script lang="ts">
	import { attachCopyButtons } from '$lib/actions/copy-code';
	import { mountEmbeds } from '$lib/actions/mount-embeds';
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
	const hasToc = $derived(data.entry.toc.length > 1);

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

<main class="mx-auto max-w-2xl px-6 py-16 {hasToc ? 'lg:max-w-5xl' : ''}">
	<div class="{hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-12' : ''}">
		<div class="lg:mx-auto lg:w-full lg:max-w-2xl">
			<a href="/devlog" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
				<ArrowLeft size={15} aria-hidden="true" /> Devlog
			</a>
		</div>
	</div>

	<div class="{hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:items-start lg:gap-12' : ''}">
	<article class="mt-4 lg:mx-auto lg:w-full {hasToc ? 'lg:max-w-2xl' : ''}">
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

		{#if data.series}
			<div class="mt-4 rounded-lg border border-primary/30 bg-surface p-4">
				<p class="text-xs font-semibold tracking-wide text-primary uppercase">
					{data.series.name} · Part {data.series.part} of {data.series.total}
				</p>
				<ol class="mt-3 space-y-1.5">
					{#each data.series.parts as part, i}
						<li class="text-sm">
							{#if part.slug === data.entry.slug}
								<span class="text-white">{i + 1}. {part.title}</span>
							{:else}
								<a href="/devlog/{part.slug}" class="text-gray hover:text-primary">
									{i + 1}. {part.title}
								</a>
							{/if}
						</li>
					{/each}
				</ol>
			</div>
		{/if}

		<div class="mt-6">
			<ShareButtons url={shareUrl} title={data.entry.title} />
		</div>

		{#if hasToc}
			<div class="mt-6 lg:hidden">
				<TableOfContents toc={data.entry.toc} />
			</div>
		{/if}

		<div class="devlog-content mt-8" bind:this={contentEl}>
			{@html data.entry.html}
		</div>

		<div class="h-56" aria-hidden="true"></div>
	</article>

	{#if hasToc}
		<aside class="hidden lg:sticky lg:top-20 lg:block">
			<TableOfContents toc={data.entry.toc} />
		</aside>
	{/if}
	</div>

	{#if data.older || data.newer}
		<nav class="mt-12 grid gap-4 sm:grid-cols-2" aria-label="Post navigation">
			{#if data.older}
				<a
					href="/devlog/{data.older.slug}"
					class="card card--interactive group block rounded-lg border border-border bg-surface p-5 {!data.newer
						? 'sm:col-span-2'
						: ''}"
				>
					<span class="flex items-center gap-1 text-xs uppercase tracking-wide text-dim">
						<ArrowLeft size={12} aria-hidden="true" /> Older
					</span>
					<span class="mt-2 block text-base font-semibold text-white group-hover:text-primary">
						{data.older.title}
					</span>
				</a>
			{/if}
			{#if data.newer}
				<a
					href="/devlog/{data.newer.slug}"
					class="card card--interactive group block rounded-lg border border-border bg-surface p-5 sm:text-right {!data.older
						? 'sm:col-span-2'
						: ''}"
				>
					<span class="flex items-center gap-1 text-xs uppercase tracking-wide text-dim sm:justify-end">
						Newer <ArrowRight size={12} aria-hidden="true" />
					</span>
					<span class="mt-2 block text-base font-semibold text-white group-hover:text-primary">
						{data.newer.title}
					</span>
				</a>
			{/if}
		</nav>
	{/if}

	{#if data.related.length}
		<div class="mt-12 {hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-12' : ''}">
			<div class="lg:mx-auto lg:w-full lg:max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-wide text-dim">More like this</p>
				<div class="mt-4 grid gap-4">
					{#each data.related as entry (entry.slug)}
						<DevlogCard {entry} seriesInfo={data.seriesInfo[entry.slug]} />
					{/each}
				</div>
			</div>
		</div>
	{/if}
</main>
