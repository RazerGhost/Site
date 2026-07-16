<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';

	const projects = [
		{
			name: 'RazerGhost',
			description: 'This site — a personal link hub and devlog, built with SvelteKit.',
			href: 'https://github.com/RazerGhost/Site',
			live: 'https://razerghost.xyz'
		}
	];
</script>

<Seo title="Projects — RazerGhost" description="Things I've built." path="/projects" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Projects</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Things I've built, in progress or otherwise.</p>

	<div class="mt-10 grid gap-4">
		{#each projects as project, i}
			<a
				href={project.live ?? project.href}
				target="_blank"
				use:reveal
				style="transition-delay: {i * 60}ms"
				class="link group block rounded-lg border border-border p-5 transition-colors hover:border-primary"
			>
				<div class="flex items-center justify-between">
					<h2 class="font-semibold text-white">{project.name}</h2>
					<ArrowUpRight
						size={16}
						class="text-dim transition-colors group-hover:text-primary"
						aria-hidden="true"
					/>
				</div>
				<p class="mt-1.5 text-sm text-gray">{project.description}</p>
				<div class="mt-3 flex items-center gap-1.5 text-xs text-dim">
					<GithubIcon size={13} aria-hidden="true" />
					<span>{project.href.replace('https://github.com/', '')}</span>
				</div>
			</a>
		{/each}
	</div>

	<p class="mt-10 text-sm text-dim">More coming as I build things worth sharing.</p>
</main>
