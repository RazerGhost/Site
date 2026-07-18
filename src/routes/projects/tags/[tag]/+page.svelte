<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { reveal } from '$lib/actions/reveal';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="#{data.tag} — Projects — RazerGhost"
	description="Projects tagged {data.tag}."
	path="/projects/tags/{data.tag}"
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/projects" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
		<ArrowLeft size={15} aria-hidden="true" /> Projects
	</a>

	<h1 class="mt-4 text-3xl font-extrabold tracking-tight text-white">#{data.tag}</h1>
	<p class="mt-2 text-gray">
		{data.projects.length}
		{data.projects.length === 1 ? 'project' : 'projects'} tagged &ldquo;{data.tag}&rdquo;.
	</p>

	{#if data.allTags.length > 1}
		<ul class="mt-6 flex flex-wrap gap-2">
			{#each data.allTags as tag}
				<li>
					<a
						href="/projects/tags/{tag}"
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
		{#each data.projects as project (project.slug)}
			<ProjectCard {project} />
		{:else}
			<p class="text-sm text-dim">No projects with this tag.</p>
		{/each}
	</div>
</main>
