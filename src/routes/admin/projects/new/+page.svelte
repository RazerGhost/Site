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
	let images = $state(untrack(() => form?.images ?? ''));
	let mode = $state<'write' | 'preview'>('write');
	const previewHtml = $derived(marked.parse(body, { async: false }) as string);

	let saving = $state(false);
	let coverPickerOpen = $state(false);
	let galleryPickerOpen = $state(false);
	let bodyTextareaEl: HTMLTextAreaElement | undefined = $state();

	function addGalleryImages(urls: string[]) {
		if (urls.length === 0) return;
		images = images ? `${images}, ${urls.join(', ')}` : urls.join(', ');
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

<Seo title="New project — RazerGhost" description="Private projects editor." path="/admin/projects/new" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">New project</h1>

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

		<div class="flex gap-2">
			<input
				type="text"
				name="images"
				placeholder="Gallery image paths (comma separated, optional)"
				bind:value={images}
				class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
			<button
				type="button"
				onclick={() => (galleryPickerOpen = true)}
				class="link shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Add image…
			</button>
		</div>

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
			bind:this={bodyTextareaEl}
			bind:value={body}
			onpaste={onBodyPaste}
			ondrop={onBodyDrop}
			ondragover={(e) => e.preventDefault()}
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
				disabled={saving}
				class="link rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<a
				href="/admin/projects"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Cancel
			</a>
		</div>
	</form>
</main>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
<MediaPicker bind:open={galleryPickerOpen} onselectMultiple={addGalleryImages} />
