<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<Seo
	title="About — RazerGhost"
	description="Who's behind RazerGhost, what building in public means here, and how it connects to RG Digital."
	path="/about"
/>

<main class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-extrabold tracking-tight text-white" data-hero-reveal="0">About</h1>
	<p class="mt-2 text-gray" data-hero-reveal="1">Who's behind this, and why it exists.</p>

	<div class="prose prose-invert mt-10 max-w-none space-y-6 text-[15px] leading-relaxed text-gray">
		<section use:reveal>
			<p>
				I'm Dimitri de Jong — <strong class="text-white">RazerGhost</strong> is just the handle I've
				used online for years, and it stuck as the name for this corner of the internet. By day I
				run <a href="https://rg-digital.dev" target="_blank" rel="noopener noreferrer" class="link text-primary hover:opacity-85">RG Digital</a>,
				building web apps and sites for clients. This site is everything that isn't client work: a
				link hub instead of a dozen separate profiles, plus a running devlog of whatever random
				thing I'm building at the moment.
			</p>
		</section>

		<section use:reveal>
			<h2 class="text-lg font-bold text-white">Building in public</h2>
			<p class="mt-2">
				Most of what ends up on <a href="/devlog" class="link text-primary hover:opacity-85">the devlog</a>
				is small and unglamorous — a rate limiter, a Docker build trick, a dashboard widget that
				took longer than it should have. None of it is written up to impress anyone; it's closer
				to notes-to-self that happen to be public. This site itself is the biggest running
				example: <a href="/projects/razerghost-site" class="link text-primary hover:opacity-85">its own project page</a>
				explains how it's built, and the devlog covers most of it going up piece by piece.
			</p>
		</section>

		<section use:reveal>
			<h2 class="text-lg font-bold text-white">RazerGhost vs. RG Digital</h2>
			<p class="mt-2">
				RG Digital is the client-facing side — production work, built for other people's
				businesses. RazerGhost is mine: no case studies, no pitch, just <a href="/projects" class="link text-primary hover:opacity-85">side
				projects</a>, a <a href="/watchlist" class="link text-primary hover:opacity-85">watchlist</a>, <a href="/listens" class="link text-primary hover:opacity-85">listening
				history</a>, and the <a href="/gear" class="link text-primary hover:opacity-85">gear</a> I
				actually use day to day. Same person, different reason for existing.
			</p>
		</section>

		<section use:reveal>
			<p class="text-sm text-dim">
				Here about work? Head to
				<a
					href="https://rg-digital.dev/about"
					target="_blank"
					rel="noopener noreferrer"
					class="link inline-flex items-center gap-1 text-primary hover:opacity-85"
				>
					RG Digital <ArrowRight size={13} aria-hidden="true" />
				</a>
				— that's where client work and contact details live. General questions or just want to
				say hi? Use the links below.
			</p>
		</section>
	</div>
</main>
