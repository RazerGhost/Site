<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import { gearGroups } from '$lib/config';
	import Code2 from '@lucide/svelte/icons/code-2';
	import Layers from '@lucide/svelte/icons/layers';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Cpu from '@lucide/svelte/icons/cpu';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Headphones from '@lucide/svelte/icons/headphones';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Video from '@lucide/svelte/icons/video';

	const icons = {
		code: Code2,
		layers: Layers,
		wrench: Wrench,
		cpu: Cpu,
		keyboard: Keyboard,
		headphones: Headphones,
		gamepad: Gamepad2,
		video: Video
	};
</script>

<Seo title="Gear — RazerGhost" description="Tools and gear in regular rotation." path="/gear" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Gear</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Tools and gear in regular rotation.</p>

	<div class="mt-10 grid gap-8">
		{#each gearGroups as group, i}
			{@const Icon = icons[group.icon]}
			<section use:reveal style="transition-delay: {i * 60}ms">
				<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
					<Icon size={13} aria-hidden="true" />
					{group.label}
				</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each group.items as item}
						<li
							class="chip inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-gray"
						>
							<Icon size={13} class="text-dim" aria-hidden="true" />
							{item}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</main>
