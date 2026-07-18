<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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
					<li class="chip rounded-full border border-border px-3 py-1 text-xs text-gray">
						{tag}
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

		<div class="devlog-content mt-8">
			{@html data.project.html}
		</div>
	</article>
</main>
