<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	// `lines` arrives as a plain string when set via a markdown data-lines
	// attribute — accept both a real array (programmatic use) and a
	// JSON-encoded one (markdown use), same convention as Terminal.svelte.
	// Lines prefixed "$ " are commands (typed out); everything else is
	// output (appears instantly, like real stdout).
	interface Props {
		lines?: string[] | string;
	}

	let {
		lines: rawLines = ['$ echo "hello from a devlog embed"', 'hello from a devlog embed']
	}: Props = $props();

	interface Step {
		type: 'cmd' | 'out';
		text: string;
	}

	const steps = $derived.by((): Step[] => {
		let parsed: unknown = rawLines;
		if (!Array.isArray(parsed)) {
			try {
				parsed = JSON.parse(rawLines as string);
			} catch {
				parsed = [rawLines];
			}
		}
		const arr = Array.isArray(parsed) ? parsed : [String(parsed)];
		return arr.map((line: string) =>
			line.startsWith('$ ') ? { type: 'cmd', text: line.slice(2) } : { type: 'out', text: line }
		);
	});

	let visible = $state<Step[]>([]);
	let typingText = $state('');
	let done = $state(false);
	let replayKey = $state(0);

	const nextIsCmd = $derived(!done && steps[visible.length]?.type === 'cmd');

	$effect(() => {
		// depend on both so a replay or a change to the source lines restarts
		// the sequence from the top
		steps;
		replayKey;

		visible = [];
		typingText = '';
		done = false;

		let cancelled = false;
		const timeouts: ReturnType<typeof setTimeout>[] = [];
		const wait = (ms: number) =>
			new Promise<void>((resolve) => {
				timeouts.push(setTimeout(resolve, ms));
			});

		async function run() {
			for (const step of steps) {
				if (cancelled) return;
				if (step.type === 'cmd') {
					for (let i = 1; i <= step.text.length; i++) {
						if (cancelled) return;
						await wait(18);
						typingText = step.text.slice(0, i);
					}
					await wait(300);
				} else {
					await wait(150);
				}
				if (cancelled) return;
				visible = [...visible, step];
				typingText = '';
			}
			if (!cancelled) done = true;
		}

		run();

		return () => {
			cancelled = true;
			timeouts.forEach(clearTimeout);
		};
	});
</script>

<div class="card relative rounded-lg border border-border bg-surface p-4 font-mono text-sm">
	{#each visible as step, i (i)}
		<p class={step.type === 'cmd' ? 'text-gray' : 'text-dim'}>
			{#if step.type === 'cmd'}<span class="text-primary">$</span>{' '}{/if}{step.text}
		</p>
	{/each}
	{#if nextIsCmd}
		<p class="text-gray">
			<span class="text-primary">$</span> {typingText}<span class="animate-pulse">▍</span>
		</p>
	{/if}

	{#if done}
		<button
			type="button"
			onclick={() => replayKey++}
			class="absolute top-3 right-3 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-dim transition-colors hover:border-primary hover:text-primary"
		>
			<RotateCcw size={12} aria-hidden="true" /> Replay
		</button>
	{/if}
</div>
