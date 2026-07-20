<script lang="ts">
	let {
		open = $bindable(false),
		title,
		confirmLabel = 'Delete',
		onconfirm
	}: {
		open?: boolean;
		title: string;
		confirmLabel?: string;
		onconfirm: () => void;
	} = $props();

	function cancel() {
		open = false;
	}

	function confirm() {
		open = false;
		onconfirm();
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') cancel();
	}
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		onclick={cancel}
		role="presentation"
	>
		<div
			onclick={(e) => e.stopPropagation()}
			role="alertdialog"
			aria-modal="true"
			aria-label={title}
			class="w-full max-w-sm rounded-lg border border-border bg-surface p-5"
		>
			<p class="text-sm text-white">{title}</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					onclick={cancel}
					class="link rounded-full border border-border px-4 py-1.5 text-xs text-gray transition-colors hover:border-primary hover:text-primary"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirm}
					class="link rounded-full border border-red-400/60 px-4 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-400/10"
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
