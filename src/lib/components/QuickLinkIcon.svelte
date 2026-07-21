<script lang="ts">
	import { QUICK_LINK_ICONS } from './quick-link-icons';

	// `icon` is either a name from QUICK_LINK_ICONS (picked via the modal's
	// icon grid) or, for quick links saved before that existed, a raw emoji
	// string — render whichever it turns out to be, nothing if neither.
	let { icon, size = 14 }: { icon: string | null; size?: number } = $props();
	const Icon = $derived(icon ? QUICK_LINK_ICONS[icon] : undefined);
</script>

{#if Icon}
	<Icon {size} aria-hidden="true" />
{:else if icon}
	<span aria-hidden="true" style="font-size: {size}px; line-height: 1;">{icon}</span>
{/if}
