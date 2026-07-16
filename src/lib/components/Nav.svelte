<script lang="ts">
	import { page } from '$app/state';
	import { navLinks } from '$lib/config';
	import Logo from '$lib/components/Logo.svelte';
</script>

<header
	class="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md"
>
	<nav class="mx-auto flex h-[72px] max-w-2xl items-center justify-between px-6">
		<a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-85">
			<Logo variant="outline" size={22} />
			<span class="text-sm font-bold tracking-tight text-white">RazerGhost</span>
		</a>
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
	</nav>
</header>
