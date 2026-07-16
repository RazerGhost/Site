<script lang="ts">
	import type { ProjectMeta } from '$lib/server/projects';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';

	let { project }: { project: ProjectMeta } = $props();
</script>

<a
	href={`/projects/${project.slug}`}
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

	{#if project.tags.length}
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each project.tags as tag}
				<li class="chip rounded-full border border-border px-3 py-1 text-xs text-gray">
					{tag}
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
