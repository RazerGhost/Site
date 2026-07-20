<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import MediaLibrary from './MediaLibrary.svelte';

	let {
		open = $bindable(false),
		onselect,
		onselectMultiple
	}: {
		open?: boolean;
		onselect?: (url: string) => void;
		onselectMultiple?: (urls: string[]) => void;
	} = $props();

	function close() {
		open = false;
	}

	function select(url: string) {
		onselect?.(url);
		close();
	}

	function selectMultiple(urls: string[]) {
		onselectMultiple?.(urls);
		close();
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onclick={close} role="presentation">
		<div
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label="Media library"
			class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-5"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-medium text-white">Media library</h2>
				<button type="button" aria-label="Close" onclick={close} class="link text-dim hover:text-primary">
					<X size={18} aria-hidden="true" />
				</button>
			</div>
			<div class="mt-4">
				<MediaLibrary onselect={onselect ? select : undefined} onselectMultiple={onselectMultiple ? selectMultiple : undefined} />
			</div>
		</div>
	</div>
{/if}
