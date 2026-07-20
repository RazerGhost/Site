<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import GithubActivity from '$lib/components/GithubActivity.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Music from '@lucide/svelte/icons/music';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import { reveal } from '$lib/actions/reveal';
	import { socialLinks, site } from '$lib/config';
	import Seo from '$lib/components/Seo.svelte';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<Seo title={site.name} description={site.description} path="/" />

<main class="mx-auto max-w-5xl px-6 py-16">
	<div class="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<section
			class="card flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center sm:col-span-2 sm:flex-row sm:text-left lg:col-span-3"
		>
			<div class="relative flex h-16 w-16 shrink-0 items-center justify-center" data-hero-reveal="0">
				<div class="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true"></div>
				<Logo variant="mark" size={64} />
			</div>
			<div class="min-w-0 flex-1" data-hero-reveal="1">
				<h1 class="text-2xl font-extrabold tracking-tight text-white">{site.name}</h1>
				<p class="mt-1 text-sm text-gray">{site.tagline}</p>
				<div class="mt-2 flex justify-center sm:justify-start">
					<DiscordPresence compact />
				</div>
			</div>

			<ul class="flex flex-wrap justify-center gap-3 sm:justify-end" data-hero-reveal="2">
				{#each socialLinks as link}
					{@const Icon = icons[link.icon]}
					<li>
						<a
							href={link.href}
							class="link flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
						>
							<Icon size={15} aria-hidden="true" />
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</section>

		<section class="card rounded-lg border border-border bg-surface p-6 lg:col-span-2" use:reveal>
			<h2 class="text-xl font-bold text-white">Right now</h2>

			<div class="mt-6 grid gap-6 sm:grid-cols-2">
				<div>
					<h3 class="text-xs font-medium uppercase tracking-wide text-dim">Currently</h3>
					<ul class="mt-3 grid gap-2">
						{#each data.statusItems as item}
							<li class="text-sm text-gray">{item}</li>
						{/each}
					</ul>
				</div>
				<div class="sm:border-l sm:border-border sm:pl-6">
					<h3 class="text-xs font-medium uppercase tracking-wide text-dim">GitHub</h3>
					<div class="mt-3">
						<GithubActivity limit={3} />
					</div>
				</div>
			</div>
		</section>

		<div class="flex flex-col gap-4">
			<section class="card flex flex-1 flex-col rounded-lg border border-border bg-surface p-6" use:reveal>
				<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
					<Music size={13} aria-hidden="true" /> Now playing
				</h2>

				{#if data.nowPlaying}
					<a
						href={data.nowPlaying.url}
						target="_blank"
						rel="noopener noreferrer"
						class="link mt-4 flex items-center gap-3"
					>
						{#if data.nowPlaying.albumArt}
							<img
								src={data.nowPlaying.albumArt}
								alt=""
								class="h-14 w-14 shrink-0 rounded-md object-cover"
							/>
						{/if}
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-white">{data.nowPlaying.track}</p>
							<p class="truncate text-sm text-dim">{data.nowPlaying.artist}</p>
						</div>
					</a>
				{:else}
					<p class="mt-4 text-sm text-dim">Nothing playing right now.</p>
				{/if}
			</section>

			<section class="card flex flex-1 flex-col rounded-lg border border-border bg-surface p-6" use:reveal>
				<div class="flex items-baseline justify-between">
					<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
						<Music size={13} aria-hidden="true" /> Listens
					</h2>
					<a href="/listens" class="link text-xs text-primary hover:opacity-85">See all</a>
				</div>

				{#if data.currentStreak}
					<p class="mt-4 text-2xl font-bold text-white">
						{data.currentStreak} day{data.currentStreak === 1 ? '' : 's'}
					</p>
					<p class="mt-1 text-xs text-dim">
						current streak · {data.totalPlays.toLocaleString()} plays logged
					</p>
				{:else if data.topTrack}
					<p class="mt-4 truncate text-sm font-medium text-white">{data.topTrack.track}</p>
					<p class="truncate text-sm text-dim">{data.topTrack.artist}</p>
					<p class="mt-3 text-xs text-dim">
						{data.topTrack.plays} plays · top track · {data.totalPlays.toLocaleString()} plays logged
					</p>
				{:else}
					<p class="mt-4 text-sm text-dim">No listening history imported yet.</p>
				{/if}
			</section>

			<section class="card flex flex-1 flex-col rounded-lg border border-border bg-surface p-6" use:reveal>
				<div class="flex items-baseline justify-between">
					<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
						<Clapperboard size={13} aria-hidden="true" /> Watching
					</h2>
					<a href="/watchlist" class="link text-xs text-primary hover:opacity-85">See all</a>
				</div>

				{#if data.watching}
					<div class="mt-4 flex gap-3">
						{#if data.watching.posterUrl}
							<img
								src={data.watching.posterUrl}
								alt=""
								class="h-20 w-14 shrink-0 rounded-md object-cover"
							/>
						{/if}
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-white">{data.watching.title}</p>
							{#if data.watching.nextToWatch}
								<p class="mt-1 text-xs text-dim">Next: {data.watching.nextToWatch}</p>
							{/if}
							{#if data.watching.totalEpisodes}
								<p class="mt-1 text-xs text-dim">
									{data.watching.watchedEpisodes}/{data.watching.totalEpisodes} episodes
								</p>
							{/if}
						</div>
					</div>
				{:else}
					<p class="mt-4 text-sm text-dim">Nothing in progress right now.</p>
				{/if}
			</section>
		</div>

		<section class="card rounded-lg border border-border bg-surface p-6 sm:col-span-2 lg:col-span-3" use:reveal>
			<div class="flex items-baseline justify-between">
				<h2 class="text-xl font-bold text-white">Latest</h2>
				<a
					href="/devlog"
					class="link flex items-center gap-1 text-sm text-primary hover:opacity-85"
				>
					View all <ArrowRight size={15} aria-hidden="true" />
				</a>
			</div>

			<ul class="mt-6 grid gap-4 sm:grid-cols-3">
				{#each data.latest as entry}
					<li>
						<a href={`/devlog/${entry.slug}`} class="link group block">
							<p class="text-xs text-dim">{formatDate(entry.date)} · {entry.readingTime} min read</p>
							<p class="mt-0.5 text-sm font-medium text-white group-hover:text-primary">
								{entry.title}
							</p>
						</a>
					</li>
				{:else}
					<li class="text-sm text-dim">No devlog entries yet.</li>
				{/each}
			</ul>
		</section>

		{#if data.projects.length}
			<section
				class="card rounded-lg border border-border bg-surface p-6 sm:col-span-2 lg:col-span-3"
				use:reveal
			>
				<div class="flex items-baseline justify-between">
					<h2 class="text-xl font-bold text-white">Projects</h2>
					<a
						href="/projects"
						class="link flex items-center gap-1 text-sm text-primary hover:opacity-85"
					>
						View all <ArrowRight size={15} aria-hidden="true" />
					</a>
				</div>

				<div class="mt-6 grid gap-4 sm:grid-cols-3">
					{#each data.projects as project}
						<ProjectCard {project} />
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<section class="cta-band mt-20" use:reveal>
		<p class="relative text-lg font-semibold text-white">Got something to build together?</p>
		<a
			href="https://rg-digital.dev/about"
			target="_blank"
			rel="noopener noreferrer"
			class="link relative mt-2 inline-flex items-center gap-1 text-sm text-primary hover:opacity-85"
		>
			See my work at RG Digital <ArrowRight size={15} aria-hidden="true" />
		</a>
	</section>
</main>
