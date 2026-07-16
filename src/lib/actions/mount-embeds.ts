import { mount, unmount } from 'svelte';
import { embedRegistry } from '$lib/components/devlog-embeds/registry';

export function mountEmbeds(container: HTMLElement): () => void {
	const mounted: Record<string, unknown>[] = [];

	container.querySelectorAll<HTMLElement>('[data-embed]').forEach((el) => {
		const name = el.dataset.embed;
		const Component = name ? embedRegistry[name] : undefined;
		if (!Component) return;

		el.textContent = '';
		mounted.push(mount(Component, { target: el }));
	});

	return () => {
		mounted.forEach((instance) => unmount(instance));
	};
}
