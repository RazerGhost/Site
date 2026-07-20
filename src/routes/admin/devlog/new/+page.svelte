<script lang="ts">
	import { marked } from 'marked';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import MediaPicker from '$lib/components/MediaPicker.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const today = new Date().toISOString().slice(0, 10);

	let body = $state(untrack(() => form?.body ?? ''));
	let cover = $state(untrack(() => form?.cover ?? ''));
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);

	let saving = $state(false);
	let coverPickerOpen = $state(false);
	let bodyTextareaEl: HTMLTextAreaElement | undefined = $state();

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

<Seo title="New devlog post — RazerGhost" description="Private devlog editor." path="/admin/devlog/new" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">New devlog post</h1>

	<form
		method="POST"
		class="mt-8 flex flex-col gap-4"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
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
				name="series"
				placeholder="Series (optional)"
				value={form?.series ?? ''}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</div>

		<input
			type="text"
			name="tags"
			placeholder="Tags (comma separated)"
			value={form?.tags ?? ''}
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
			>{form?.excerpt ?? ''}</textarea
		>

		<label class="flex items-center gap-2 text-sm text-gray">
			<input type="checkbox" name="draft" checked={form?.draft ?? true} class="accent-primary" />
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
			placeholder="Write something..."
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
				href="/admin/devlog"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Cancel
			</a>
		</div>
	</form>
</main>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
