<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Projects editor — RazerGhost" description="Private projects editor." path="/notes/projects" noindex />

<main class="mx-auto max-w-3xl px-6 py-16">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
		<a
			href="/notes/projects/new"
			class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
		>
			New project
		</a>
	</div>
	<p class="mt-2 text-sm text-dim">
		Edits write straight to <code>src/content/projects</code> on this machine's disk — commit and
		push to actually publish.
	</p>

	<ul class="mt-8 divide-y divide-border">
		{#each data.entries as entry (entry.slug)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0">
					<a href="/notes/projects/{entry.slug}" class="link truncate font-medium text-white hover:text-primary">
						{entry.name}
					</a>
					<div class="mt-0.5 flex items-center gap-2 text-xs text-dim">
						<span>{entry.date}</span>
						{#if entry.draft}<span class="rounded-full bg-primary/10 px-2 py-0.5 text-primary">draft</span>{/if}
					</div>
				</div>
				<form
					method="POST"
					action="?/delete"
					onsubmit={(e) => {
						if (!confirm(`Delete "${entry.name}"?`)) e.preventDefault();
					}}
				>
					<input type="hidden" name="slug" value={entry.slug} />
					<button type="submit" class="link shrink-0 text-xs text-dim hover:text-red-400">Delete</button>
				</form>
			</li>
		{:else}
			<li class="py-6 text-sm text-dim">No projects yet.</li>
		{/each}
	</ul>
</main>
