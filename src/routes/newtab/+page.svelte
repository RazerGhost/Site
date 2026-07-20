<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import GithubActivity from '$lib/components/GithubActivity.svelte';
	import ListeningNowCard from '$lib/components/ListeningNowCard.svelte';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import Music from '@lucide/svelte/icons/music';
	import Search from '@lucide/svelte/icons/search';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import Settings from '@lucide/svelte/icons/settings';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import { navLinks } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let settingsOpen = $state(false);
	let queryInput = $state(data.unsplashQuery);

	// Notes is intentionally left out of the site-wide nav (it's a private,
	// login-gated route) — but it belongs on this personal dashboard, so it's
	// appended here rather than added to the shared navLinks config.
	const dashboardLinks = [...navLinks, { label: 'Notes', href: '/notes' }];

	const linkIcons = {
		Projects: FolderGit2,
		Devlog: NotebookPen,
		Gear: Wrench,
		Watchlist: Clapperboard,
		Listens: Music,
		Notes: StickyNote
	} as const;

	let query = $state('');

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		const q = query.trim();
		if (!q) return;
		window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
	}

	let now = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(timer);
	});

	const timeString = $derived(
		now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
	);
	const greeting = $derived.by(() => {
		const hour = now.getHours();
		if (hour < 5) return 'Still up';
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});
</script>

<svelte:head>
	<title>New Tab</title>
</svelte:head>

{#if data.photo}
	<div class="photo-bg" aria-hidden="true" style:background-image="url({data.photo.url})"></div>
	<div class="photo-bg-scrim" aria-hidden="true"></div>
	<div
		class="glass fixed right-4 bottom-4 z-10 rounded-full px-3 py-1.5 text-xs text-white/70"
	>
		Photo by
		<a
			href={data.photo.photographerProfileUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="text-white/90 hover:text-primary"
		>
			{data.photo.photographerName}
		</a>
		on
		<a
			href={data.photo.photoPageUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="text-white/90 hover:text-primary"
		>
			Unsplash
		</a>
	</div>
{:else}
	<div class="aurora" aria-hidden="true">
		<span class="aurora-blob aurora-blob--1"></span>
		<span class="aurora-blob aurora-blob--2"></span>
		<span class="aurora-blob aurora-blob--3"></span>
	</div>
{/if}

{#if data.unsplashConfigured}
	<button
		type="button"
		onclick={() => (settingsOpen = !settingsOpen)}
		aria-label="Background settings"
		class="glass glass--interactive fixed top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full text-white/70 hover:text-primary"
	>
		<Settings size={16} aria-hidden="true" />
	</button>

	{#if settingsOpen}
		<div class="glass fixed top-16 right-4 z-20 w-72 rounded-2xl p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">Background</h2>
				<button
					type="button"
					onclick={() => (settingsOpen = false)}
					aria-label="Close"
					class="text-white/50 hover:text-primary"
				>
					<X size={14} aria-hidden="true" />
				</button>
			</div>
			<form
				method="POST"
				action="?/updateBackground"
				class="mt-3"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						settingsOpen = false;
					};
				}}
			>
				<label class="block text-xs text-white/50" for="unsplash-query">Photo search terms</label>
				<input
					id="unsplash-query"
					name="query"
					type="text"
					bind:value={queryInput}
					placeholder="cinematic mountains"
					class="glass mt-1.5 w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
				/>
				<button
					type="submit"
					class="mt-3 w-full rounded-lg bg-primary/90 py-2 text-sm font-medium text-black transition-colors hover:bg-primary"
				>
					Save
				</button>
			</form>
		</div>
	{/if}
{/if}

<main class="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
	<div class="text-center">
		<p class="text-6xl font-bold tracking-tight text-white tabular-nums">{timeString}</p>
		<p class="mt-2 text-lg text-white/70">{greeting}.</p>
	</div>

	<form class="mx-auto mt-8 w-full max-w-lg" onsubmit={submitSearch}>
		<label class="relative block">
			<Search
				size={16}
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/50"
			/>
			<input
				type="search"
				bind:value={query}
				placeholder="Search the web…"
				class="glass w-full rounded-full py-3 pr-4 pl-10 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
			/>
		</label>
	</form>

	<nav class="mx-auto mt-8 flex flex-wrap justify-center gap-2">
		{#each dashboardLinks as link}
			{@const Icon = linkIcons[link.label as keyof typeof linkIcons]}
			<a
				href={link.href}
				class="glass glass--interactive flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:text-primary"
			>
				{#if Icon}
					<Icon size={15} aria-hidden="true" />
				{/if}
				{link.label}
			</a>
		{/each}
	</nav>

	<section class="glass mt-8 rounded-2xl p-6">
		{#if data.statusItems.length}
			<div class="mb-6 border-b border-white/10 pb-6">
				<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">Right now</h2>
				<ul class="mt-3 grid gap-2">
					{#each data.statusItems as item}
						<li class="text-sm text-white/80">{item}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="grid gap-6 sm:grid-cols-2">
			<div>
				<h2 class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/50 uppercase">
					<Music size={13} aria-hidden="true" /> Now playing
				</h2>
				<div class="mt-3">
					<ListeningNowCard bare>
						{#snippet fallback()}
							<p class="text-sm text-white/50">Nothing playing right now.</p>
						{/snippet}
					</ListeningNowCard>
				</div>
			</div>

			<div class="sm:border-l sm:border-white/10 sm:pl-6">
				<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">Discord</h2>
				<div class="mt-3">
					<DiscordPresence activityOnly />
				</div>
			</div>
		</div>

		<div class="mt-6 border-t border-white/10 pt-6">
			<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">GitHub</h2>
			<div class="mt-3">
				<GithubActivity limit={3} />
			</div>
		</div>
	</section>
</main>

<style>
	/* Scoped to this page only — the site's other pages keep their flat
	   bg-surface cards; this dashboard gets its own glass/aurora treatment
	   since it's meant to feel like a separate "browser chrome" surface
	   rather than a page of the marketing site. */
	.photo-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-size: cover;
		background-position: center;
	}

	/* Dims/tints the photo toward the brand's near-black + cyan/lime so text
	   and the glass panels stay legible regardless of what photo comes back. */
	.photo-bg-scrim {
		position: fixed;
		inset: 0;
		z-index: 0;
		background: linear-gradient(
			160deg,
			rgba(5, 7, 10, 0.75) 0%,
			rgba(5, 7, 10, 0.55) 50%,
			rgba(5, 7, 10, 0.8) 100%
		);
	}

	.aurora {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: #05070a;
	}

	.aurora-blob {
		position: absolute;
		border-radius: 9999px;
		filter: blur(90px);
		opacity: 0.55;
		will-change: transform;
	}

	.aurora-blob--1 {
		top: -10%;
		left: -10%;
		width: 45vw;
		height: 45vw;
		background: #22d3ee;
		animation: drift1 26s ease-in-out infinite;
	}

	/* Lime — RG Digital's brand accent (see tokens.css header comment) —
	   paired with RazerGhost's own cyan since the "See my work at RG Digital"
	   link lives on this dashboard too. */
	.aurora-blob--2 {
		bottom: -15%;
		right: -10%;
		width: 40vw;
		height: 40vw;
		background: #ccff00;
		opacity: 0.4;
		animation: drift2 32s ease-in-out infinite;
	}

	.aurora-blob--3 {
		top: 30%;
		left: 55%;
		width: 30vw;
		height: 30vw;
		background: #00e5ff;
		opacity: 0.35;
		animation: drift3 22s ease-in-out infinite;
	}

	@keyframes drift1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(6vw, 8vh) scale(1.1);
		}
	}

	@keyframes drift2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-5vw, -6vh) scale(1.05);
		}
	}

	@keyframes drift3 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-4vw, 5vh);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.aurora-blob {
			animation: none;
		}
	}

	.glass {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.glass--interactive:hover {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
		border-color: rgba(34, 211, 238, 0.4);
	}
</style>
