<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="Projects — RazerGhost" description="Things I've built." path="/projects" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Projects</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Things I've built, in progress or otherwise.</p>

	<div class="mt-10 grid gap-4" use:reveal>
		{#each data.projects as project, i}
			<div style="transition-delay: {i * 60}ms">
				<ProjectCard {project} />
			</div>
		{:else}
			<p class="text-sm text-dim">Nothing here yet.</p>
		{/each}
	</div>

	<p class="mt-10 text-sm text-dim">More coming as I build things worth sharing.</p>
</main>
