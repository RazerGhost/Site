<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const title = $derived(form?.title ?? data.note.title);
	const body = $derived(form?.body ?? data.note.body);
</script>

<Seo title="{data.note.title} — RazerGhost" description="Private notes." path="/notes/{data.note.id}" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Edit note</h1>
	<p class="mt-2 text-xs text-dim">
		Last updated {new Date(data.note.updated_at).toLocaleString()}
	</p>

	<form method="POST" action="?/update" class="mt-8 flex flex-col gap-4">
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<input
			type="text"
			name="title"
			value={title}
			required
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>
		<textarea
			name="body"
			required
			rows="16"
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			>{body}</textarea
		>

		<div class="flex items-center justify-between">
			<div class="flex gap-3">
				<button
					type="submit"
					class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
				>
					Save
				</button>
				<a
					href="/notes"
					class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
				>
					Back
				</a>
			</div>
		</div>
	</form>

	<form method="POST" action="?/delete" class="mt-4">
		<button type="submit" class="link text-xs text-dim transition-colors hover:text-red-400">
			Delete this note
		</button>
	</form>
</main>
