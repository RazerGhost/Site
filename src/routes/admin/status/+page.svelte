<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initialItems = untrack(() => (form?.items ?? data.items.join('\n')) as string);
</script>

<Seo title="Status editor — RazerGhost" description="Private status editor." path="/admin/status" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Edit status</h1>
	<p class="mt-2 text-sm text-dim">Shown in the "Right now" card on the <a href="/" class="link text-primary hover:underline">homepage</a>.</p>

	<form method="POST" class="mt-8 flex flex-col gap-4">
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<label class="flex flex-col gap-1 text-sm text-gray">
			Last updated
			<input
				type="text"
				name="updated"
				placeholder="e.g. July 16, 2026"
				value={form?.updated ?? data.updated}
				required
				class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm text-gray">
			Status items (one per line)
			<textarea
				name="items"
				rows="8"
				required
				class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
				>{initialItems}</textarea
			>
		</label>

		<div class="flex gap-3">
			<button
				type="submit"
				class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
			>
				Save
			</button>
			<a
				href="/"
				target="_blank"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				View live
			</a>
		</div>
	</form>
</main>
