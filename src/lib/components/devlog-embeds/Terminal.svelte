<script lang="ts">
	import { parseLines } from './parse-lines';

	interface Props {
		lines?: string[] | string;
	}

	let { lines: rawLines = ['echo "hello from a devlog embed"', 'hello from a devlog embed'] }: Props =
		$props();

	const lines = $derived(parseLines(rawLines));

	// Precompute every intermediate typing frame up front (plain arrays, no
	// reactivity involved) so the interval below only ever does one $state
	// write per tick instead of mutating state from inside an async loop.
	const frames = $derived.by(() => {
		const result: string[][] = [];
		const current: string[] = [];
		for (const line of lines) {
			current.push('');
			for (const char of line) {
				current[current.length - 1] += char;
				result.push([...current]);
			}
		}
		return result;
	});

	let visible = $state<string[]>([]);

	$effect(() => {
		let i = 0;
		const interval = setInterval(() => {
			if (i >= frames.length) {
				clearInterval(interval);
				return;
			}
			visible = frames[i];
			i += 1;
		}, 18);

		return () => clearInterval(interval);
	});
</script>

<div class="card rounded-lg border border-border bg-surface p-4 font-mono text-sm">
	{#each visible as line, i}
		<p class="text-gray">
			{#if i % 2 === 0}<span class="text-primary">$</span>{/if}
			{line}
		</p>
	{/each}
</div>
