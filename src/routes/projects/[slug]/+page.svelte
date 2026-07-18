<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import { site } from '$lib/config';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const shareUrl = $derived(`${site.url}/projects/${data.project.slug}`);
</script>

<Seo
	title="{data.project.name} — RazerGhost"
	description={data.project.description}
	path="/projects/{data.project.slug}"
	image={data.project.cover ?? `/projects/${data.project.slug}/og.png`}
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/projects" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
		<ArrowLeft size={15} aria-hidden="true" /> Projects
	</a>

	<article class="mt-4">
		{#if data.project.cover}
			<img
				src={data.project.cover}
				alt=""
				class="mb-8 aspect-video w-full rounded-lg object-cover"
			/>
		{/if}

		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-white">
			{data.project.name}
		</h1>
		<p class="mt-2 text-gray">{data.project.description}</p>

		{#if data.project.tags.length}
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each data.project.tags as tag}
					<li>
						<a
							href="/projects/tags/{tag}"
							class="chip rounded-full border border-border px-3 py-1 text-xs text-gray"
						>
							{tag}
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

		<div class="mt-6">
			<ShareButtons url={shareUrl} title={data.project.name} />
		</div>

		{#if data.project.toc.length > 1}
			<div class="mt-6">
				<TableOfContents toc={data.project.toc} />
			</div>
		{/if}

		<div class="devlog-content mt-8">
			{@html data.project.html}
		</div>
	</article>

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

	{#if data.related.length}
		<div class="mt-12">
			<p class="text-xs font-semibold uppercase tracking-wide text-dim">More like this</p>
			<div class="mt-4 grid gap-4">
				{#each data.related as project (project.slug)}
					<ProjectCard {project} />
				{/each}
			</div>
		</div>
	{/if}
</main>
