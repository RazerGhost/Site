/**
 * Scroll-reveal action, ported from RG-Digital/Site's [data-reveal] IntersectionObserver.
 * Usage: <section use:reveal>...</section>
 */
export function reveal(node: HTMLElement) {
	node.classList.add('reveal-init');

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('revealed');
					io.unobserve(node);
				}
			}
		},
		{ threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
	);

	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
}
