<script lang="ts">
	import { goto } from '$app/navigation';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import { navLinks } from '$lib/config';
	import Search from '@lucide/svelte/icons/search';

	let {
		entries
	}: { entries: { slug: string; title: string; kind: 'devlog' | 'project' }[] } = $props();

	interface Item {
		label: string;
		hint?: string;
		search?: string;
		action: () => void;
	}

	// Lazily-loaded fuller index (excerpt + stripped body text) keyed by
	// slug, fetched once on first open — see /api/search.json. Keeps every
	// page's initial load down to just entries (slug/title).
	let fullIndex = $state<Record<string, { excerpt: string; searchText: string }>>({});
	let indexRequested = false;

	function toggleTheme() {
		const stored = localStorage.getItem('theme');
		const effective =
			stored === 'light' || stored === 'dark'
				? stored
				: window.matchMedia('(prefers-color-scheme: light)').matches
					? 'light'
					: 'dark';
		const next = effective === 'light' ? 'dark' : 'light';
		document.documentElement.dataset.theme = next;
		localStorage.setItem('theme', next);
	}

	const navItems: Item[] = [
		{ label: 'Home', hint: '/', action: () => goto('/') },
		...navLinks.map((link) => ({
			label: link.label,
			hint: link.href,
			action: () => goto(link.href)
		}))
	];

	const actionItems: Item[] = [{ label: 'Toggle theme', hint: 'Action', action: toggleTheme }];

	const postItems = $derived(
		entries.map((entry) => {
			const extra = fullIndex[entry.slug];
			return {
				label: entry.title,
				hint: entry.kind === 'project' ? 'Project' : 'Devlog',
				search: extra
					? `${entry.title} ${extra.excerpt} ${extra.searchText}`.toLowerCase()
					: entry.title.toLowerCase(),
				action: () => goto(`/${entry.kind === 'project' ? 'projects' : 'devlog'}/${entry.slug}`)
			};
		})
	);

	const allItems = $derived([...navItems, ...actionItems, ...postItems]);

	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();
	let listEl = $state<HTMLUListElement>();

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return allItems;
		return allItems.filter((item) => (item.search ?? item.label.toLowerCase()).includes(q));
	});

	$effect(() => {
		// filtered changing (new query) means any previous selectedIndex may
		// now point past the end of the list, or at an unrelated item
		filtered;
		selectedIndex = 0;
	});

	$effect(() => {
		if (commandPalette.open) inputEl?.focus();
	});

	$effect(() => {
		selectedIndex;
		listEl?.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		if (!commandPalette.open || indexRequested) return;
		indexRequested = true;
		fetch('/api/search.json')
			.then((r) => r.json())
			.then((data: { slug: string; excerpt: string; searchText: string }[]) => {
				fullIndex = Object.fromEntries(
					data.map((d) => [d.slug, { excerpt: d.excerpt, searchText: d.searchText }])
				);
			})
			.catch(() => {});
	});

	function close() {
		commandPalette.open = false;
		query = '';
		selectedIndex = 0;
	}

	function select(item: Item) {
		item.action();
		close();
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			commandPalette.open = !commandPalette.open;
		} else if (e.key === 'Escape' && commandPalette.open) {
			close();
		}
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const item = filtered[selectedIndex];
			if (item) select(item);
		}
	}
</script>

<svelte:window onkeydown={onGlobalKeydown} />

{#if commandPalette.open}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[15vh]"
		onclick={close}
		role="presentation"
	>
		<div
			class="w-full max-w-lg rounded-lg border border-border bg-surface shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-center gap-3 border-b border-border px-4 py-3">
				<Search size={16} class="text-dim" aria-hidden="true" />
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={onInputKeydown}
					type="text"
					placeholder="Jump to a page or post…"
					class="w-full bg-transparent text-sm text-white placeholder:text-dim focus:outline-none"
				/>
				<kbd class="rounded border border-border px-1.5 py-0.5 text-xs text-dim">Esc</kbd>
			</div>
			<ul bind:this={listEl} class="max-h-80 overflow-y-auto p-2">
				{#each filtered as item, i (item.label + i)}
					<li>
						<button
							type="button"
							data-index={i}
							onclick={() => select(item)}
							onmouseenter={() => (selectedIndex = i)}
							class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm {i ===
							selectedIndex
								? 'bg-surface-2 text-primary'
								: 'text-gray'}"
						>
							<span>{item.label}</span>
							{#if item.hint}
								<span class="text-xs text-dim">{item.hint}</span>
							{/if}
						</button>
					</li>
				{:else}
					<li class="px-3 py-2 text-sm text-dim">No matches.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
