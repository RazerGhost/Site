<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}
</script>

<Seo title="Watchlist cache — RazerGhost" description="Private Simkl cache inspector." path="/notes/watchlist-cache" noindex />

<main class="mx-auto max-w-4xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Watchlist cache</h1>
	<p class="mt-2 text-sm text-dim">
		Cached genre/synopsis/runtime lookups backing the Watchlist page's per-title enrichment.
		{#if !data.configured}
			<span class="text-red-400">Simkl isn't configured, so refresh will fail.</span>
		{/if}
	</p>

	<div class="mt-8 overflow-x-auto rounded-lg border border-border">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-border text-xs text-dim">
				<tr>
					<th class="px-4 py-2 font-medium">Title</th>
					<th class="px-4 py-2 font-medium">Type</th>
					<th class="px-4 py-2 font-medium">Genres</th>
					<th class="px-4 py-2 font-medium">Runtime</th>
					<th class="px-4 py-2 font-medium">Fetched</th>
					<th class="px-4 py-2 font-medium"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each data.entries as entry (entry.simklId + ':' + entry.mediaType)}
					<tr>
						<td class="max-w-[16rem] truncate px-4 py-2 text-white">{entry.title}</td>
						<td class="px-4 py-2 text-dim">{entry.mediaType}</td>
						<td class="max-w-[14rem] truncate px-4 py-2 text-dim">{entry.genres.join(', ') || '—'}</td>
						<td class="px-4 py-2 text-dim">{entry.runtime ? `${entry.runtime}m` : '—'}</td>
						<td class="px-4 py-2 text-dim">{formatDate(entry.fetchedAt)}</td>
						<td class="px-4 py-2">
							<form method="POST" action="?/refresh">
								<input type="hidden" name="simklId" value={entry.simklId} />
								<input type="hidden" name="mediaType" value={entry.mediaType} />
								<button type="submit" class="link text-xs text-primary hover:opacity-85">Refresh</button>
							</form>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-4 py-6 text-center text-dim">No cached entries yet.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
