<script lang="ts">
	import { parseLines } from './parse-lines';

	interface Props {
		lines?: string[] | string;
	}

	let { lines: rawLines = ['graph TD', 'A[Write markdown] --> B[Embed a diagram]'] }: Props =
		$props();

	const source = $derived(parseLines(rawLines).join('\n'));

	let container: HTMLDivElement | undefined = $state();
	let error = $state('');

	function currentTheme(): 'dark' | 'default' {
		const stored = localStorage.getItem('theme');
		if (stored === 'light') return 'default';
		if (stored === 'dark') return 'dark';
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'default' : 'dark';
	}

	let counter = 0;

	$effect(() => {
		error = '';
		const target = container;
		const id = `mermaid-embed-${counter++}`;

		import('mermaid').then(async ({ default: mermaid }) => {
			mermaid.initialize({
				startOnLoad: false,
				theme: currentTheme(),
				fontFamily: 'Inter, system-ui, sans-serif',
				themeVariables: { primaryColor: '#22d3ee' }
			});

			try {
				const { svg } = await mermaid.render(id, source);
				if (target) target.innerHTML = svg;
			} catch {
				error = "Couldn't render this diagram.";
			}
		});
	});
</script>

<div class="card rounded-lg border border-border bg-surface p-4">
	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{:else}
		<div bind:this={container} class="flex justify-center overflow-x-auto"></div>
	{/if}
</div>
