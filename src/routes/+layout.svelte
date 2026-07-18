<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import SpotifyWidget from '$lib/components/SpotifyWidget.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// The notes graph is a full-bleed app view with its own canvas, dock, and
	// jump-to-note palette — the marketing nav/footer chrome doesn't fit a
	// fixed-viewport canvas (it pushed total page height past 100vh, causing
	// the whole page to scroll instead of just the canvas), and the global
	// command palette's Ctrl+K would otherwise fight the notes page's own.
	const isFullBleed = $derived(page.url.pathname === '/notes');
</script>

{#if isFullBleed}
	<div class="h-screen bg-bg text-white">
		{@render children()}
	</div>
{:else}
	<div class="relative flex min-h-screen flex-col bg-bg text-white">
		<div class="bg-glow" aria-hidden="true"></div>
		<Nav />
		<div class="relative flex-1">
			{@render children()}
		</div>
		<Footer />
		<BackToTop />
		<SpotifyWidget />
		<CommandPalette entries={data.commandPaletteEntries} />
	</div>
{/if}
