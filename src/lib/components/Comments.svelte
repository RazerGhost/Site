<script lang="ts">
	import { giscus, giscusConfigured } from '$lib/config';

	let el = $state<HTMLDivElement>();

	function giscusTheme(): 'light' | 'dark' {
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') return stored;
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	}

	$effect(() => {
		if (!giscusConfigured() || !el) return;
		const container = el;

		const script = document.createElement('script');
		script.src = 'https://giscus.app/client.js';
		script.async = true;
		script.crossOrigin = 'anonymous';
		script.setAttribute('data-repo', giscus.repo);
		script.setAttribute('data-repo-id', giscus.repoId);
		script.setAttribute('data-category', giscus.category);
		script.setAttribute('data-category-id', giscus.categoryId);
		script.setAttribute('data-mapping', 'pathname');
		script.setAttribute('data-reactions-enabled', '1');
		script.setAttribute('data-input-position', 'top');
		script.setAttribute('data-theme', giscusTheme());
		script.setAttribute('data-lang', 'en');
		container.appendChild(script);

		// giscus runs in a cross-origin iframe, so it can't see our
		// data-theme attribute directly — sync it over postMessage whenever
		// the site's theme toggle flips.
		const observer = new MutationObserver(() => {
			const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
			iframe?.contentWindow?.postMessage(
				{ giscus: { setConfig: { theme: giscusTheme() } } },
				'https://giscus.app'
			);
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		return () => observer.disconnect();
	});
</script>

{#if giscusConfigured()}
	<div class="mt-16 border-t border-border pt-10">
		<h2 class="text-lg font-semibold text-white">Comments</h2>
		<div class="mt-6" bind:this={el}></div>
	</div>
{/if}
