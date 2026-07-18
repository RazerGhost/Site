<script lang="ts">
	import { marked } from 'marked';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const title = $derived(form?.title ?? data.note.title);
	let body = $state(form?.body ?? data.note.body);
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);
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
		<div class="flex gap-1 text-xs">
			<button
				type="button"
				onclick={() => (mode = 'write')}
				class="rounded-full px-3 py-1 transition-colors {mode === 'write'
					? 'bg-primary/10 text-primary'
					: 'text-dim hover:text-white'}"
			>
				Write
			</button>
			<button
				type="button"
				onclick={() => (mode = 'preview')}
				class="rounded-full px-3 py-1 transition-colors {mode === 'preview'
					? 'bg-primary/10 text-primary'
					: 'text-dim hover:text-white'}"
			>
				Preview
			</button>
		</div>

		<textarea
			name="body"
			bind:value={body}
			required
			rows="16"
			hidden={mode === 'preview'}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		></textarea>
		{#if mode === 'preview'}
			<div class="devlog-content rounded-lg border border-border px-4 py-2">
				{@html previewHtml}
			</div>
		{/if}

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
