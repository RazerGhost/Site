<script lang="ts">
	import { page } from '$app/state';
	import { navLinks } from '$lib/config';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

	let mobileMenuOpen = $state(false);

	function closeMenu() {
		mobileMenuOpen = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeMenu();
	}
</script>

<svelte:window onkeydown={mobileMenuOpen ? onKeydown : undefined} />

<header class="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md">
	<nav class="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
		<a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-85" onclick={closeMenu}>
			<Logo variant="outline" size={22} />
			<span class="text-sm font-bold tracking-tight text-white">RazerGhost</span>
		</a>
		<div class="flex items-center gap-4">
			<ul class="hidden items-center gap-5 md:flex">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
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
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={mobileMenuOpen}
				class="flex items-center justify-center rounded-md border border-border p-1.5 text-gray transition-colors hover:border-primary hover:text-primary md:hidden"
			>
				{#if mobileMenuOpen}
					<X size={16} aria-hidden="true" />
				{:else}
					<Menu size={16} aria-hidden="true" />
				{/if}
			</button>
		</div>
	</nav>

	{#if mobileMenuOpen}
		<div class="border-t border-border px-6 py-4 md:hidden">
			<ul class="flex flex-col gap-1">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							onclick={closeMenu}
							aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
							class="block rounded-md px-2 py-2 text-sm transition-colors {page.url.pathname.startsWith(
								link.href
							)
								? 'text-primary'
								: 'text-gray hover:text-primary'}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>
