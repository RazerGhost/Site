<script lang="ts">
	import DevlogCard from '$lib/components/DevlogCard.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { reveal } from '$lib/actions/reveal';
	import { socialLinks, site } from '$lib/config';
	import Seo from '$lib/components/Seo.svelte';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title={site.name} description={site.description} path="/" />

<main class="mx-auto max-w-2xl px-6 py-16">
	<section class="flex flex-col items-center text-center">
		<div class="relative flex h-24 w-24 items-center justify-center" data-hero-reveal="0">
			<div class="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true"></div>
			<Logo variant="mark" size={96} />
		</div>
		<h1 class="mt-6 text-4xl font-extrabold tracking-tight text-white" data-hero-reveal="1">
			{site.name}
		</h1>
		<p class="mt-2 text-gray" data-hero-reveal="2">{site.tagline}</p>

		<ul class="mt-6 flex flex-wrap justify-center gap-3" data-hero-reveal="3">
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

	<section class="mt-20" use:reveal>
		<div class="flex items-baseline justify-between">
			<h2 class="text-xl font-bold text-white">Latest</h2>
			<a href="/devlog" class="link flex items-center gap-1 text-sm text-primary hover:opacity-85">
				View all <ArrowRight size={15} aria-hidden="true" />
			</a>
		</div>

		<div class="mt-6 grid gap-4">
			{#each data.latest as entry}
				<DevlogCard {entry} />
			{:else}
				<p class="text-sm text-dim">No devlog entries yet.</p>
			{/each}
		</div>
	</section>

	<section class="cta-band mt-20" use:reveal>
		<p class="relative text-lg font-semibold text-white">Got something to build together?</p>
		<a
			href="https://rg-digital.dev/about"
			target="_blank"
			class="link relative mt-2 inline-flex items-center gap-1 text-sm text-primary hover:opacity-85"
		>
			See my work at RG Digital <ArrowRight size={15} aria-hidden="true" />
		</a>
	</section>
</main>
