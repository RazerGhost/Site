<script lang="ts">
	import { attachCopyButtons } from '$lib/actions/copy-code';
	import { mountEmbeds } from '$lib/actions/mount-embeds';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import GithubRepoStats from '$lib/components/GithubRepoStats.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { site } from '$lib/config';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const shareUrl = $derived(`${site.url}/projects/${data.project.slug}`);
	const hasToc = $derived(data.project.toc.length > 1);

	let contentEl: HTMLElement;

	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	function openLightbox(i: number) {
		lightboxIndex = i;
		lightboxOpen = true;
	}

	$effect(() => {
		// re-run whenever the rendered project body changes (e.g. navigating
		// between projects client-side)
		data.project.html;

		const cleanupCopy = attachCopyButtons(contentEl);
		const cleanupEmbeds = mountEmbeds(contentEl);

		return () => {
			cleanupCopy();
			cleanupEmbeds();
		};
	});
</script>

<Seo
	title="{data.project.name} — RazerGhost"
	description={data.project.description}
	path="/projects/{data.project.slug}"
	image={data.project.cover ?? `/projects/${data.project.slug}/og.png`}
	noindex={data.project.draft}
/>

<main class="mx-auto max-w-2xl px-6 py-16 {hasToc ? 'lg:max-w-5xl' : ''}">
	<div class="{hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-12' : ''}">
		<div class="lg:mx-auto lg:w-full lg:max-w-2xl">
			<a href="/projects" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
				<ArrowLeft size={15} aria-hidden="true" /> Projects
			</a>
		</div>
	</div>

	<div class="{hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:items-start lg:gap-12' : ''}">
	<article class="mt-4 lg:mx-auto lg:w-full {hasToc ? 'lg:max-w-2xl' : ''}">
		{#if data.project.draft}
			<p
				class="mb-4 inline-block rounded-full border border-warn/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warn"
			>
				Draft — not published
			</p>
		{/if}

		{#if data.project.cover}
			<img
				src={data.project.cover}
				alt=""
				class="mb-8 aspect-video w-full rounded-lg object-cover"
			/>
		{/if}

		<div class="mt-2 flex items-center gap-3">
			<h1 class="text-3xl font-extrabold tracking-tight text-white">
				{data.project.name}
			</h1>
			{#if data.project.status !== 'active'}
				<span class="chip rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-dim">
					{data.project.status}
				</span>
			{/if}
		</div>
		<p class="mt-1 text-xs uppercase tracking-wide text-dim">{data.project.readingTime} min read</p>
		<p class="mt-2 text-gray">{data.project.description}</p>

		{#if data.project.stack.length}
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each data.project.stack as item}
					<li class="chip rounded-full border border-border px-3 py-1 text-xs text-gray">
						{item}
					</li>
				{/each}
			</ul>
		{/if}

		{#if data.project.tags.length}
			<ul class="mt-2 flex flex-wrap gap-2">
				{#each data.project.tags as tag}
					<li>
						<a
							href="/projects/tags/{tag}"
							class="chip rounded-full border border-border px-3 py-1 text-xs text-gray"
						>
							#{tag}
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-6 flex flex-wrap gap-3">
			{#if data.project.live}
				<a
					href={data.project.live}
					target="_blank"
					rel="noopener noreferrer"
					class="link flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
				>
					Live site <ArrowUpRight size={14} aria-hidden="true" />
				</a>
			{/if}
			{#if data.project.href}
				<a
					href={data.project.href}
					target="_blank"
					rel="noopener noreferrer"
					class="link flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
				>
					<GithubIcon size={14} aria-hidden="true" /> Source
				</a>
			{/if}
		</div>

		{#if data.project.href}
			<div class="mt-3">
				<GithubRepoStats href={data.project.href} />
			</div>
		{/if}

		{#if data.project.images.length}
			<div class="mt-6 grid gap-3 sm:grid-cols-2">
				{#each data.project.images as image, i}
					<button
						type="button"
						class="block"
						aria-label="View screenshot {i + 1} larger"
						onclick={() => openLightbox(i)}
					>
						<img
							src={image}
							alt=""
							class="aspect-video w-full rounded-lg object-cover transition-opacity hover:opacity-85"
						/>
					</button>
				{/each}
			</div>
			<Lightbox images={data.project.images} bind:open={lightboxOpen} bind:index={lightboxIndex} />
		{/if}

		<div class="mt-6">
			<ShareButtons url={shareUrl} title={data.project.name} />
		</div>

		{#if hasToc}
			<div class="mt-6 lg:hidden">
				<TableOfContents toc={data.project.toc} />
			</div>
		{/if}

		<div class="devlog-content mt-8" bind:this={contentEl}>
			{@html data.project.html}
		</div>
	</article>

	{#if hasToc}
		<aside class="hidden lg:sticky lg:top-20 lg:block">
			<TableOfContents toc={data.project.toc} />
		</aside>
	{/if}
	</div>

	{#if data.older || data.newer}
		<nav class="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-6" aria-label="Project navigation">
			<div>
				{#if data.older}
					<a href="/projects/{data.older.slug}" class="group block">
						<span class="flex items-center gap-1 text-xs uppercase tracking-wide text-dim">
							<ArrowLeft size={12} aria-hidden="true" /> Older
						</span>
						<span class="mt-1 block text-sm text-gray group-hover:text-primary">
							{data.older.name}
						</span>
					</a>
				{/if}
			</div>
			<div class="text-right">
				{#if data.newer}
					<a href="/projects/{data.newer.slug}" class="group block">
						<span class="flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-dim">
							Newer <ArrowRight size={12} aria-hidden="true" />
						</span>
						<span class="mt-1 block text-sm text-gray group-hover:text-primary">
							{data.newer.name}
						</span>
					</a>
				{/if}
			</div>
		</nav>
	{/if}

	{#if data.relatedPosts.length}
		<div class="mt-12 {hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-12' : ''}">
			<div class="lg:mx-auto lg:w-full lg:max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-wide text-dim">From the devlog</p>
				<ul class="mt-4 grid gap-2">
					{#each data.relatedPosts as post (post.slug)}
						<li>
							<a
								href="/devlog/{post.slug}"
								class="link group flex items-baseline justify-between gap-4 rounded-md border border-border px-4 py-2.5 transition-colors hover:border-primary"
							>
								<span class="truncate text-sm text-gray group-hover:text-primary">{post.title}</span>
								<span class="shrink-0 text-xs text-dim">
									{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if data.related.length}
		<div class="mt-12 {hasToc ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-12' : ''}">
			<div class="lg:mx-auto lg:w-full lg:max-w-2xl">
				<p class="text-xs font-semibold uppercase tracking-wide text-dim">More like this</p>
				<div class="mt-4 grid gap-4">
					{#each data.related as project (project.slug)}
						<ProjectCard {project} />
					{/each}
				</div>
			</div>
		</div>
	{/if}
</main>
