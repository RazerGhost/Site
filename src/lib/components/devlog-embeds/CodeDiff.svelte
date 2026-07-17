<script lang="ts">
	import { parseLines } from './parse-lines';

	// Each line is prefixed '+' (added), '-' (removed), or left bare (context).
	interface Props {
		lines?: string[] | string;
	}

	let { lines: rawLines = [] }: Props = $props();

	const lines = $derived(parseLines(rawLines));

	function kind(line: string): 'add' | 'remove' | 'context' {
		if (line.startsWith('+')) return 'add';
		if (line.startsWith('-')) return 'remove';
		return 'context';
	}
</script>

<div class="card overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-sm">
	{#each lines as line}
		{@const type = kind(line)}
		<p
			class="-mx-2 whitespace-pre px-2 {type === 'add'
				? 'bg-primary/10 text-primary'
				: type === 'remove'
					? 'bg-danger/10 text-danger'
					: 'text-gray'}"
		>{line}</p>
	{/each}
</div>
