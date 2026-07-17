<script lang="ts">
	import type { TocEntry } from '$lib/server/devlog';

	let { toc }: { toc: TocEntry[] } = $props();
</script>

{#if toc.length > 1}
	<nav class="card rounded-lg border border-border bg-surface p-4" aria-label="Table of contents">
		<p class="text-xs font-semibold uppercase tracking-wide text-dim">On this page</p>
		<ul class="mt-3 space-y-2 text-sm">
			{#each toc as heading}
				<li class={heading.level === 3 ? 'pl-4' : ''}>
					<a href="#{heading.id}" class="text-gray transition-colors hover:text-primary">
						{heading.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
