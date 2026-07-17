<script lang="ts">
	import { page } from '$app/state';
	import { navLinks } from '$lib/config';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
</script>

<header
	class="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md"
>
	<nav class="mx-auto flex h-[72px] max-w-2xl items-center justify-between px-6">
		<a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-85">
			<Logo variant="outline" size={22} />
			<span class="text-sm font-bold tracking-tight text-white">RazerGhost</span>
		</a>
		<div class="flex items-center gap-4">
			<ul class="flex items-center gap-5">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="text-sm transition-colors {page.url.pathname.startsWith(link.href)
								? 'text-primary'
								: 'text-gray hover:text-primary'}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
			<button
				type="button"
				onclick={() => (commandPalette.open = true)}
				aria-label="Open command palette"
				class="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-dim transition-colors hover:border-primary hover:text-primary sm:flex"
			>
				<Search size={13} aria-hidden="true" />
				<kbd class="font-sans">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
			</button>
			<ThemeToggle />
		</div>
	</nav>
</header>
