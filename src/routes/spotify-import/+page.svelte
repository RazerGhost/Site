<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<Seo title="Import Spotify history — RazerGhost" description="Private import tool." path="/spotify-import" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/admin" class="link text-xs text-dim transition-colors hover:text-primary">← Admin</a>
	<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-white">Import Spotify history</h1>

	<div class="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-4">
		<div>
			<div class="text-xs text-dim">Total plays</div>
			<div class="mt-0.5 font-medium text-white">{data.totalPlays.toLocaleString()}</div>
		</div>
		<div>
			<div class="text-xs text-dim">Earliest</div>
			<div class="mt-0.5 font-medium text-white">{formatDate(data.firstPlayedAt)}</div>
		</div>
		<div>
			<div class="text-xs text-dim">Latest</div>
			<div class="mt-0.5 font-medium text-white">{formatDate(data.lastPlayedAt)}</div>
		</div>
		<div>
			<div class="text-xs text-dim">Pending scrobbles</div>
			<div class="mt-0.5 font-medium text-white">{data.pendingScrobbles.toLocaleString()}</div>
		</div>
	</div>
	{#if data.pendingScrobbles > 0}
		<p class="mt-2 text-xs text-dim">
			{data.pendingScrobbles} row{data.pendingScrobbles === 1 ? '' : 's'} were added by the live scrobbler
			with estimated play length — importing an export covering that date range replaces them with
			real data.
		</p>
	{/if}

	<p class="mt-6 text-gray">
		Upload the JSON files from Spotify's
		<a
			href="https://support.spotify.com/us/article/understanding-your-data/"
			target="_blank"
			rel="noreferrer"
			class="link text-primary hover:opacity-85"
		>
			extended streaming history export
		</a>
		 — <code class="text-xs text-dim">Streaming_History_Audio_*.json</code> (or older
		<code class="text-xs text-dim">endsong_*.json</code>). Re-uploading the same files is safe;
		duplicate plays are skipped automatically.
	</p>

	<form method="POST" enctype="multipart/form-data" class="mt-8 flex flex-col gap-4">
		{#if form && 'error' in form && form.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<input
			type="file"
			name="files"
			accept="application/json"
			multiple
			required
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
		/>

		<button
			type="submit"
			class="link self-start rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
		>
			Import
		</button>
	</form>

	{#if form?.results}
		{@const results = form.results}
		<div class="mt-8 rounded-lg border border-border p-4 text-sm">
			<p class="font-medium text-white">
				{form.totalInserted} new play{form.totalInserted === 1 ? '' : 's'} added
				({form.totalParsed} parsed across {results.length} file{results.length === 1 ? '' : 's'}).
			</p>
			{#if form.totalReplacedScrobbles > 0}
				<p class="mt-1 text-xs text-dim">
					Replaced {form.totalReplacedScrobbles} live-scrobbled play{form.totalReplacedScrobbles === 1
						? ''
						: 's'} with real data from this export.
				</p>
			{/if}
			<ul class="mt-3 flex flex-col gap-1 text-xs text-dim">
				{#each results as result}
					<li>
						{result.name} —
						{#if result.error}
							<span class="text-red-400">{result.error}</span>
						{:else}
							{result.inserted}/{result.parsed} new
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<p class="mt-8 text-sm">
		<a href="/listens" class="link text-primary hover:opacity-85">View the Listens page →</a>
	</p>
</main>
