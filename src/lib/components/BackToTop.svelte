<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';

	let visible = $state(false);

	$effect(() => {
		const onScroll = () => {
			const doc = document.documentElement;
			const maxScroll = doc.scrollHeight - window.innerHeight;
			// A fixed 480px threshold assumes the page has at least that much
			// scrollable distance — on a short page, or zoomed out enough that
			// more content fits per screen (shrinking the scrollable range),
			// you'd hit the bottom before ever crossing it. Scale the
			// threshold to the actual scrollable distance instead.
			const threshold = Math.min(480, maxScroll * 0.5);
			visible = maxScroll > 0 && window.scrollY > threshold;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<button
	type="button"
	onclick={scrollToTop}
	aria-label="Back to top"
	class="fixed right-6 bottom-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/80 text-gray shadow-[var(--shadow-card-hover)] backdrop-blur-md transition-[opacity,transform,color,border-color] duration-200 hover:border-primary hover:text-primary"
	class:opacity-0={!visible}
	class:pointer-events-none={!visible}
	class:opacity-100={visible}
>
	<ArrowUp size={16} aria-hidden="true" />
</button>
