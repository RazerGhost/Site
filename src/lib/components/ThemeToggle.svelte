<script lang="ts">
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';

	function currentTheme(): 'light' | 'dark' {
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') return stored;
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	}

	let theme = $state<'light' | 'dark'>('dark');

	$effect(() => {
		theme = currentTheme();
	});

	function toggle() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('theme', theme);
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
	class="grid h-8 w-8 place-items-center rounded-full text-gray transition-colors hover:text-primary"
>
	{#if theme === 'light'}
		<Moon size={16} aria-hidden="true" />
	{:else}
		<Sun size={16} aria-hidden="true" />
	{/if}
</button>
