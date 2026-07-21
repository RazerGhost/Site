<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Check from '@lucide/svelte/icons/check';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { setQuickLinksSortByClicks } from '$lib/client/newtab-layout';
	import QuickLinkIcon from './QuickLinkIcon.svelte';
	import { QUICK_LINK_ICON_NAMES } from './quick-link-icons';
	import type { QuickLink } from '$lib/server/newtab-settings';

	let {
		open = $bindable(false),
		quickLinks,
		sortByClicks = $bindable(false)
	}: { open: boolean; quickLinks: QuickLink[]; sortByClicks: boolean } = $props();

	function close() {
		open = false;
		editingLinkId = null;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
	}

	function toggleSortByClicks() {
		sortByClicks = !sortByClicks;
		setQuickLinksSortByClicks(sortByClicks);
	}

	function moveQuickLink(id: number, direction: 'up' | 'down') {
		const body = new FormData();
		body.set('id', String(id));
		body.set('direction', direction);
		fetch('?/moveQuickLink', { method: 'POST', body }).then(() => invalidateAll());
	}

	// --- Add form ----------------------------------------------------------
	let newLinkLabel = $state('');
	let newLinkUrl = $state('');
	let newLinkIcon = $state<string | null>(null);
	let newLinkShortcut = $state('');

	function resetAddForm() {
		newLinkLabel = '';
		newLinkUrl = '';
		newLinkIcon = null;
		newLinkShortcut = '';
	}

	// --- Inline editing ------------------------------------------------------
	let editingLinkId = $state<number | null>(null);
	let editLabel = $state('');
	let editUrl = $state('');
	let editIcon = $state<string | null>(null);
	let editShortcut = $state('');

	function startEditingLink(link: QuickLink) {
		editingLinkId = link.id;
		editLabel = link.label;
		editUrl = link.url;
		editIcon = link.icon;
		editShortcut = link.shortcut ?? '';
	}

	function cancelEditingLink() {
		editingLinkId = null;
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
	<div
		class="modal-backdrop fixed inset-0 z-30 grid place-items-center overflow-y-auto p-4"
		role="presentation"
		onclick={close}
	>
		<div
			class="glass modal-card w-full max-w-md rounded-2xl p-5"
			role="dialog"
			aria-modal="true"
			aria-label="Quick links"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-white">Quick links</h2>
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={toggleSortByClicks}
						title={sortByClicks ? 'Showing most-clicked first' : 'Sort by most-clicked'}
						aria-label={sortByClicks ? 'Show quick links in manual order' : 'Sort quick links by most-clicked'}
						class="hover:text-primary {sortByClicks ? 'text-primary' : 'text-white/50'}"
					>
						<ArrowUpDown size={15} aria-hidden="true" />
					</button>
					<button type="button" onclick={close} aria-label="Close" class="text-white/50 hover:text-primary">
						<X size={16} aria-hidden="true" />
					</button>
				</div>
			</div>

			{#if quickLinks.length}
				<ul class="mt-4 grid gap-2">
					{#each quickLinks as link, i (link.id)}
						<li class="text-sm text-white/80">
							{#if editingLinkId === link.id}
								<form
									method="POST"
									action="?/editQuickLink"
									class="grid gap-2 rounded-xl border border-white/10 p-3"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											editingLinkId = null;
										};
									}}
								>
									<input type="hidden" name="id" value={link.id} />
									<input type="hidden" name="icon" value={editIcon ?? ''} />
									<div class="flex gap-2">
										<input
											name="label"
											type="text"
											bind:value={editLabel}
											placeholder="Label"
											class="glass w-1/2 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
										/>
										<input
											name="url"
											type="text"
											bind:value={editUrl}
											placeholder="example.com"
											class="glass w-1/2 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
										/>
									</div>
									<input
										name="shortcut"
										type="text"
										bind:value={editShortcut}
										placeholder="Keyboard shortcut (optional, one key)"
										maxlength="1"
										class="glass w-full rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
									/>
									<div class="flex flex-wrap gap-1.5 rounded-lg border border-white/10 p-2">
										<button
											type="button"
											onclick={() => (editIcon = null)}
											title="No icon (use site favicon)"
											aria-label="No icon"
											aria-pressed={editIcon === null}
											class="grid h-7 w-7 place-items-center rounded-md border text-[10px] text-white/40 {editIcon ===
											null
												? 'border-primary/60 text-primary'
												: 'border-white/10 hover:border-white/30'}"
										>
											Auto
										</button>
										{#each QUICK_LINK_ICON_NAMES as name (name)}
											<button
												type="button"
												onclick={() => (editIcon = name)}
												title={name}
												aria-label="Icon: {name}"
												aria-pressed={editIcon === name}
												class="grid h-7 w-7 place-items-center rounded-md border text-white/70 hover:text-primary {editIcon ===
												name
													? 'border-primary/60 text-primary'
													: 'border-white/10 hover:border-white/30'}"
											>
												<QuickLinkIcon icon={name} size={14} />
											</button>
										{/each}
									</div>
									<div class="flex justify-end gap-3">
										<button type="button" onclick={cancelEditingLink} class="text-xs text-white/50 hover:text-primary">
											Cancel
										</button>
										<button type="submit" class="flex items-center gap-1 text-xs text-primary">
											<Check size={12} aria-hidden="true" />
											Save
										</button>
									</div>
								</form>
							{:else}
								<div class="flex items-center justify-between gap-2 rounded-xl px-1 py-1">
									<span class="flex min-w-0 items-center gap-2 truncate">
										<span class="grid h-6 w-6 flex-shrink-0 place-items-center text-white/70">
											<QuickLinkIcon icon={link.icon} size={15} />
										</span>
										<span class="truncate">{link.label}</span>
										{#if link.shortcut}
											<span
												class="rounded border border-white/15 px-1 text-[10px] tracking-wide text-white/40 uppercase"
											>
												{link.shortcut}
											</span>
										{/if}
									</span>
									<div class="flex shrink-0 items-center gap-2 text-white/40">
										<button
											type="button"
											onclick={() => moveQuickLink(link.id, 'up')}
											disabled={i === 0}
											aria-label="Move {link.label} up"
											class="hover:text-primary disabled:pointer-events-none disabled:opacity-20"
										>
											<ArrowUp size={13} aria-hidden="true" />
										</button>
										<button
											type="button"
											onclick={() => moveQuickLink(link.id, 'down')}
											disabled={i === quickLinks.length - 1}
											aria-label="Move {link.label} down"
											class="hover:text-primary disabled:pointer-events-none disabled:opacity-20"
										>
											<ArrowDown size={13} aria-hidden="true" />
										</button>
										<button
											type="button"
											onclick={() => startEditingLink(link)}
											aria-label="Edit {link.label}"
											class="hover:text-primary"
										>
											<Pencil size={13} aria-hidden="true" />
										</button>
										<form method="POST" action="?/removeQuickLink" use:enhance>
											<input type="hidden" name="id" value={link.id} />
											<button type="submit" aria-label="Remove {link.label}" class="hover:text-primary">
												<X size={14} aria-hidden="true" />
											</button>
										</form>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-white/50">No quick links yet — add one below.</p>
			{/if}

			<form
				method="POST"
				action="?/addQuickLink"
				class="mt-4 grid gap-2 border-t border-white/10 pt-4"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						resetAddForm();
					};
				}}
			>
				<input type="hidden" name="icon" value={newLinkIcon ?? ''} />
				<div class="flex gap-2">
					<input
						name="label"
						type="text"
						bind:value={newLinkLabel}
						placeholder="Label"
						class="glass w-1/2 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
					/>
					<input
						name="url"
						type="text"
						bind:value={newLinkUrl}
						placeholder="example.com"
						class="glass w-1/2 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
					/>
				</div>
				<input
					name="shortcut"
					type="text"
					bind:value={newLinkShortcut}
					placeholder="Keyboard shortcut (optional, one key)"
					maxlength="1"
					class="glass w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
				/>
				<div class="flex flex-wrap gap-1.5 rounded-lg border border-white/10 p-2">
					<button
						type="button"
						onclick={() => (newLinkIcon = null)}
						title="No icon (use site favicon)"
						aria-label="No icon"
						aria-pressed={newLinkIcon === null}
						class="grid h-7 w-7 place-items-center rounded-md border text-[10px] text-white/40 {newLinkIcon ===
						null
							? 'border-primary/60 text-primary'
							: 'border-white/10 hover:border-white/30'}"
					>
						Auto
					</button>
					{#each QUICK_LINK_ICON_NAMES as name (name)}
						<button
							type="button"
							onclick={() => (newLinkIcon = name)}
							title={name}
							aria-label="Icon: {name}"
							aria-pressed={newLinkIcon === name}
							class="grid h-7 w-7 place-items-center rounded-md border text-white/70 hover:text-primary {newLinkIcon ===
							name
								? 'border-primary/60 text-primary'
								: 'border-white/10 hover:border-white/30'}"
						>
							<QuickLinkIcon icon={name} size={14} />
						</button>
					{/each}
				</div>
				<button
					type="submit"
					class="rounded-lg border border-white/15 py-1.5 text-sm text-white/80 transition-colors hover:border-primary/50 hover:text-primary"
				>
					Add quick link
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		background: rgba(5, 7, 10, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.modal-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
		border: 1px solid rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(24px) saturate(150%);
		-webkit-backdrop-filter: blur(24px) saturate(150%);
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
	}
</style>
