<script lang="ts">
	import type { DevlogMeta } from '$lib/server/devlog';

	let {
		entry,
		seriesInfo
	}: { entry: DevlogMeta; seriesInfo?: { part: number; total: number } } = $props();

	const formattedDate = $derived(
		new Date(entry.date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<a
	href={`/devlog/${entry.slug}`}
	class="card card--interactive group block rounded-lg border border-border bg-surface p-6"
>
	{#if entry.cover}
		<img src={entry.cover} alt="" class="mb-4 aspect-video w-full rounded-md object-cover" />
	{/if}

	<p class="text-xs uppercase tracking-wide text-dim">
		{formattedDate} · {entry.readingTime} min read
	</p>
	{#if entry.series && seriesInfo}
		<p class="mt-1 text-xs font-medium text-primary">
			{entry.series} · Part {seriesInfo.part} of {seriesInfo.total}
		</p>
	{/if}
	<h3 class="mt-2 text-lg font-semibold text-white group-hover:text-primary">
		{entry.title}
	</h3>
	<p class="mt-2 text-sm leading-relaxed text-gray">{entry.excerpt}</p>

	{#if entry.tags.length}
		<ul class="mt-4 flex flex-wrap gap-2">
			{#each entry.tags as tag}
				<li
					class="chip rounded-full border border-border px-3 py-1 text-xs text-gray"
				>
					{tag}
				</li>
			{/each}
		</ul>
	{/if}
</a>
