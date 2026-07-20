<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import ListeningNowCard from '$lib/components/ListeningNowCard.svelte';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import Music from '@lucide/svelte/icons/music';
	import Search from '@lucide/svelte/icons/search';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Settings from '@lucide/svelte/icons/settings';
	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Timer from '@lucide/svelte/icons/timer';
	import Star from '@lucide/svelte/icons/star';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import StretchHorizontal from '@lucide/svelte/icons/stretch-horizontal';
	import { enhance } from '$app/forms';
	import { navLinks } from '$lib/config';
	import {
		getFloatPosition,
		setFloatPosition,
		clearFloatPosition,
		resetAllFloatPositions,
		getWidgetOrder,
		setWidgetOrder,
		resetWidgetOrder,
		getFullWidthIds,
		setFullWidthIds,
		resetFullWidth,
		type FloatPosition
	} from '$lib/client/newtab-layout';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let settingsOpen = $state(false);
	let queryInput = $state(data.unsplashQuery);

	// Notes is intentionally left out of the site-wide nav (it's a private,
	// login-gated route) — but it belongs on this personal dashboard, so it's
	// appended here rather than added to the shared navLinks config.
	const dashboardLinks = [...navLinks, { label: 'Notes', href: '/notes' }];

	const linkIcons = {
		Projects: FolderGit2,
		Devlog: NotebookPen,
		Gear: Wrench,
		Watchlist: Clapperboard,
		Listens: Music,
		Notes: StickyNote
	} as const;

	// Search bangs — !g google, !yt youtube, !gh github, !w wikipedia.
	// Anything else (or no bang) falls through to DuckDuckGo, same as before.
	const bangs: Record<string, (q: string) => string> = {
		'!d': (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
		'!yt': (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
		'!gh': (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
		'!w': (q) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`
	};

	let query = $state('');
	let searchInputEl = $state<HTMLInputElement | undefined>();

	// Fire-and-forget — logs the search before the page navigates away, so we
	// don't hold up the redirect waiting on a round trip.
	function logSearch(q: string) {
		const body = new FormData();
		body.set('query', q);
		fetch('?/logSearch', { method: 'POST', body }).catch(() => {});
	}

	// Pasting or typing an actual URL (or a bare domain like "github.com")
	// should navigate straight there instead of searching DuckDuckGo for it.
	function urlToOpen(input: string): string | null {
		if (/^https?:\/\/\S+$/i.test(input)) return input;
		if (/\s/.test(input)) return null;
		const isBareDomain = /^(localhost|[a-z0-9-]+(\.[a-z0-9-]+)+)(:\d+)?(\/\S*)?$/i.test(input);
		return isBareDomain ? `https://${input}` : null;
	}

	function runSearch(raw: string) {
		const trimmed = raw.trim();
		if (!trimmed) return;
		logSearch(trimmed);

		const directUrl = urlToOpen(trimmed);
		if (directUrl) {
			window.location.href = directUrl;
			return;
		}

		const [maybeBang, ...rest] = trimmed.split(' ');
		const bang = bangs[maybeBang.toLowerCase()];
		if (bang && rest.length) {
			window.location.href = bang(rest.join(' '));
			return;
		}
		window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		runSearch(query);
	}

	// "/" focuses search from anywhere on the page (skipped while already
	// typing in a field); Escape clears and blurs the search box.
	function handleGlobalKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
		if (event.key === '/' && !isTyping) {
			event.preventDefault();
			searchInputEl?.focus();
		} else if (event.key === 'Escape' && target === searchInputEl) {
			query = '';
			searchInputEl?.blur();
		}
	}

	let now = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(timer);
	});

	const timeString = $derived(
		now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
	);
	const greeting = $derived.by(() => {
		const hour = now.getHours();
		if (hour < 5) return 'Still up';
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});

	// --- Quick links -----------------------------------------------------
	let quickLinksOpen = $state(false);
	let newLinkLabel = $state('');
	let newLinkUrl = $state('');

	function faviconFor(url: string): string | null {
		try {
			const host = new URL(url).hostname;
			return `https://icons.duckduckgo.com/ip3/${host}.ico`;
		} catch {
			return null;
		}
	}

	// Fire-and-forget click tracking — doesn't block the anchor's own
	// navigation, just records it server-side for the clicks column.
	function trackQuickLinkClick(id: number) {
		const body = new FormData();
		body.set('id', String(id));
		fetch('?/clickQuickLink', { method: 'POST', body }).catch(() => {});
	}

	// --- Weather (client-side, no API key — Open-Meteo) -------------------
	type WeatherState = { tempF: number; code: number } | 'denied' | 'unavailable' | 'timeout' | 'error' | null;
	let weather = $state<WeatherState>(null);

	function weatherLabel(code: number): string {
		if (code === 0) return 'Clear';
		if (code <= 3) return 'Partly cloudy';
		if (code <= 48) return 'Foggy';
		if (code <= 67) return 'Rainy';
		if (code <= 77) return 'Snowy';
		if (code <= 82) return 'Showers';
		if (code <= 99) return 'Stormy';
		return 'Unknown';
	}

	async function fetchWeather(latitude: number, longitude: number): Promise<boolean> {
		try {
			const res = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
			);
			if (!res.ok) return false;
			const body = await res.json();
			weather = { tempF: Math.round(body.current.temperature_2m), code: body.current.weather_code };
			return true;
		} catch {
			return false;
		}
	}

	// IP-based lookup — coarser (city-level, not GPS-precise) but instant and
	// permission-free, so it's used as the fallback whenever the browser's
	// Geolocation API is denied, unavailable, or just times out (which in
	// practice was the common case — no prompt ever getting a real GPS/network
	// fix back within a few seconds).
	async function fetchWeatherByIp(): Promise<boolean> {
		try {
			const res = await fetch('https://ipwho.is/');
			if (!res.ok) return false;
			const body = await res.json();
			if (!body.success || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') return false;
			return fetchWeather(body.latitude, body.longitude);
		} catch {
			return false;
		}
	}

	function loadWeather() {
		weather = null;

		if (!navigator.geolocation) {
			fetchWeatherByIp().then((ok) => {
				if (!ok) weather = 'error';
			});
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const ok = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
				if (!ok) weather = 'error';
			},
			(err) => {
				// GeolocationPositionError codes: 1 = PERMISSION_DENIED, 2 =
				// POSITION_UNAVAILABLE, 3 = TIMEOUT. Any of these fall back to
				// IP-based geolocation rather than immediately giving up.
				fetchWeatherByIp().then((ok) => {
					if (ok) return;
					if (err.code === err.PERMISSION_DENIED) weather = 'denied';
					else if (err.code === err.TIMEOUT) weather = 'timeout';
					else weather = 'unavailable';
				});
			},
			// A short timeout is fine now that a fast IP-based fallback exists —
			// no reason to make someone wait 15s to find out GPS isn't working.
			{ timeout: 5000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false }
		);
	}

	$effect(() => {
		loadWeather();
	});

	// --- Background photo cycling/favoriting -------------------------------
	let currentPhoto = $state(data.photo);
	let favoritedOverride = $state<boolean | null>(null);
	const currentPhotoId = $derived(data.photoHistory.find((p) => p.url === currentPhoto?.url)?.id ?? null);
	const currentPhotoFavorited = $derived(
		favoritedOverride ?? data.photoHistory.find((p) => p.url === currentPhoto?.url)?.favorited ?? false
	);

	function toggleFavoritePhoto() {
		if (!currentPhotoId) return;
		favoritedOverride = !currentPhotoFavorited;
		const body = new FormData();
		body.set('id', String(currentPhotoId));
		fetch('?/favoritePhoto', { method: 'POST', body }).catch(() => {});
	}

	// --- Pomodoro timer (client-only state, completed segments logged server-side) --------------------
	const WORK_SECONDS = 25 * 60;
	const BREAK_SECONDS = 5 * 60;
	let pomodoroSecondsLeft = $state(WORK_SECONDS);
	let pomodoroRunning = $state(false);
	let pomodoroOnBreak = $state(false);
	let segmentStartedAt = $state<string | null>(null);

	function logFocusSegment(kind: 'focus' | 'break', completed: boolean) {
		if (!segmentStartedAt) return;
		const body = new FormData();
		body.set('kind', kind);
		body.set('completed', String(completed));
		body.set('startedAt', segmentStartedAt);
		body.set('endedAt', new Date().toISOString());
		fetch('?/logFocusSession', { method: 'POST', body }).catch(() => {});
	}

	$effect(() => {
		if (!pomodoroRunning) return;
		if (!segmentStartedAt) segmentStartedAt = new Date().toISOString();
		const interval = setInterval(() => {
			if (pomodoroSecondsLeft <= 1) {
				logFocusSegment(pomodoroOnBreak ? 'break' : 'focus', true);
				pomodoroOnBreak = !pomodoroOnBreak;
				pomodoroSecondsLeft = pomodoroOnBreak ? BREAK_SECONDS : WORK_SECONDS;
				segmentStartedAt = new Date().toISOString();
			} else {
				pomodoroSecondsLeft -= 1;
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	function togglePomodoro() {
		pomodoroRunning = !pomodoroRunning;
		if (!pomodoroRunning) {
			logFocusSegment(pomodoroOnBreak ? 'break' : 'focus', false);
			segmentStartedAt = null;
		}
	}

	function resetPomodoro() {
		if (pomodoroRunning) logFocusSegment(pomodoroOnBreak ? 'break' : 'focus', false);
		pomodoroRunning = false;
		pomodoroOnBreak = false;
		pomodoroSecondsLeft = WORK_SECONDS;
		segmentStartedAt = null;
	}

	const pomodoroTimeString = $derived(
		`${Math.floor(pomodoroSecondsLeft / 60)
			.toString()
			.padStart(2, '0')}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')}`
	);

	// --- Quick note capture --------------------------------------------
	let noteBody = $state('');
	let noteSaved = $state(false);

	// --- Free-floating widgets ---------------------------------------------
	// Any widget can be dragged out of its grid slot by its grip handle; once
	// dragged it becomes position:fixed and remembers its spot per-device via
	// localStorage (see $lib/client/newtab-layout.ts) — deliberately not
	// synced server-side, this is layout preference, not data.
	const WIDGET_IDS = [
		'right-now',
		'now-playing',
		'discord',
		'recent-notes',
		'watching',
		'weather',
		'focus',
		'note'
	] as const;
	type WidgetId = (typeof WIDGET_IDS)[number];

	const WIDGET_META: Record<WidgetId, { label: string; icon: typeof Music | null }> = {
		'right-now': { label: 'Right now', icon: null },
		'now-playing': { label: 'Now playing', icon: Music },
		discord: { label: 'Discord', icon: null },
		'recent-notes': { label: 'Recent notes', icon: ScrollText },
		watching: { label: 'Currently watching', icon: Clapperboard },
		weather: { label: 'Weather', icon: CloudSun },
		focus: { label: 'Focus timer', icon: Timer },
		note: { label: 'Quick note', icon: StickyNote }
	};

	let widgetEls: Partial<Record<WidgetId, HTMLDivElement>> = {};
	let floatPositions = $state<Partial<Record<WidgetId, FloatPosition>>>({});
	// Persisted grid order (see $lib/client/newtab-layout.ts) — a widget's
	// slot within the grid, independent of whether it's currently floating.
	let widgetOrder = $state<WidgetId[]>([...WIDGET_IDS]);
	let dragOverId = $state<WidgetId | null>(null);
	// Widgets stretched to span the full grid row instead of one column, by
	// default for the two whose content genuinely wants the space — a
	// paragraph of status text and a text input aren't usable squeezed into
	// a third of the grid. Everything else defaults to one column, which is
	// what the rest were actually designed at (poster thumbnails, a short
	// stat line, etc.) — still overridable per-widget via the stretch toggle.
	const DEFAULT_FULL_WIDTH_IDS: WidgetId[] = ['right-now', 'note'];
	let fullWidthIds = $state<Set<WidgetId>>(new Set(DEFAULT_FULL_WIDTH_IDS));

	$effect(() => {
		const loaded: Partial<Record<WidgetId, FloatPosition>> = {};
		for (const id of WIDGET_IDS) {
			const pos = getFloatPosition(id);
			if (pos) loaded[id] = pos;
		}
		floatPositions = loaded;

		const savedOrder = getWidgetOrder();
		if (savedOrder) {
			// Guard against a stale saved order (widgets renamed/removed since
			// it was written) by keeping only known ids, then appending any
			// new ids the saved order predates.
			const known = savedOrder.filter((id): id is WidgetId => (WIDGET_IDS as readonly string[]).includes(id));
			const missing = WIDGET_IDS.filter((id) => !known.includes(id));
			widgetOrder = [...known, ...missing];
		}

		// null = never saved, so keep the defaults above; a saved (even
		// empty) array means the user has explicitly chosen a set and that
		// should win outright, including "nothing full-width."
		const savedFullWidth = getFullWidthIds();
		fullWidthIds = new Set(
			(savedFullWidth ?? DEFAULT_FULL_WIDTH_IDS).filter((id): id is WidgetId =>
				(WIDGET_IDS as readonly string[]).includes(id)
			)
		);
	});

	function setsEqual(set: Set<WidgetId>, ids: WidgetId[]): boolean {
		return set.size === ids.length && ids.every((id) => set.has(id));
	}

	function toggleFullWidth(id: WidgetId) {
		const next = new Set(fullWidthIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		fullWidthIds = next;
		setFullWidthIds([...next]);
	}

	// Single pointer-based gesture drives both reordering and floating —
	// native HTML5 drag-and-drop (the previous approach) unreliably lost the
	// drag whenever it started over a link, button, or text input inside a
	// widget (the browser hijacks it into a link/text drag instead), which
	// made reordering feel broken. Grabbing the grip now always works the
	// same way regardless of what's under the cursor: the widget detaches
	// and visibly follows the pointer (activeDragId drives the "lifted"
	// look below); if you release it over another docked widget, that
	// widget highlights and the drag reorders into that slot; release
	// anywhere else and it stays floating at the drop point.
	let activeDragId = $state<WidgetId | null>(null);

	// document.elementFromPoint would otherwise always hit the dragged
	// widget itself (it's rendered right under the cursor) — hiding it from
	// hit-testing for the duration of the lookup reveals whatever's beneath.
	function widgetIdUnderPoint(x: number, y: number, excludeId: WidgetId): WidgetId | null {
		const excludeEl = widgetEls[excludeId];
		const prevPointerEvents = excludeEl?.style.pointerEvents;
		if (excludeEl) excludeEl.style.pointerEvents = 'none';
		const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-widget-id]');
		if (excludeEl) excludeEl.style.pointerEvents = prevPointerEvents ?? '';
		const hitId = hit?.dataset.widgetId as WidgetId | undefined;
		return hitId && hitId !== excludeId ? hitId : null;
	}

	function startDrag(event: PointerEvent, id: WidgetId) {
		event.preventDefault();
		const el = widgetEls[id];
		if (!el) return;

		const existing = floatPositions[id];
		const rect = el.getBoundingClientRect();
		const origin = existing ?? { x: rect.left, y: rect.top, width: rect.width };
		floatPositions = { ...floatPositions, [id]: origin };
		activeDragId = id;

		const startX = event.clientX;
		const startY = event.clientY;
		let moved = false;

		function onMove(e: PointerEvent) {
			moved = true;
			floatPositions = {
				...floatPositions,
				[id]: { x: origin.x + (e.clientX - startX), y: origin.y + (e.clientY - startY), width: origin.width }
			};
			dragOverId = widgetIdUnderPoint(e.clientX, e.clientY, id);
		}
		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			activeDragId = null;

			const targetId = dragOverId;
			dragOverId = null;

			if (moved && targetId) {
				// Dropped on another widget — reorder into its slot and dock
				// back into the grid rather than staying floated.
				const next = { ...floatPositions };
				delete next[id];
				floatPositions = next;
				clearFloatPosition(id);

				const nextOrder = widgetOrder.filter((w) => w !== id);
				nextOrder.splice(nextOrder.indexOf(targetId), 0, id);
				widgetOrder = nextOrder;
				setWidgetOrder(nextOrder);
			} else if (moved) {
				// Dropped on open space — stays floating at the drop point.
				const final = floatPositions[id];
				if (final) setFloatPosition(id, final);
			} else if (!existing) {
				// Just a click, not a drag — undo the provisional float we
				// set at the start so a plain click on the grip is a no-op.
				const reverted = { ...floatPositions };
				delete reverted[id];
				floatPositions = reverted;
			}
		}
		// Listening on window (rather than the small grip handle) means the
		// drag keeps tracking even once the pointer leaves the handle's tiny
		// hit area — no pointer capture needed, and pointerup/pointercancel
		// are always removed in pairs so listeners can't stack across drags.
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
	}

	// Double-clicking a grip handle docks that widget back into its grid
	// slot — a quick escape hatch alongside dragging it back over another
	// widget (also cleared in bulk by "Reset widget layout").
	function dockWidget(id: WidgetId) {
		const next = { ...floatPositions };
		delete next[id];
		floatPositions = next;
		clearFloatPosition(id);
	}

	function resetLayout() {
		resetAllFloatPositions();
		resetWidgetOrder();
		resetFullWidth();
		floatPositions = {};
		widgetOrder = [...WIDGET_IDS];
		fullWidthIds = new Set(DEFAULT_FULL_WIDTH_IDS);
	}

	function widgetClass(id: WidgetId): string {
		const base = 'rounded-xl border p-3 transition-all';
		if (floatPositions[id]) {
			const lifted = activeDragId === id ? ' scale-105 opacity-90' : '';
			return `glass floating-widget rounded-2xl p-4${lifted}`;
		}
		const span = fullWidthIds.has(id) ? ' sm:col-span-3' : '';
		if (dragOverId === id) return `${base} border-primary bg-primary/10 ring-2 ring-primary/50${span}`;
		return `${base} border-white/10${span}`;
	}

	function widgetStyle(id: WidgetId): string {
		const pos = floatPositions[id];
		if (pos) return `position:fixed; left:${pos.x}px; top:${pos.y}px; width:${pos.width}px; z-index:15; pointer-events:${activeDragId === id ? 'none' : 'auto'};`;
		return `order:${widgetOrder.indexOf(id)};`;
	}
</script>

<svelte:head>
	<title>New Tab</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if currentPhoto}
	<div class="photo-bg" aria-hidden="true" style:background-image="url({currentPhoto.url})"></div>
	<div class="photo-bg-scrim" aria-hidden="true"></div>
	<div class="glass fixed right-4 bottom-4 z-10 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70">
		Photo by
		<a
			href={currentPhoto.photographerProfileUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="text-white/90 hover:text-primary"
		>
			{currentPhoto.photographerName}
		</a>
		on
		<a
			href={currentPhoto.photoPageUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="text-white/90 hover:text-primary"
		>
			Unsplash
		</a>
		{#if data.photoHistory.length > 1}
			<form
				method="POST"
				action="?/cyclePhoto"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.photo) {
							currentPhoto = result.data.photo as typeof currentPhoto;
							favoritedOverride = null;
						}
					};
				}}
			>
				<input type="hidden" name="currentUrl" value={currentPhoto.url} />
				<button type="submit" aria-label="Shuffle background" class="text-white/60 hover:text-primary">
					<Shuffle size={13} aria-hidden="true" />
				</button>
			</form>
		{/if}
		{#if currentPhotoId}
			<button
				type="button"
				onclick={toggleFavoritePhoto}
				aria-label={currentPhotoFavorited ? 'Unfavorite this background' : 'Favorite this background'}
				class="hover:text-primary {currentPhotoFavorited ? 'text-primary' : 'text-white/60'}"
			>
				<Star size={13} aria-hidden="true" fill={currentPhotoFavorited ? 'currentColor' : 'none'} />
			</button>
		{/if}
	</div>
{:else}
	<div class="aurora" aria-hidden="true">
		<span class="aurora-blob aurora-blob--1"></span>
		<span class="aurora-blob aurora-blob--2"></span>
		<span class="aurora-blob aurora-blob--3"></span>
	</div>
{/if}

<div class="fixed top-4 right-4 z-20 flex gap-2">
	{#if Object.keys(floatPositions).length || !setsEqual(fullWidthIds, DEFAULT_FULL_WIDTH_IDS) || widgetOrder.some((id, i) => id !== WIDGET_IDS[i])}
		<button
			type="button"
			onclick={resetLayout}
			aria-label="Reset widget layout"
			class="glass glass--interactive grid h-9 w-9 place-items-center rounded-full text-white/70 hover:text-primary"
		>
			<LayoutGrid size={16} aria-hidden="true" />
		</button>
	{/if}
	<button
		type="button"
		onclick={() => (quickLinksOpen = !quickLinksOpen)}
		aria-label="Edit quick links"
		class="glass glass--interactive grid h-9 w-9 place-items-center rounded-full text-white/70 hover:text-primary"
	>
		<Plus size={16} aria-hidden="true" />
	</button>
	{#if data.unsplashConfigured}
		<button
			type="button"
			onclick={() => (settingsOpen = !settingsOpen)}
			aria-label="Background settings"
			class="glass glass--interactive grid h-9 w-9 place-items-center rounded-full text-white/70 hover:text-primary"
		>
			<Settings size={16} aria-hidden="true" />
		</button>
	{/if}
</div>

{#if settingsOpen}
	<div class="glass fixed top-16 right-4 z-20 w-72 rounded-2xl p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">Background</h2>
			<button
				type="button"
				onclick={() => (settingsOpen = false)}
				aria-label="Close"
				class="text-white/50 hover:text-primary"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</div>
		<form
			method="POST"
			action="?/updateBackground"
			class="mt-3"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					settingsOpen = false;
				};
			}}
		>
			<label class="block text-xs text-white/50" for="unsplash-query">Photo search terms</label>
			<input
				id="unsplash-query"
				name="query"
				type="text"
				bind:value={queryInput}
				placeholder="cinematic mountains"
				class="glass mt-1.5 w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
			/>
			<button
				type="submit"
				class="mt-3 w-full rounded-lg bg-primary/90 py-2 text-sm font-medium text-black transition-colors hover:bg-primary"
			>
				Save
			</button>
		</form>
	</div>
{/if}

{#if quickLinksOpen}
	<div class="glass fixed top-16 right-4 z-20 w-80 rounded-2xl p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wide text-white/50 uppercase">Quick links</h2>
			<button
				type="button"
				onclick={() => (quickLinksOpen = false)}
				aria-label="Close"
				class="text-white/50 hover:text-primary"
			>
				<X size={14} aria-hidden="true" />
			</button>
		</div>

		<ul class="mt-3 grid gap-1.5">
			{#each data.quickLinks as link (link.id)}
				<li class="flex items-center justify-between gap-2 text-sm text-white/80">
					<span class="truncate">{link.label}</span>
					<form method="POST" action="?/removeQuickLink" use:enhance>
						<input type="hidden" name="id" value={link.id} />
						<button
							type="submit"
							aria-label="Remove {link.label}"
							class="shrink-0 text-white/40 hover:text-primary"
						>
							<X size={13} aria-hidden="true" />
						</button>
					</form>
				</li>
			{/each}
		</ul>

		<form
			method="POST"
			action="?/addQuickLink"
			class="mt-3 grid gap-1.5"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					newLinkLabel = '';
					newLinkUrl = '';
				};
			}}
		>
			<input
				name="label"
				type="text"
				bind:value={newLinkLabel}
				placeholder="Label"
				class="glass w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
			/>
			<input
				name="url"
				type="text"
				bind:value={newLinkUrl}
				placeholder="example.com"
				class="glass w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
			/>
			<button
				type="submit"
				class="rounded-lg border border-white/15 py-1.5 text-sm text-white/80 transition-colors hover:border-primary/50 hover:text-primary"
			>
				Add
			</button>
		</form>
	</div>
{/if}

<main class="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-6">
	<div class="text-center">
		<p class="text-6xl font-bold tracking-tight text-white tabular-nums">{timeString}</p>
		<p class="mt-2 text-lg text-white/70">{greeting}.</p>
	</div>

	<form class="mx-auto mt-6 w-full max-w-lg" onsubmit={submitSearch}>
		<label class="relative block">
			<input
				bind:this={searchInputEl}
				type="search"
				bind:value={query}
				autofocus
				placeholder="Search or paste a link… (try !d, !yt, !gh, !w)"
				class="glass w-full rounded-full py-3 pr-4 pl-10 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
			/>
			<Search
				size={16}
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/50"
			/>
		</label>
	</form>

	{#if data.recentSearches.length}
		<div class="mx-auto mt-2 flex max-w-lg flex-wrap justify-center gap-1.5">
			{#each data.recentSearches as recent}
				<button
					type="button"
					onclick={() => runSearch(recent)}
					class="rounded-full px-2.5 py-1 text-xs text-white/40 transition-colors hover:text-primary"
				>
					{recent}
				</button>
			{/each}
		</div>
	{/if}

	<nav class="mx-auto mt-6 flex flex-wrap justify-center gap-2">
		{#each dashboardLinks as link}
			{@const Icon = linkIcons[link.label as keyof typeof linkIcons]}
			<a
				href={link.href}
				class="glass glass--interactive flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:text-primary"
			>
				{#if Icon}
					<Icon size={15} aria-hidden="true" />
				{/if}
				{link.label}
			</a>
		{/each}
	</nav>

	{#if data.quickLinks.length}
		<div class="mx-auto mt-4 flex flex-wrap justify-center gap-2">
			{#each data.quickLinks as link (link.id)}
				<a
					href={link.url}
					onclick={() => trackQuickLinkClick(link.id)}
					class="glass glass--interactive flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-primary"
				>
					{#if faviconFor(link.url)}
						<img src={faviconFor(link.url)} alt="" class="h-3.5 w-3.5 rounded-sm" />
					{/if}
					{link.label}
				</a>
			{/each}
		</div>
	{/if}

	<section class="glass-card mt-6 rounded-2xl p-5">
		<div class="grid gap-3 sm:grid-cols-3">
			{#each WIDGET_IDS as id (id)}
				{@const meta = WIDGET_META[id]}
				{@const Icon = meta.icon}
				{#if id !== 'right-now' || data.statusItems.length}
					{#if id !== 'watching' || data.watching.length}
						<div
							bind:this={widgetEls[id]}
							data-widget-id={id}
							class={widgetClass(id)}
							style={widgetStyle(id)}
							role="group"
							aria-label="{meta.label} widget"
						>
							<div class="flex items-center justify-between gap-2">
								<h2 class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/50 uppercase">
									{#if Icon}
										<Icon size={13} aria-hidden="true" />
									{/if}
									{meta.label}
								</h2>
								<div class="flex items-center gap-1.5">
									{#if !floatPositions[id]}
										<button
											type="button"
											onclick={() => toggleFullWidth(id)}
											title={fullWidthIds.has(id) ? 'Shrink to one column' : 'Stretch to full width'}
											aria-label={fullWidthIds.has(id)
												? `Shrink ${meta.label} widget`
												: `Stretch ${meta.label} widget to full width`}
											class="hover:text-primary {fullWidthIds.has(id) ? 'text-primary' : 'text-white/30'}"
										>
											<StretchHorizontal size={12} aria-hidden="true" />
										</button>
									{/if}
									<button
										type="button"
										class="cursor-grab touch-none text-white/30 hover:text-primary active:cursor-grabbing"
										onpointerdown={(e) => startDrag(e, id)}
										ondblclick={() => dockWidget(id)}
										title="Drag onto another widget to reorder, or onto open space to float. Double-click to dock."
										aria-label="Move {meta.label} widget"
									>
										<GripVertical size={12} aria-hidden="true" />
									</button>
								</div>
							</div>

							<div class="mt-2.5">
								{#if id === 'right-now'}
									<ul class="grid gap-1">
										{#each data.statusItems as item}
											<li class="text-sm text-white/80">{item}</li>
										{/each}
									</ul>
								{:else if id === 'now-playing'}
									<ListeningNowCard bare>
										{#snippet fallback()}
											<p class="text-sm text-white/50">Nothing playing right now.</p>
										{/snippet}
									</ListeningNowCard>
								{:else if id === 'discord'}
									<DiscordPresence activityOnly />
								{:else if id === 'recent-notes'}
									{#if data.recentNotes.length}
										<ul class="grid gap-1.5">
											{#each data.recentNotes as note}
												<li>
													<a href="/notes/{note.id}" class="block truncate text-sm text-white/80 hover:text-primary">
														{note.title}
													</a>
												</li>
											{/each}
										</ul>
									{:else}
										<p class="text-sm text-white/50">No notes yet.</p>
									{/if}
								{:else if id === 'watching'}
									<ul class="grid gap-2">
										{#each data.watching.slice(0, 2) as item}
											<li>
												<a href={item.href} target="_blank" rel="noopener noreferrer" class="group flex items-center gap-2">
													{#if item.posterUrl}
														<img src={item.posterUrl} alt="" class="h-9 w-6 flex-shrink-0 rounded object-cover" />
													{/if}
													<span class="min-w-0">
														<span class="block truncate text-sm text-white/80 group-hover:text-primary">{item.title}</span>
														{#if item.nextToWatch}
															<span class="block text-xs text-white/50">Next: {item.nextToWatch}</span>
														{/if}
													</span>
												</a>
											</li>
										{/each}
									</ul>
								{:else if id === 'weather'}
									{#if weather === null}
										<p class="text-sm text-white/50">Checking…</p>
									{:else if weather === 'denied'}
										<p class="text-sm text-white/50">Location access denied.</p>
									{:else if weather === 'timeout' || weather === 'unavailable' || weather === 'error'}
										<p class="text-sm text-white/50">
											{weather === 'timeout' ? 'Location lookup timed out.' : 'Weather unavailable.'}
										</p>
										<button
											type="button"
											onclick={loadWeather}
											class="mt-1.5 text-xs text-white/50 underline hover:text-primary"
										>
											Retry
										</button>
									{:else}
										<p class="text-xl font-semibold text-white">{weather.tempF}°F</p>
										<p class="text-sm text-white/60">{weatherLabel(weather.code)}</p>
									{/if}
								{:else if id === 'focus'}
									<p class="text-xl font-semibold text-white tabular-nums">{pomodoroTimeString}</p>
									<p class="text-xs text-white/50">
										{pomodoroOnBreak ? 'Break' : 'Focus'} · {data.focusStats.sessionsToday} session{data.focusStats
											.sessionsToday === 1
											? ''
											: 's'} today
									</p>
									<div class="mt-2 flex gap-2">
										<button
											type="button"
											onclick={togglePomodoro}
											class="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-primary/50 hover:text-primary"
										>
											{pomodoroRunning ? 'Pause' : 'Start'}
										</button>
										<button
											type="button"
											onclick={resetPomodoro}
											class="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-primary/50 hover:text-primary"
										>
											Reset
										</button>
									</div>
								{:else if id === 'note'}
									<form
										method="POST"
										action="?/quickNote"
										class="flex items-center gap-2"
										use:enhance={() => {
											return async ({ update, result }) => {
												await update({ reset: false });
												if (result.type === 'success') {
													noteBody = '';
													noteSaved = true;
													setTimeout(() => (noteSaved = false), 2000);
												}
											};
										}}
									>
										<input
											name="body"
											type="text"
											bind:value={noteBody}
											placeholder="Jot a quick note…"
											class="glass min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-primary/60"
										/>
										<button
											type="submit"
											class="flex-shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-primary/50 hover:text-primary"
										>
											{noteSaved ? 'Saved ✓' : 'Save'}
										</button>
									</form>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
			{/each}
		</div>
	</section>
</main>

<style>
	/* Scoped to this page only — the site's other pages keep their flat
	   bg-surface cards; this dashboard gets its own glass/aurora treatment
	   since it's meant to feel like a separate "browser chrome" surface
	   rather than a page of the marketing site. */
	.photo-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		background-size: cover;
		background-position: center;
	}

	/* Dims/tints the photo toward the brand's near-black + cyan/lime so text
	   and the glass panels stay legible regardless of what photo comes back. */
	.photo-bg-scrim {
		position: fixed;
		inset: 0;
		z-index: 0;
		background: linear-gradient(
			160deg,
			rgba(5, 7, 10, 0.75) 0%,
			rgba(5, 7, 10, 0.55) 50%,
			rgba(5, 7, 10, 0.8) 100%
		);
	}

	.aurora {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: #05070a;
	}

	.aurora-blob {
		position: absolute;
		border-radius: 9999px;
		filter: blur(90px);
		opacity: 0.55;
		will-change: transform;
	}

	.aurora-blob--1 {
		top: -10%;
		left: -10%;
		width: 45vw;
		height: 45vw;
		background: #22d3ee;
		animation: drift1 26s ease-in-out infinite;
	}

	/* Lime — RG Digital's brand accent (see tokens.css header comment) —
	   paired with RazerGhost's own cyan since the "See my work at RG Digital"
	   link lives on this dashboard too. */
	.aurora-blob--2 {
		bottom: -15%;
		right: -10%;
		width: 40vw;
		height: 40vw;
		background: #ccff00;
		opacity: 0.4;
		animation: drift2 32s ease-in-out infinite;
	}

	.aurora-blob--3 {
		top: 30%;
		left: 55%;
		width: 30vw;
		height: 30vw;
		background: #00e5ff;
		opacity: 0.35;
		animation: drift3 22s ease-in-out infinite;
	}

	@keyframes drift1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(6vw, 8vh) scale(1.1);
		}
	}

	@keyframes drift2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-5vw, -6vh) scale(1.05);
		}
	}

	@keyframes drift3 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-4vw, 5vh);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.aurora-blob {
			animation: none;
		}
	}

	.glass {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.glass--interactive:hover {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
		border-color: rgba(34, 211, 238, 0.4);
	}

	/* Same look as .glass, but the blur lives on a ::before pseudo instead of
	   directly on this element. A `backdrop-filter` (or `filter`) on an
	   element makes IT the containing block for any `position: fixed`
	   descendant — since this card wraps the free-floating widgets (see
	   startDrag), that turned their viewport-relative coordinates into
	   card-relative ones, teleporting them miles off. The pseudo-element has
	   no descendants of its own, so it can't hijack their fixed positioning. */
	.glass-card {
		position: relative;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.glass-card::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
	}

	/* Widgets popped out of the grid via their grip handle — see startDrag in
	   the script block. Capped width keeps them from sprawling once they're
	   no longer constrained by the grid column that used to size them. */
	.floating-widget {
		max-width: 320px;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}
</style>
