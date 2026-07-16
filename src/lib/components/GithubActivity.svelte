<script lang="ts">
	import { site } from '$lib/config';

	interface GithubEvent {
		id: string;
		type: string;
		repo: { name: string };
		created_at: string;
		payload?: { ref_type?: string; action?: string; commits?: unknown[] };
	}

	let events = $state<GithubEvent[]>([]);
	let status = $state<'loading' | 'ready' | 'error'>('loading');

	function describe(event: GithubEvent): string {
		switch (event.type) {
			case 'PushEvent': {
				const count = event.payload?.commits?.length ?? 1;
				return `pushed ${count} commit${count === 1 ? '' : 's'} to`;
			}
			case 'CreateEvent':
				return `created ${event.payload?.ref_type ?? 'a ref'} in`;
			case 'WatchEvent':
				return 'starred';
			case 'PullRequestEvent':
				return `${event.payload?.action ?? 'updated'} a pull request in`;
			case 'IssuesEvent':
				return `${event.payload?.action ?? 'updated'} an issue in`;
			case 'ForkEvent':
				return 'forked';
			default:
				return 'was active in';
		}
	}

	function relativeTime(iso: string): string {
		const diffMs = Date.now() - new Date(iso).getTime();
		const hours = Math.floor(diffMs / 3_600_000);
		if (hours < 1) return 'just now';
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	$effect(() => {
		let cancelled = false;

		fetch(`https://api.github.com/users/${site.githubUsername}/events/public?per_page=5`)
			.then((res) => {
				if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
				return res.json();
			})
			.then((data: GithubEvent[]) => {
				if (cancelled) return;
				events = data.slice(0, 5);
				status = 'ready';
			})
			.catch(() => {
				if (!cancelled) status = 'error';
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if status === 'loading'}
	<p class="text-sm text-dim">Loading recent activity…</p>
{:else if status === 'error'}
	<p class="text-sm text-dim">Couldn't reach GitHub right now.</p>
{:else if events.length === 0}
	<p class="text-sm text-dim">No recent public activity.</p>
{:else}
	<ul class="grid gap-3">
		{#each events as event (event.id)}
			<li class="flex items-baseline justify-between gap-4 text-sm">
				<span class="text-gray">
					{describe(event)}
					<a
						href={`https://github.com/${event.repo.name}`}
						class="link text-primary hover:opacity-85"
					>
						{event.repo.name}
					</a>
				</span>
				<span class="shrink-0 text-xs text-dim">{relativeTime(event.created_at)}</span>
			</li>
		{/each}
	</ul>
{/if}
