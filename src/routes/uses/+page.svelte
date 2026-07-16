<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	const groups = [
		{
			label: 'Editor',
			items: ['Zed', 'Claude Code']
		},
		{
			label: 'Stack',
			items: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Node.js']
		},
		{
			label: 'Daily Tools',
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
			items: [
				'AMD Ryzen 7 7800X3D',
				'Gigabyte RTX 3070 Eagle OC',
				'AOC 24G1WG4 (24")',
				'Dell P2414H (24")'
			]
		},
		{
			label: 'Peripherals',
			items: ['Keychron K10 HE Wireless', 'Keychron M6 8K']
		},
		{
			label: 'Audio',
			items: ['Elgato Wave:3 MK.2', 'Simgot EW300 DSP']
		},
		{
			label: 'Sim & Gaming',
			items: ['MOZA R3 Racing Kit', 'GameSir Xbox Controller', 'Steam Controller']
		},
		{
			label: 'Streaming',
			items: ['Elgato Stream Deck MK.1']
		}
	];
</script>

<svelte:head>
	<title>Uses — RazerGhost</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Uses</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Tools and gear in regular rotation.</p>

	<div class="mt-10 grid gap-8">
		{#each groups as group, i}
			<section use:reveal style="transition-delay: {i * 60}ms">
				<h2 class="text-xs font-medium uppercase tracking-wide text-dim">{group.label}</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each group.items as item}
						<li
							class="chip inline-block w-fit rounded-full border border-border px-3 py-1 text-sm text-gray"
						>
							{item}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</main>
