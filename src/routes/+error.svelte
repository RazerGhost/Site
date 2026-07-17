<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const isNotFound = $derived(page.status === 404);
</script>

<Seo
	title="{isNotFound ? 'Page not found' : `Error ${page.status}`} — RazerGhost"
	description="This page doesn't exist."
	path={page.url.pathname}
	noindex
/>

<main class="mx-auto max-w-2xl px-6 py-16">
	<section class="flex flex-col items-center py-16 text-center">
		<div class="relative flex h-24 w-24 items-center justify-center" data-hero-reveal="0">
			<div class="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true"></div>
			<Logo variant="mark" size={96} />
		</div>

		<p class="mt-6 text-xs font-semibold tracking-wide text-dim uppercase" data-hero-reveal="1">
			Error {page.status}
		</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="2">
			{isNotFound ? "There's nothing here" : 'Something broke'}
		</h1>
		<p class="mt-3 max-w-sm text-gray" data-hero-reveal="3">
			{isNotFound
				? 'The ghost moved on, or this link never existed. Try the command palette, or head back home.'
				: (page.error?.message ?? 'An unexpected error occurred.')}
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3" data-hero-reveal="3">
			<a
				href="/"
				class="link flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				<ArrowLeft size={15} aria-hidden="true" /> Back home
			</a>
			<a
				href="/devlog"
				class="link flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Devlog
			</a>
		</div>
	</section>
</main>
