<script lang="ts">
	import { site } from '$lib/config';

	interface LanyardData {
		discord_status: 'online' | 'idle' | 'dnd' | 'offline';
		activities: { name: string; type: number }[];
	}

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let data = $state<LanyardData | null>(null);

	const statusColor: Record<LanyardData['discord_status'], string> = {
		online: 'bg-primary',
		idle: 'bg-warn',
		dnd: 'bg-danger',
		offline: 'bg-dim'
	};

	const statusLabel: Record<LanyardData['discord_status'], string> = {
		online: 'Online',
		idle: 'Idle',
		dnd: 'Do not disturb',
		offline: 'Offline'
	};

	async function poll() {
		try {
			const res = await fetch(`https://api.lanyard.rest/v1/users/${site.discordUserId}`);
			if (!res.ok) throw new Error(`Lanyard returned ${res.status}`);
			const json = await res.json();
			if (!json.success) throw new Error('Lanyard: user not found in cache');
			data = json.data;
			status = 'ready';
		} catch {
			status = 'error';
		}
	}

	$effect(() => {
		poll();
		const interval = setInterval(poll, 30_000);
		return () => clearInterval(interval);
	});

	const activityName = $derived(
		data?.activities.find((a) => a.type !== 4)?.name // type 4 = custom status text, skip for the headline
	);
</script>

{#if status === 'loading'}
	<p class="text-sm text-dim">Checking Discord status…</p>
{:else if status === 'error' || !data}
	<p class="text-sm text-dim">Discord status unavailable.</p>
{:else}
	<div class="flex items-center gap-2 text-sm">
		<span class={`h-2 w-2 rounded-full ${statusColor[data.discord_status]}`} aria-hidden="true"
		></span>
		<span class="text-gray">
			{statusLabel[data.discord_status]}
			{#if activityName}
				<span class="text-dim">— {activityName}</span>
			{/if}
		</span>
	</div>
{/if}
