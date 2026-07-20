<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import X from '@lucide/svelte/icons/x';

	let {
		images,
		open = $bindable(false),
		index = $bindable(0)
	}: { images: string[]; open?: boolean; index?: number } = $props();

	function close() {
		open = false;
	}

	function prev() {
		index = (index - 1 + images.length) % images.length;
	}

	function next() {
		index = (index + 1) % images.length;
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowLeft' && images.length > 1) prev();
		else if (e.key === 'ArrowRight' && images.length > 1) next();
	}
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
		onclick={close}
		role="presentation"
	>
		<button
			type="button"
			aria-label="Close"
			onclick={close}
			class="absolute top-4 right-4 rounded-full border border-border bg-surface p-2 text-gray hover:text-primary"
		>
			<X size={18} aria-hidden="true" />
		</button>

		{#if images.length > 1}
			<button
				type="button"
				aria-label="Previous image"
				onclick={(e) => {
					e.stopPropagation();
					prev();
				}}
				class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-2 text-gray hover:text-primary"
			>
				<ArrowLeft size={18} aria-hidden="true" />
			</button>
			<button
				type="button"
				aria-label="Next image"
				onclick={(e) => {
					e.stopPropagation();
					next();
				}}
				class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-2 text-gray hover:text-primary"
			>
				<ArrowRight size={18} aria-hidden="true" />
			</button>
		{/if}

		<div onclick={(e) => e.stopPropagation()} role="presentation">
			<img
				src={images[index]}
				alt=""
				class="max-h-[85vh] max-w-full rounded-lg object-contain"
			/>
		</div>

		{#if images.length > 1}
			<p
				class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-dim"
			>
				{index + 1} / {images.length}
			</p>
		{/if}
	</div>
{/if}
