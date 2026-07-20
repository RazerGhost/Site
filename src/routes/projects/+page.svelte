<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Rss from '@lucide/svelte/icons/rss';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import type { ProjectStatus } from '$lib/server/projects';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const initialParams = page.url.searchParams;

	let selectedTag = $state<string | null>(initialParams.get('tag'));
	let selectedStatus = $state<ProjectStatus | null>(
		initialParams.get('status') as ProjectStatus | null
	);
	let query = $state(initialParams.get('q') ?? '');
	let sort = $state<'newest' | 'oldest' | 'name'>('newest');

	// Keep the URL in sync with filters so a filtered view is reload-safe and
	// shareable — replaceState only, same approach as /devlog's list page.
	$effect(() => {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (selectedTag) params.set('tag', selectedTag);
		if (selectedStatus) params.set('status', selectedStatus);
		const qs = params.toString();
		replaceState(qs ? `?${qs}` : location.pathname, {});
	});

	const tagCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const project of data.projects) {
			for (const tag of project.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
		return counts;
	});
	const tags = $derived([...tagCounts.keys()].sort());

	const statuses: ProjectStatus[] = ['active', 'paused', 'archived'];
	const statusCounts = $derived.by(() => {
		const counts = new Map<ProjectStatus, number>();
		for (const project of data.projects) counts.set(project.status, (counts.get(project.status) ?? 0) + 1);
		return counts;
	});

	const latestDate = $derived(
		data.projects.reduce<string | null>((max, p) => (!max || p.date > max ? p.date : max), null)
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const featuredProject = $derived(data.projects.find((p) => p.featured) ?? null);

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		const status = selectedStatus;
		const q = query.trim().toLowerCase();
		const list = data.projects.filter((p) => {
			if (featuredProject && p.slug === featuredProject.slug) return false;
			const matchesTag = !tag || p.tags.includes(tag);
			const matchesStatus = !status || p.status === status;
			const matchesQuery =
				!q ||
				p.name.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				p.searchText.includes(q);
			return matchesTag && matchesStatus && matchesQuery;
		});

		return list.toSorted((a, b) => {
			if (sort === 'name') return a.name.localeCompare(b.name);
			if (sort === 'oldest') return a.date > b.date ? 1 : -1;
			return a.date > b.date ? -1 : 1;
		});
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}

	function toggleStatus(status: ProjectStatus) {
		selectedStatus = selectedStatus === status ? null : status;
	}
</script>

<Seo title="Projects — RazerGhost" description="Things I've built." path="/projects" />

<main class="mx-auto max-w-6xl px-6 py-16">
	<div class="flex items-baseline justify-between" data-hero-reveal="0">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
		<a
			href="/projects/rss.xml"
			data-sveltekit-reload
			class="link flex items-center gap-1.5 text-sm text-dim hover:text-primary"
		>
			<Rss size={14} aria-hidden="true" /> RSS
		</a>
	</div>
	<p class="mt-2 text-gray" data-hero-reveal="1">Things I've built, in progress or otherwise.</p>

	<div class="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-border p-4 text-center" data-hero-reveal="2">
		<div>
			<p class="text-xl font-bold text-white">{data.projects.length}</p>
			<p class="mt-0.5 text-xs text-dim">Projects</p>
		</div>
		<div>
			<p class="text-xl font-bold text-white">{tags.length}</p>
			<p class="mt-0.5 text-xs text-dim">Tags</p>
		</div>
		<div>
			<p class="text-xl font-bold text-white">{latestDate ? formatDate(latestDate) : '—'}</p>
			<p class="mt-0.5 text-xs text-dim">Latest build</p>
		</div>
	</div>

	{#if featuredProject}
		<div class="mt-6">
			<p class="text-xs font-semibold uppercase tracking-wide text-dim">Featured</p>
			<div class="mt-2">
				<ProjectCard project={featuredProject} featured />
			</div>
		</div>
	{/if}

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<input
			type="search"
			bind:value={query}
			placeholder="Search projects…"
			class="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
		/>
		<select
			bind:value={sort}
			class="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
		>
			<option value="newest">Newest first</option>
			<option value="oldest">Oldest first</option>
			<option value="name">Name</option>
		</select>
	</div>

	{#if tags.length}
		<ul class="mt-6 flex flex-wrap gap-2">
			<li>
				<button
					class="chip rounded-full border px-3 py-1 text-xs {selectedTag === null
						? 'border-primary text-primary'
						: 'border-border text-gray'}"
					onclick={() => (selectedTag = null)}
				>
					All <span class="text-dim">{data.projects.length}</span>
				</button>
			</li>
			{#each tags as tag}
				<li>
					<button
						class="chip rounded-full border px-3 py-1 text-xs {selectedTag === tag
							? 'border-primary text-primary'
							: 'border-border text-gray'}"
						onclick={() => toggleTag(tag)}
					>
						{tag} <span class="text-dim">{tagCounts.get(tag)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if statusCounts.size > 1}
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each statuses as status}
				{#if statusCounts.get(status)}
					<li>
						<button
							class="chip rounded-full border px-3 py-1 text-xs capitalize {selectedStatus === status
								? 'border-primary text-primary'
								: 'border-border text-gray'}"
							onclick={() => toggleStatus(status)}
						>
							{status} <span class="text-dim">{statusCounts.get(status)}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}

	{#if data.projects.length - (featuredProject ? 1 : 0) > 0}
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" use:reveal>
			{#each filtered as project, i}
				<div style="transition-delay: {i * 60}ms">
					<ProjectCard {project} />
				</div>
			{:else}
				<p class="text-sm text-dim">Nothing matches your search.</p>
			{/each}
		</div>
	{/if}

	<p class="mt-10 text-sm text-dim">More coming as I build things worth sharing.</p>
</main>
