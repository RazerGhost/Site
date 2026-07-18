<script lang="ts">
	import { marked } from 'marked';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let body = $state(form?.body ?? '');
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);
</script>

<Seo title="New note — RazerGhost" description="Private notes." path="/notes/new" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">New note</h1>

	<form method="POST" class="mt-8 flex flex-col gap-4">
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<input
			type="text"
			name="title"
			placeholder="Title"
			value={form?.title ?? ''}
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
			placeholder="Write something..."
			required
			rows="12"
			hidden={mode === 'preview'}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		></textarea>
		{#if mode === 'preview'}
			<div class="devlog-content rounded-lg border border-border px-4 py-2">
				{@html previewHtml}
			</div>
		{/if}

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
				Cancel
			</a>
		</div>
	</form>
</main>
