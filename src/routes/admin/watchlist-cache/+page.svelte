<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let bulkRefreshing = $state(false);
	const missingCount = $derived(data.entries.filter((entry) => entry.runtime == null).length);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}

	let query = $state('');
	type SortKey = 'title' | 'mediaType' | 'fetchedAt';
	let sortKey = $state<SortKey>('fetchedAt');
	let sortDesc = $state(true);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDesc = !sortDesc;
		} else {
			sortKey = key;
			sortDesc = false;
		}
	}

	const filtered = $derived(
		data.entries
			.filter((entry) => !query.trim() || entry.title.toLowerCase().includes(query.trim().toLowerCase()))
			.slice()
			.sort((a, b) => {
				const dir = sortDesc ? -1 : 1;
				return a[sortKey] < b[sortKey] ? -1 * dir : a[sortKey] > b[sortKey] ? 1 * dir : 0;
			})
	);
</script>

<Seo title="Watchlist cache — RazerGhost" description="Private Simkl cache inspector." path="/admin/watchlist-cache" noindex />

<main class="mx-auto max-w-4xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Watchlist cache</h1>
	<p class="mt-2 text-sm text-dim">
		Cached genre/synopsis/runtime lookups backing the Watchlist page's per-title enrichment.
		{#if !data.configured}
			<span class="text-red-400">Simkl isn't configured, so refresh will fail.</span>
		{/if}
	</p>

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<form
			method="POST"
			action="?/refreshMissing"
			use:enhance={() => {
				bulkRefreshing = true;
				return async ({ update }) => {
					await update();
					bulkRefreshing = false;
				};
			}}
		>
			<button
				type="submit"
				disabled={bulkRefreshing || missingCount === 0 || !data.configured}
				class="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
			>
				{bulkRefreshing ? 'Refreshing…' : `Refresh all missing runtimes (${missingCount})`}
			</button>
		</form>
		{#if form?.bulk}
			<p class="text-xs text-dim">
				{form.filled} of {form.total} now have a runtime.
				{#if form.stillMissing}
					{form.stillMissing} still have none — Simkl itself has no runtime data for {form.stillMissing === 1 ? 'that title' : 'those titles'}.
				{/if}
				{#if form.failed}
					{form.failed} fetch{form.failed === 1 ? '' : 'es'} failed.
				{/if}
			</p>
		{/if}
	</div>

	<input
		type="search"
		bind:value={query}
		placeholder="Filter by title…"
		class="mt-6 w-full rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none sm:max-w-xs"
	/>

	<div class="mt-4 overflow-x-auto rounded-lg border border-border">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-border text-xs text-dim">
				<tr>
					<th class="sticky left-0 bg-bg px-4 py-2 font-medium">
						<button type="button" onclick={() => toggleSort('title')} class="link hover:text-white">
							Title{sortKey === 'title' ? (sortDesc ? ' ↓' : ' ↑') : ''}
						</button>
					</th>
					<th class="px-4 py-2 font-medium">
						<button type="button" onclick={() => toggleSort('mediaType')} class="link hover:text-white">
							Type{sortKey === 'mediaType' ? (sortDesc ? ' ↓' : ' ↑') : ''}
						</button>
					</th>
					<th class="px-4 py-2 font-medium">Genres</th>
					<th class="px-4 py-2 font-medium">Runtime</th>
					<th class="px-4 py-2 font-medium">
						<button type="button" onclick={() => toggleSort('fetchedAt')} class="link hover:text-white">
							Fetched{sortKey === 'fetchedAt' ? (sortDesc ? ' ↓' : ' ↑') : ''}
						</button>
					</th>
					<th class="px-4 py-2 font-medium"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each filtered as entry (entry.simklId + ':' + entry.mediaType)}
					<tr>
						<td class="sticky left-0 max-w-[16rem] truncate bg-bg px-4 py-2 text-white">{entry.title}</td>
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
						<td colspan="6" class="px-4 py-6 text-center text-dim">No cached entries match.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
