<script lang="ts">
	// `lines` arrives as a plain string when set via a markdown data-lines
	// attribute — accept both a real array (programmatic use) and a
	// JSON-encoded one (markdown use), same convention as Terminal.svelte.
	interface Props {
		lines?: string[] | string;
	}

	let { lines: rawLines = ['graph TD', 'A[Write markdown] --> B[Embed a diagram]'] }: Props =
		$props();

	const source = $derived.by(() => {
		if (Array.isArray(rawLines)) return rawLines.join('\n');
		try {
			const parsed = JSON.parse(rawLines);
			return Array.isArray(parsed) ? parsed.join('\n') : rawLines;
		} catch {
			return rawLines;
		}
	});

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
