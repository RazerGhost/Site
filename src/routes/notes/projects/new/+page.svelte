<script lang="ts">
	import { marked } from 'marked';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const today = new Date().toISOString().slice(0, 10);

	let body = $state(form?.body ?? '');
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);
</script>

<Seo title="New project — RazerGhost" description="Private projects editor." path="/notes/projects/new" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">New project</h1>

	<form method="POST" class="mt-8 flex flex-col gap-4">
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}

		<input
			type="text"
			name="name"
			placeholder="Name"
			value={form?.name ?? ''}
			required
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<textarea
			name="description"
			placeholder="Short description"
			rows="2"
			required
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			>{form?.description ?? ''}</textarea
		>

		<div class="flex gap-3">
			<input
				type="url"
				name="href"
				placeholder="Repo URL (optional)"
				value={form?.href ?? ''}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
			<input
				type="url"
				name="live"
				placeholder="Live URL (optional)"
				value={form?.live ?? ''}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</div>

		<div class="flex gap-3">
			<input
				type="date"
				name="date"
				value={form?.date ?? today}
				required
				class="rounded-lg border border-border bg-transparent px-4 py-2 text-white focus:border-primary focus:outline-none"
			/>
			<input
				type="text"
				name="tags"
				placeholder="Tags (comma separated)"
				value={form?.tags ?? ''}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</div>

		<input
			type="text"
			name="stack"
			placeholder="Tech stack (comma separated, optional)"
			value={form?.stack ?? ''}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<input
			type="text"
			name="cover"
			placeholder="Cover image path (optional)"
			value={form?.cover ?? ''}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<input
			type="text"
			name="images"
			placeholder="Gallery image paths (comma separated, optional)"
			value={form?.images ?? ''}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<div class="flex items-center gap-4">
			<select
				name="status"
				value={form?.status ?? 'active'}
				class="rounded-lg border border-border bg-transparent px-4 py-2 text-white focus:border-primary focus:outline-none"
			>
				<option value="active">Active</option>
				<option value="paused">Paused</option>
				<option value="archived">Archived</option>
			</select>
			<label class="flex items-center gap-2 text-sm text-gray">
				<input type="checkbox" name="featured" checked={form?.featured ?? false} />
				Featured
			</label>
		</div>

		<label class="flex items-center gap-2 text-sm text-gray">
			<input type="checkbox" name="draft" checked={form?.draft ?? false} class="accent-primary" />
			Draft (hidden from public list, RSS, sitemap — viewable via direct link)
		</label>

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
			rows="16"
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
				href="/notes/projects"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Cancel
			</a>
		</div>
	</form>
</main>
