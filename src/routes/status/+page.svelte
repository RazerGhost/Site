<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import GithubActivity from '$lib/components/GithubActivity.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { statusUpdated, statusItems } from '$lib/status';
</script>

<Seo title="Status — RazerGhost" description="What I'm up to right now." path="/status" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white">Status</h1>
	<p class="mt-2 text-sm text-dim">Last updated {statusUpdated}</p>

	<div class="mt-6 grid gap-3">
		<DiscordPresence />
	</div>

	<ul class="mt-8 space-y-4">
		{#each statusItems as item}
			<li class="flex gap-3 text-gray">
				<span class="mt-1 text-primary"><ArrowRight size={15} aria-hidden="true" /></span>
				<span>{item}</span>
			</li>
		{/each}
	</ul>

	<section class="mt-12">
		<h2 class="text-lg font-semibold text-white">Recently on GitHub</h2>
		<div class="mt-4">
			<GithubActivity />
		</div>
	</section>
</main>
