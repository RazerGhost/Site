<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Notes — RazerGhost" description="Private notes." path="/notes" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Notes</h1>
		<a
			href="/notes/new"
			class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
		>
			New note
		</a>
	</div>

	{#if data.notes.length === 0}
		<p class="mt-8 text-gray">No notes yet.</p>
	{:else}
		<ul class="mt-8 space-y-3">
			{#each data.notes as note (note.id)}
				<li class="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
					<a href="/notes/{note.id}" class="link min-w-0 flex-1 truncate text-white">
						{note.title}
					</a>
					<span class="shrink-0 text-xs text-dim">
						{new Date(note.updated_at).toLocaleDateString()}
					</span>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={note.id} />
						<button type="submit" class="shrink-0 text-xs text-dim transition-colors hover:text-red-400">
							Delete
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</main>
