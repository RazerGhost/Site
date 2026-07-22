<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import User from '@lucide/svelte/icons/user';
	import Code from '@lucide/svelte/icons/code';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import { socialLinks, site } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };
</script>

<Seo
	title="About — RazerGhost"
	description="Who's behind RazerGhost, what building in public means here, and how it connects to RG Digital."
	path="/about"
/>

<main class="mx-auto max-w-3xl px-6 py-16">
	<section
		class="card flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center sm:flex-row sm:text-left"
		data-hero-reveal="0"
	>
		<div class="relative flex h-14 w-14 shrink-0 items-center justify-center">
			<div class="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true"></div>
			<Logo variant="mark" size={56} />
		</div>
		<div class="min-w-0 flex-1">
			<h1 class="text-xl font-bold text-white">{site.name}</h1>
			<p class="mt-1 text-sm text-gray">Dimitri de Jong &middot; building random things in public</p>
			<div class="mt-2 flex justify-center sm:justify-start">
				<DiscordPresence compact />
			</div>
		</div>
		<ul class="flex flex-wrap justify-center gap-2 sm:justify-end">
			{#each socialLinks as link}
				{@const Icon = icons[link.icon]}
				<li>
					<a
						href={link.href}
						class="link flex h-8 w-8 items-center justify-center rounded-full border border-border text-gray transition-colors hover:border-primary hover:text-primary"
						aria-label={link.label}
					>
						<Icon size={14} aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<div class="mt-4 grid grid-cols-3 gap-3">
		<div class="card rounded-lg border border-border bg-surface p-4 text-center" use:reveal>
			<p class="text-xl font-bold text-white">{data.postCount}</p>
			<p class="mt-1 text-xs text-dim">devlog posts</p>
		</div>
		<div class="card rounded-lg border border-border bg-surface p-4 text-center" use:reveal>
			<p class="text-xl font-bold text-white">{data.projectCount}</p>
			<p class="mt-1 text-xs text-dim">projects shipped</p>
		</div>
		<div class="card rounded-lg border border-border bg-surface p-4 text-center" use:reveal>
			<p class="text-xl font-bold text-white">{data.currentStreak ?? 0}</p>
			<p class="mt-1 text-xs text-dim">day listen streak</p>
		</div>
	</div>

	<div class="mt-4 grid gap-3">
		<section class="card rounded-lg border border-border bg-surface p-6" use:reveal>
			<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
				<User size={13} aria-hidden="true" /> Who's behind this
			</h2>
			<p class="mt-3 text-[15px] leading-relaxed text-gray">
				I'm Dimitri de Jong — <strong class="text-white">RazerGhost</strong> is just the handle I've
				used online for years, and it stuck as the name for this corner of the internet. By day I
				run <a href="https://rg-digital.dev" target="_blank" rel="noopener noreferrer" class="link text-primary hover:opacity-85">RG Digital</a>,
				building web apps and sites for clients. This site is everything that isn't client work: a
				link hub instead of a dozen separate profiles, plus a running devlog of whatever random
				thing I'm building at the moment.
			</p>
		</section>

		<section class="card rounded-lg border border-border bg-surface p-6" use:reveal>
			<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
				<Code size={13} aria-hidden="true" /> Building in public
			</h2>
			<p class="mt-3 text-[15px] leading-relaxed text-gray">
				Most of what ends up on <a href="/devlog" class="link text-primary hover:opacity-85">the devlog</a>
				is small and unglamorous — a rate limiter, a Docker build trick, a dashboard widget that
				took longer than it should have. None of it is written up to impress anyone; it's closer
				to notes-to-self that happen to be public. This site itself is the biggest running
				example: <a href="/projects/razerghost-site" class="link text-primary hover:opacity-85">its own project page</a>
				explains how it's built, and the devlog covers most of it going up piece by piece.
			</p>
		</section>

		<section class="card rounded-lg border border-border bg-surface p-6" use:reveal>
			<h2 class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dim">
				<GitBranch size={13} aria-hidden="true" /> RazerGhost vs. RG Digital
			</h2>
			<p class="mt-3 text-[15px] leading-relaxed text-gray">
				RG Digital is the client-facing side — production work, built for other people's
				businesses. RazerGhost is mine: no case studies, no pitch, just <a href="/projects" class="link text-primary hover:opacity-85">side
				projects</a>, a <a href="/watchlist" class="link text-primary hover:opacity-85">watchlist</a>, <a href="/listens" class="link text-primary hover:opacity-85">listening
				history</a>, and the <a href="/gear" class="link text-primary hover:opacity-85">gear</a> I
				actually use day to day. Same person, different reason for existing.
			</p>
		</section>
	</div>

	<a
		href="https://rg-digital.dev/about"
		target="_blank"
		rel="noopener noreferrer"
		class="link mt-4 flex items-center justify-between rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/15"
	>
		Here about work? See my work at RG Digital
		<ArrowRight size={14} aria-hidden="true" />
	</a>

	<p class="mt-4 text-center text-sm text-dim">
		General questions or just want to say hi? Use the links above.
	</p>
</main>
