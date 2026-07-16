<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const updated = 'July 16, 2026';

	const items = [
		'Rebuilding razerghost.xyz as a link hub + devlog (this site).',
		'Poking at whatever random project comes up next — check the devlog for specifics.'
	];
</script>

<svelte:head>
	<title>Status — RazerGhost</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Status</h1>
	<p class="mt-2 text-sm text-dim">Last updated {updated}</p>

	<div class="mt-6 grid gap-3">
		<DiscordPresence />
	</div>

	<ul class="mt-8 space-y-4">
		{#each items as item}
			<li class="flex gap-3 text-gray">
				<span class="mt-1 text-primary"><ArrowRight size={15} aria-hidden="true" /></span>
				<span>{item}</span>
			</li>
		{/each}
	</ul>

	<p class="mt-10 text-sm text-dim">
		A <a href="https://nownownow.com" class="link text-primary hover:opacity-85">now page</a>,
		if you're not sure what this is.
	</p>
</main>
