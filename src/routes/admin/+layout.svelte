<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let { children } = $props();

	const isDashboard = $derived(page.url.pathname === '/admin');
</script>

{#if !isDashboard}
	<div class="border-b border-border">
		<div class="mx-auto flex max-w-4xl items-center gap-2 px-6 py-3 text-sm">
			<a href="/admin" class="link flex items-center gap-1.5 text-dim transition-colors hover:text-primary">
				<ArrowLeft size={14} aria-hidden="true" />
				Admin
			</a>
		</div>
	</div>
{/if}

{@render children()}
