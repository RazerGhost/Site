<script lang="ts">
	import { site } from '$lib/config';

	let { limit = 5 }: { limit?: number } = $props();

	interface GithubEvent {
		id: string;
		type: string;
		repo: { name: string };
		created_at: string;
		payload?: { ref_type?: string; action?: string; before?: string; head?: string; size?: number };
	}

	interface CommitSummary {
		sha: string;
		message: string;
	}

	let events = $state<GithubEvent[]>([]);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let expandedId = $state<string | null>(null);
	let commitsByEvent = $state<Record<string, CommitSummary[] | 'loading' | 'error'>>({});

	function isPush(event: GithubEvent) {
		return event.type === 'PushEvent' && event.payload?.before && event.payload?.head;
	}

	async function toggle(event: GithubEvent) {
		if (!isPush(event)) return;
		if (expandedId === event.id) {
			expandedId = null;
			return;
		}
		expandedId = event.id;
		if (commitsByEvent[event.id]) return;

		commitsByEvent[event.id] = 'loading';
		try {
			const res = await fetch(
				`https://api.github.com/repos/${event.repo.name}/compare/${event.payload!.before}...${event.payload!.head}`
			);
			if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
			const body = await res.json();
			commitsByEvent[event.id] = (body.commits ?? [])
				.map((c: { sha: string; commit: { message: string } }) => ({
					sha: c.sha,
					message: c.commit.message.split('\n')[0]
				}))
				.reverse();
		} catch {
			commitsByEvent[event.id] = 'error';
		}
	}

	function describe(event: GithubEvent): string {
		switch (event.type) {
			case 'PushEvent': {
				const count = event.payload?.size ?? 1;
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

		fetch(`https://api.github.com/users/${site.githubUsername}/events/public?per_page=${limit}`)
			.then((res) => {
				if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
				return res.json();
			})
			.then((data: GithubEvent[]) => {
				if (cancelled) return;
				events = data.slice(0, limit);
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
	<ul class="grid gap-1">
		{#each events as event (event.id)}
			{@const expandable = isPush(event)}
			<li>
				<button
					type="button"
					class="flex w-full items-baseline justify-between gap-4 rounded-md px-2 py-1.5 text-left text-sm transition-colors {expandable
						? 'cursor-pointer hover:bg-surface-2'
						: 'cursor-default'}"
					onclick={() => toggle(event)}
					aria-expanded={expandedId === event.id}
					disabled={!expandable}
				>
					<span class="text-gray">
						{#if expandable}
							<span
								class="mr-1 inline-block text-dim transition-transform {expandedId === event.id
									? 'rotate-90'
									: ''}">›</span
							>
						{/if}
						{describe(event)}
						<a
							href={`https://github.com/${event.repo.name}`}
							class="link text-primary hover:opacity-85"
							onclick={(e) => e.stopPropagation()}
						>
							{event.repo.name}
						</a>
					</span>
					<span class="shrink-0 text-xs text-dim">{relativeTime(event.created_at)}</span>
				</button>

				{#if expandable && expandedId === event.id}
					{@const commits = commitsByEvent[event.id]}
					<div class="ml-5 border-l border-border py-1 pl-3">
						{#if commits === 'loading' || commits === undefined}
							<p class="text-xs text-dim">Loading commits…</p>
						{:else if commits === 'error'}
							<p class="text-xs text-dim">Couldn't load commits.</p>
						{:else}
							<ul class="grid gap-1">
								{#each commits as commit (commit.sha)}
									<li class="truncate text-xs text-dim" title={commit.message}>
										<a
											href={`https://github.com/${event.repo.name}/commit/${commit.sha}`}
											class="link hover:text-primary"
										>
											{commit.message}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
