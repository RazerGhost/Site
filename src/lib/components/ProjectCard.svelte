<script lang="ts">
	import type { ProjectMeta } from '$lib/server/projects';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';

	let { project, featured = false }: { project: ProjectMeta; featured?: boolean } = $props();

	const badges = $derived(project.stack.length ? project.stack : project.tags);
</script>

<a
	href={`/projects/${project.slug}`}
	class="link group block rounded-lg border p-5 transition-colors hover:border-primary {featured
		? 'border-primary/50'
		: 'border-border'}"
>
	{#if project.cover}
		<img src={project.cover} alt="" class="mb-4 aspect-video w-full rounded-md object-cover" />
	{/if}

	<div class="flex items-center justify-between gap-2">
		<h2 class="font-semibold text-white">{project.name}</h2>
		<div class="flex shrink-0 items-center gap-2">
			{#if project.status !== 'active'}
				<span class="chip rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-dim">
					{project.status}
				</span>
			{/if}
			<ArrowUpRight
				size={16}
				class="text-dim transition-colors group-hover:text-primary"
				aria-hidden="true"
			/>
		</div>
	</div>
	<p class="mt-1.5 text-sm text-gray">{project.description}</p>

	{#if badges.length}
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each badges as badge}
				<li class="chip rounded-full border border-border px-3 py-1 text-xs text-gray">
					{badge}
				</li>
			{/each}
		</ul>
	{/if}

	{#if project.href}
		<div class="mt-3 flex items-center gap-1.5 text-xs text-dim">
			<GithubIcon size={13} aria-hidden="true" />
			<span>{project.href.replace('https://github.com/', '')}</span>
		</div>
	{/if}
</a>
