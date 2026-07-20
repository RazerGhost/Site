<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import UploadCloud from '@lucide/svelte/icons/upload-cloud';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	let {
		onselect,
		onselectMultiple
	}: {
		onselect?: (url: string) => void;
		onselectMultiple?: (urls: string[]) => void;
	} = $props();

	// Single-pick mode (e.g. cover image): clicking a thumbnail selects it
	// immediately. Otherwise (bulk gallery picker, or the standalone /admin/media
	// explorer with no picker callback at all) thumbnails toggle a checkbox and
	// a bulk action bar appears.
	const multiMode = $derived(!onselect || Boolean(onselectMultiple));

	type MediaFile = { filename: string; url: string; size: number; uploadedAt: string };

	let files = $state<MediaFile[]>([]);
	let loading = $state(true);
	let uploading = $state(false);
	let error = $state('');
	let dragOver = $state(false);
	let pendingDelete = $state<MediaFile | null>(null);
	let confirmOpen = $state(false);
	let bulkConfirmOpen = $state(false);
	let selected = $state<Set<string>>(new Set());
	let fileInput: HTMLInputElement | undefined = $state();

	async function refresh() {
		loading = true;
		const res = await fetch('/api/media');
		if (res.ok) {
			const data = await res.json();
			files = data.files;
		}
		loading = false;
	}

	onMount(refresh);

	async function upload(fileList: FileList | File[]) {
		error = '';
		uploading = true;
		try {
			for (const file of Array.from(fileList)) {
				const body = new FormData();
				body.set('file', file);
				const res = await fetch('/api/media', { method: 'POST', body });
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data?.message ?? 'Upload failed');
				}
			}
			await refresh();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			uploading = false;
		}
	}

	function onFileInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files?.length) upload(input.files);
		input.value = '';
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (e.dataTransfer?.files.length) upload(e.dataTransfer.files);
	}

	function toggleSelected(filename: string) {
		const next = new Set(selected);
		if (next.has(filename)) next.delete(filename);
		else next.add(filename);
		selected = next;
	}

	function onThumbnailClick(file: MediaFile) {
		if (multiMode) toggleSelected(file.filename);
		else onselect?.(file.url);
	}

	function confirmSelection() {
		const urls = files.filter((f) => selected.has(f.filename)).map((f) => f.url);
		onselectMultiple?.(urls);
		selected = new Set();
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		await fetch(`/api/media/${pendingDelete.filename}`, { method: 'DELETE' });
		await refresh();
	}

	async function confirmBulkDelete() {
		for (const filename of selected) {
			await fetch(`/api/media/${filename}`, { method: 'DELETE' });
		}
		selected = new Set();
		await refresh();
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function copyUrl(url: string) {
		await navigator.clipboard.writeText(url);
	}
</script>

<div>
	<button
		type="button"
		ondrop={onDrop}
		ondragover={(e) => {
			e.preventDefault();
			dragOver = true;
		}}
		ondragleave={() => (dragOver = false)}
		onclick={() => fileInput?.click()}
		class="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm transition-colors {dragOver
			? 'border-primary bg-primary/5'
			: 'border-border text-dim hover:border-primary'}"
	>
		<UploadCloud size={20} aria-hidden="true" />
		{uploading ? 'Uploading…' : 'Drop images here, or click to choose files'}
		<span class="text-xs text-dim">PNG, JPEG, GIF, or WebP — up to 8MB</span>
	</button>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/png,image/jpeg,image/gif,image/webp"
		multiple
		class="hidden"
		onchange={onFileInputChange}
	/>

	{#if error}
		<p class="mt-2 text-sm text-red-400">{error}</p>
	{/if}

	{#if multiMode && selected.size > 0}
		<div class="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2">
			<span class="text-xs text-primary">{selected.size} selected</span>
			<div class="flex gap-2">
				{#if onselectMultiple}
					<button
						type="button"
						onclick={confirmSelection}
						class="link rounded-full border border-primary px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
					>
						Add {selected.size} image{selected.size === 1 ? '' : 's'}
					</button>
				{:else}
					<button
						type="button"
						onclick={() => (bulkConfirmOpen = true)}
						class="link rounded-full border border-border px-3 py-1 text-xs text-dim transition-colors hover:border-red-400 hover:text-red-400"
					>
						Delete {selected.size} selected
					</button>
				{/if}
				<button
					type="button"
					onclick={() => (selected = new Set())}
					class="link rounded-full border border-border px-3 py-1 text-xs text-dim transition-colors hover:text-white"
				>
					Clear
				</button>
			</div>
		</div>
	{/if}

	{#if loading}
		<p class="mt-6 text-sm text-dim">Loading…</p>
	{:else if files.length === 0}
		<p class="mt-6 text-sm text-dim">No uploads yet.</p>
	{:else}
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each files as file (file.filename)}
				{@const isSelected = selected.has(file.filename)}
				<div
					class="group relative overflow-hidden rounded-lg border {isSelected
						? 'border-primary'
						: 'border-border'}"
				>
					<button
						type="button"
						onclick={() => onThumbnailClick(file)}
						class="block aspect-square w-full cursor-pointer"
					>
						<img src={file.url} alt="" class="h-full w-full object-cover" />
					</button>
					{#if multiMode}
						<div
							class="pointer-events-none absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full border {isSelected
								? 'border-primary bg-primary text-black'
								: 'border-white/60 bg-black/40'}"
						>
							{#if isSelected}<Check size={12} aria-hidden="true" />{/if}
						</div>
					{/if}
					<div
						class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
					>
						<span class="truncate">{formatSize(file.size)}</span>
						<div class="flex shrink-0 gap-1">
							<button
								type="button"
								aria-label="Copy URL"
								onclick={() => copyUrl(file.url)}
								class="link rounded p-1 hover:text-primary"
							>
								<Copy size={12} aria-hidden="true" />
							</button>
							<button
								type="button"
								aria-label="Delete"
								onclick={() => {
									pendingDelete = file;
									confirmOpen = true;
								}}
								class="link rounded p-1 hover:text-red-400"
							>
								<Trash2 size={12} aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<ConfirmDialog bind:open={confirmOpen} title={`Delete "${pendingDelete?.filename ?? ''}"?`} onconfirm={confirmDelete} />
<ConfirmDialog
	bind:open={bulkConfirmOpen}
	title={`Delete ${selected.size} selected file${selected.size === 1 ? '' : 's'}?`}
	onconfirm={confirmBulkDelete}
/>
