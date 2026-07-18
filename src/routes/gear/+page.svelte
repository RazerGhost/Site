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
	import Search from '@lucide/svelte/icons/search';
	import ExternalLink from '@lucide/svelte/icons/external-link';

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

	let query = $state('');
	let activeLabel = $state<string | null>(null);
	let expanded = $state<string | null>(null);

	const visibleGroups = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return gearGroups
			.map((group) => ({
				...group,
				items: group.items.filter((item) => {
					if (q) return item.name.toLowerCase().includes(q);
					if (activeLabel) return group.label === activeLabel;
					return true;
				})
			}))
			.filter((group) => group.items.length > 0);
	});

	function toggleExpanded(key: string) {
		expanded = expanded === key ? null : key;
	}
</script>

<Seo title="Gear — RazerGhost" description="Tools and gear in regular rotation." path="/gear" />

<main class="mx-auto max-w-6xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">Gear</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Tools and gear in regular rotation.</p>

	<div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center" data-hero-reveal="2">
		<div class="relative w-full sm:max-w-xs">
			<Search
				size={14}
				class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim"
				aria-hidden="true"
			/>
			<input
				type="search"
				bind:value={query}
				placeholder="Search gear…"
				class="w-full rounded-lg border border-border bg-transparent py-2 pl-8 pr-3 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
			/>
		</div>
		<ul class="flex flex-wrap gap-2 text-xs">
			<li>
				<button
					type="button"
					disabled={!!query}
					onclick={() => (activeLabel = null)}
					class="chip rounded-full border px-3 py-1 disabled:opacity-40 {activeLabel === null
						? 'border-primary text-primary'
						: 'border-border text-gray'}"
				>
					All
				</button>
			</li>
			{#each gearGroups as group}
				<li>
					<button
						type="button"
						disabled={!!query}
						onclick={() => (activeLabel = activeLabel === group.label ? null : group.label)}
						class="chip rounded-full border px-3 py-1 disabled:opacity-40 {activeLabel ===
						group.label
							? 'border-primary text-primary'
							: 'border-border text-gray'}"
					>
						{group.label}
					</button>
				</li>
			{/each}
		</ul>
	</div>

	{#if visibleGroups.length === 0}
		<p class="mt-10 text-sm text-dim">No gear matches "{query}".</p>
	{/if}

	<div class="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
		{#each visibleGroups as group, i}
			{@const Icon = icons[group.icon]}
			<section use:reveal style="transition-delay: {i * 60}ms">
				<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
					<Icon size={13} aria-hidden="true" />
					{group.label}
				</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each group.items as item}
						{@const key = `${group.label}:${item.name}`}
						<li>
							{#if item.href}
								<a
									href={item.href}
									target="_blank"
									rel="noopener noreferrer"
									class="chip inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-gray"
								>
									<Icon size={13} class="text-dim" aria-hidden="true" />
									{item.name}
									<ExternalLink size={11} class="text-dim" aria-hidden="true" />
								</a>
							{:else if item.note}
								<button
									type="button"
									aria-expanded={expanded === key}
									onclick={() => toggleExpanded(key)}
									class="chip inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-sm {expanded ===
									key
										? 'border-primary text-primary'
										: 'border-border text-gray'}"
								>
									<Icon size={13} class="text-dim" aria-hidden="true" />
									{item.name}
								</button>
							{:else}
								<span
									class="chip inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-gray"
								>
									<Icon size={13} class="text-dim" aria-hidden="true" />
									{item.name}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
				{#each group.items as item}
					{@const key = `${group.label}:${item.name}`}
					{#if item.note && expanded === key}
						<p class="mt-2 text-xs text-dim">{item.note}</p>
					{/if}
				{/each}
			</section>
		{/each}
	</div>
</main>
