import { mount, unmount } from 'svelte';
import { embedRegistry } from '$lib/components/devlog-embeds/registry';

export function mountEmbeds(container: HTMLElement): () => void {
	const mounted: Record<string, unknown>[] = [];

	container.querySelectorAll<HTMLElement>('[data-embed]').forEach((el) => {
		const name = el.dataset.embed;
		const Component = name ? embedRegistry[name] : undefined;
		if (!Component) return;

		// Any other data-* attributes on the placeholder (besides data-embed)
		// are passed through as props, e.g. data-before="/a.png" -> { before: '/a.png' }.
		const { embed: _embed, ...props } = el.dataset;

		el.textContent = '';
		mounted.push(mount(Component, { target: el, props }));
	});

	return () => {
		mounted.forEach((instance) => unmount(instance));
	};
}
