<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let draftsOnly = $state(false);
	let pendingDelete = $state<{ slug: string; name: string } | null>(null);
	let confirmOpen = $state(false);
	let deleteForm: HTMLFormElement | undefined = $state();

	const filtered = $derived(
		data.entries.filter((entry) => {
			if (draftsOnly && !entry.draft) return false;
			if (!query.trim()) return true;
			return entry.name.toLowerCase().includes(query.trim().toLowerCase());
		})
	);
</script>

<Seo title="Projects editor — RazerGhost" description="Private projects editor." path="/admin/projects" noindex />

<main class="mx-auto max-w-3xl px-6 py-16">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
		<a
			href="/admin/projects/new"
			class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
		>
			New project
		</a>
	</div>
	<p class="mt-2 text-sm text-dim">
		Edits write straight to <code>src/content/projects</code> on this machine's disk — commit and
		push to actually publish.
	</p>

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<input
			type="search"
			bind:value={query}
			placeholder="Filter by name…"
			class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>
		<label class="flex items-center gap-2 text-sm text-gray">
			<input type="checkbox" bind:checked={draftsOnly} class="accent-primary" />
			Drafts only
		</label>
	</div>

	<ul class="mt-6 divide-y divide-border">
		{#each filtered as entry (entry.slug)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0">
					<a href="/admin/projects/{entry.slug}" class="link truncate font-medium text-white hover:text-primary">
						{entry.name}
					</a>
					<div class="mt-0.5 flex items-center gap-2 text-xs text-dim">
						<span>{entry.date}</span>
						{#if entry.draft}<span class="rounded-full bg-primary/10 px-2 py-0.5 text-primary">draft</span>{/if}
					</div>
				</div>
				<button
					type="button"
					onclick={() => {
						pendingDelete = { slug: entry.slug, name: entry.name };
						confirmOpen = true;
					}}
					class="link shrink-0 text-xs text-dim hover:text-red-400"
				>
					Delete
				</button>
			</li>
		{:else}
			<li class="py-6 text-sm text-dim">No projects match.</li>
		{/each}
	</ul>
</main>

<form method="POST" action="?/delete" bind:this={deleteForm} class="hidden">
	<input type="hidden" name="slug" value={pendingDelete?.slug ?? ''} />
</form>

<ConfirmDialog
	bind:open={confirmOpen}
	title={`Delete "${pendingDelete?.name ?? ''}"?`}
	onconfirm={() => deleteForm?.requestSubmit()}
/>
