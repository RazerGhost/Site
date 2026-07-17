<script lang="ts">
	interface Props {
		type?: 'info' | 'tip' | 'warn' | 'danger';
		text?: string;
	}

	let { type = 'info', text = '' }: Props = $props();

	const styles: Record<string, { border: string; text: string; label: string }> = {
		info: { border: 'border-border', text: 'text-gray', label: 'Note' },
		tip: { border: 'border-primary/40', text: 'text-primary', label: 'Tip' },
		warn: { border: 'border-warn/40', text: 'text-warn', label: 'Warning' },
		danger: { border: 'border-danger/40', text: 'text-danger', label: 'Careful' }
	};

	const style = $derived(styles[type] ?? styles.info);
</script>

<div class="card rounded-lg border {style.border} bg-surface p-4">
	<p class="text-xs font-semibold uppercase tracking-wide {style.text}">{style.label}</p>
	<p class="mt-1.5 text-sm leading-relaxed text-gray">{text}</p>
</div>
