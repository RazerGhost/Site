<script lang="ts">
	import { marked } from 'marked';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import MediaPicker from '$lib/components/MediaPicker.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let body = $state(untrack(() => form?.body ?? data.body));
	let cover = $state(untrack(() => form?.cover ?? data.cover));
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);

	let saving = $state(false);
	let saved = $state(false);
	let confirmingDelete = $state(false);
	let savedTimeout: ReturnType<typeof setTimeout> | undefined;
	let coverPickerOpen = $state(false);
	let bodyTextareaEl: HTMLTextAreaElement | undefined = $state();

	function flashSaved() {
		saved = true;
		clearTimeout(savedTimeout);
		savedTimeout = setTimeout(() => (saved = false), 3000);
	}

	async function insertImage(file: File) {
		const fd = new FormData();
		fd.set('file', file);
		const res = await fetch('/api/media', { method: 'POST', body: fd });
		if (!res.ok) return;
		const { url } = await res.json();
		const markdown = `![](${url})`;
		if (bodyTextareaEl) {
			const start = bodyTextareaEl.selectionStart ?? body.length;
			const end = bodyTextareaEl.selectionEnd ?? body.length;
			body = body.slice(0, start) + markdown + body.slice(end);
		} else {
			body += markdown;
		}
	}

	function onBodyPaste(e: ClipboardEvent) {
		const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
		if (!item) return;
		e.preventDefault();
		const file = item.getAsFile();
		if (file) insertImage(file);
	}

	function onBodyDrop(e: DragEvent) {
		const file = [...(e.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
		if (!file) return;
		e.preventDefault();
		insertImage(file);
	}
</script>

<Seo title="Edit {data.title} — RazerGhost" description="Private devlog editor." path="/admin/devlog/{data.slug}" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Edit post</h1>

	<form
		method="POST"
		action="?/update"
		class="mt-8 flex flex-col gap-4"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				await update();
				saving = false;
				if (result.type === 'redirect') flashSaved();
			};
		}}
	>
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}
		{#if saved}
			<p class="text-sm text-primary">Saved to disk. Commit + push in this repo to publish.</p>
		{/if}

		<input
			type="text"
			name="title"
			placeholder="Title"
			value={form?.title ?? data.title}
			required
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<div class="flex gap-3">
			<input
				type="date"
				name="date"
				value={form?.date ?? data.date}
				required
				class="rounded-lg border border-border bg-transparent px-4 py-2 text-white focus:border-primary focus:outline-none"
			/>
			<input
				type="text"
				name="series"
				placeholder="Series (optional)"
				value={form?.series ?? data.series}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</div>

		<input
			type="text"
			name="tags"
			placeholder="Tags (comma separated)"
			value={form?.tags ?? data.tags}
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>

		<div class="flex gap-2">
			<input
				type="text"
				name="cover"
				placeholder="Cover image path (optional)"
				bind:value={cover}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
			<button
				type="button"
				onclick={() => (coverPickerOpen = true)}
				class="link shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Browse…
			</button>
		</div>

		<textarea
			name="excerpt"
			placeholder="Excerpt"
			rows="2"
			class="rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			>{form?.excerpt ?? data.excerpt}</textarea
		>

		<label class="flex items-center gap-2 text-sm text-gray">
			<input type="checkbox" name="draft" checked={form?.draft ?? data.draft} class="accent-primary" />
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
			bind:this={bodyTextareaEl}
			bind:value={body}
			onpaste={onBodyPaste}
			ondrop={onBodyDrop}
			ondragover={(e) => e.preventDefault()}
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

		<div class="flex gap-3">
			<button
				type="submit"
				disabled={saving}
				class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<a
				href="/devlog/{data.slug}"
				target="_blank"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				View live
			</a>
			<a
				href="/admin/devlog"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Cancel
			</a>
		</div>
	</form>

	<form method="POST" action="?/delete" class="mt-8" id="delete-form">
		<button
			type="button"
			onclick={() => (confirmingDelete = true)}
			class="link text-xs text-dim hover:text-red-400"
		>
			Delete this post
		</button>
	</form>
</main>

<ConfirmDialog
	bind:open={confirmingDelete}
	title={`Delete "${data.title}"?`}
	onconfirm={() => (document.getElementById('delete-form') as HTMLFormElement).requestSubmit()}
/>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
