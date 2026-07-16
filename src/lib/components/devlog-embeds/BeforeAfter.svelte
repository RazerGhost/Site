<script lang="ts">
	interface Props {
		before?: string;
		after?: string;
	}

	let { before = '', after = '' }: Props = $props();

	let position = $state(50);
</script>

<div class="card rounded-lg border border-border bg-surface p-4">
	{#if before && after}
		<div class="relative aspect-video w-full overflow-hidden rounded-md select-none">
			<img src={after} alt="after" class="absolute inset-0 h-full w-full object-cover" />
			<div
				class="absolute inset-0 h-full overflow-hidden"
				style="width: {position}%"
			>
				<img src={before} alt="before" class="h-full w-full max-w-none object-cover" />
			</div>
			<div
				class="absolute inset-y-0 w-0.5 bg-primary"
				style="left: {position}%"
				aria-hidden="true"
			></div>
		</div>
		<input
			type="range"
			min="0"
			max="100"
			bind:value={position}
			class="mt-3 w-full accent-[var(--color-primary)]"
			aria-label="Before/after comparison slider"
		/>
	{:else}
		<p class="text-xs text-dim">before/after embed needs `before` and `after` image URLs</p>
	{/if}
</div>
