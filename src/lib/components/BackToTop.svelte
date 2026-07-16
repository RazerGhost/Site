<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';

	let visible = $state(false);

	$effect(() => {
		const onScroll = () => {
			visible = window.scrollY > 480;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<button
	type="button"
	onclick={scrollToTop}
	aria-label="Back to top"
	class="fixed right-6 bottom-6 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-gray shadow-[var(--shadow-card-hover)] transition-[opacity,transform,color,border-color] duration-200 hover:border-primary hover:text-primary"
	class:opacity-0={!visible}
	class:pointer-events-none={!visible}
	class:opacity-100={visible}
>
	<ArrowUp size={16} aria-hidden="true" />
</button>
