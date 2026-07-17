<script lang="ts">
	import Link2 from '@lucide/svelte/icons/link-2';
	import SiX from '@icons-pack/svelte-simple-icons/icons/SiX';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';

	let { url, title }: { url: string; title: string } = $props();

	let copied = $state(false);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// clipboard API unavailable (e.g. insecure context) — nothing to fall back to
		}
	}

	const xHref = $derived(
		`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
	);
	const linkedinHref = $derived(
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
	);
</script>

<div class="flex items-center gap-2">
	<span class="text-xs uppercase tracking-wide text-dim">Share</span>
	<button
		type="button"
		onclick={copyLink}
		aria-label="Copy link"
		class="grid h-8 w-8 place-items-center rounded-full border border-border text-gray transition-colors hover:border-primary hover:text-primary"
	>
		<Link2 size={14} aria-hidden="true" />
	</button>
	<a
		href={xHref}
		target="_blank"
		rel="noopener noreferrer"
		aria-label="Share on X"
		class="grid h-8 w-8 place-items-center rounded-full border border-border text-gray transition-colors hover:border-primary hover:text-primary"
	>
		<SiX size={13} aria-hidden="true" />
	</a>
	<a
		href={linkedinHref}
		target="_blank"
		rel="noopener noreferrer"
		aria-label="Share on LinkedIn"
		class="grid h-8 w-8 place-items-center rounded-full border border-border text-gray transition-colors hover:border-primary hover:text-primary"
	>
		<LinkedinIcon size={13} />
	</a>
	{#if copied}
		<span class="text-xs text-primary">Copied!</span>
	{/if}
</div>
