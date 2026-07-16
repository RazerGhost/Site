<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import Code2 from '@lucide/svelte/icons/code-2';
	import Layers from '@lucide/svelte/icons/layers';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Cpu from '@lucide/svelte/icons/cpu';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Headphones from '@lucide/svelte/icons/headphones';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Video from '@lucide/svelte/icons/video';

	const groups = [
		{
			label: 'Editor',
			icon: Code2,
			items: ['Zed', 'Claude Code']
		},
		{
			label: 'Stack',
			icon: Layers,
			items: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Node.js']
		},
		{
			label: 'Daily Tools',
			icon: Wrench,
			items: [
				'Zen Browser',
				'Windows',
				'Windows Terminal',
				'Tabby',
				'PowerShell',
				'Figma',
				'Affinity',
				'DaVinci Resolve',
				'Proton Mail',
				'Proton Pass',
				'Proton Drive',
				'Proton VPN',
				'Discord',
				'WhatsApp'
			]
		},
		{
			label: 'Desktop',
			icon: Cpu,
			items: [
				'AMD Ryzen 7 7800X3D',
				'Gigabyte RTX 3070 Eagle OC',
				'AOC 24G1WG4 (24")',
				'Dell P2414H (24")'
			]
		},
		{
			label: 'Peripherals',
			icon: Keyboard,
			items: ['Keychron K10 HE Wireless', 'Keychron M6 8K']
		},
		{
			label: 'Audio',
			icon: Headphones,
			items: ['Elgato Wave:3 MK.2', 'Simgot EW300 DSP']
		},
		{
			label: 'Sim & Gaming',
			icon: Gamepad2,
			items: ['MOZA R3 Racing Kit', 'GameSir Xbox Controller', 'Steam Controller']
		},
		{
			label: 'Streaming',
			icon: Video,
			items: ['Elgato Stream Deck MK.1']
		}
	];
</script>

<Seo title="Gear — RazerGhost" description="Tools and gear in regular rotation." path="/gear" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Gear</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Tools and gear in regular rotation.</p>

	<div class="mt-10 grid gap-8">
		{#each groups as group, i}
			<section use:reveal style="transition-delay: {i * 60}ms">
				<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
					<group.icon size={13} aria-hidden="true" />
					{group.label}
				</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each group.items as item}
						<li
							class="chip inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-gray"
						>
							<group.icon size={13} class="text-dim" aria-hidden="true" />
							{item}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</main>
