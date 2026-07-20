<script lang="ts">
	import type { TocEntry } from '$lib/server/content';

	let { toc }: { toc: TocEntry[] } = $props();

	let activeId = $state<string | null>(null);

	// Scrollspy: the active heading is normally the last one (in document
	// order) whose top has scrolled above a fixed offset near the sticky site
	// header. A short final section can end up with less trailing content
	// than the gap between that offset and the bottom of the viewport, so it
	// may never cross the offset line no matter how far the page scrolls —
	// once the page is scrolled to its end, fall back to the last heading
	// that has entered the viewport at all, rather than requiring reserved
	// blank space at the bottom of every post just to give it room.
	const HEADER_OFFSET = 96;

	$effect(() => {
		const elements = toc
			.map((heading) => document.getElementById(heading.id))
			.filter((el): el is HTMLElement => el !== null);

		if (!elements.length) return;

		const updateActive = () => {
			const atBottom =
				window.innerHeight + document.documentElement.scrollTop >=
				document.documentElement.scrollHeight - 2;

			let current = elements[0].id;
			for (const el of elements) {
				const top = el.getBoundingClientRect().top;
				const crossed = atBottom ? top < window.innerHeight : top - HEADER_OFFSET <= 0;
				if (!crossed) break;
				current = el.id;
			}
			activeId = current;
		};

		updateActive();
		// The root layout sets `overflow-y: auto` on <html> to own the page
		// scrollbar, which makes <html> — not `window` — the actual scrolling
		// element; its scroll events bubble to `document` but not to `window`.
		// Listening on `document` covers that regardless of which element ends
		// up owning the scrollbar.
		document.addEventListener('scroll', updateActive, { passive: true });
		window.addEventListener('resize', updateActive);

		return () => {
			document.removeEventListener('scroll', updateActive);
			window.removeEventListener('resize', updateActive);
		};
	});
</script>

{#if toc.length > 1}
	<nav class="card rounded-lg border border-border bg-surface p-4" aria-label="Table of contents">
		<p class="text-xs font-semibold uppercase tracking-wide text-dim">On this page</p>
		<ul class="mt-3 space-y-2 text-sm">
			{#each toc as heading}
				<li class={heading.level === 3 ? 'pl-4' : ''}>
					<a
						href="#{heading.id}"
						class="transition-colors hover:text-primary {activeId === heading.id
							? 'font-medium text-primary'
							: 'text-gray'}"
					>
						{heading.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
