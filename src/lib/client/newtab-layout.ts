// Client-only persistence for /newtab's free-floating widgets — deliberately
// NOT server-backed (unlike quick links / focus sessions / etc.) since a
// dragged position is a per-device UI preference, not data worth syncing.
const STORAGE_KEY = 'newtab:floating-positions';

export type FloatPosition = { x: number; y: number; width: number };

function readAll(): Record<string, FloatPosition> {
	if (typeof localStorage === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
	} catch {
		return {};
	}
}

function writeAll(positions: Record<string, FloatPosition>): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function getFloatPosition(id: string): FloatPosition | null {
	return readAll()[id] ?? null;
}

export function setFloatPosition(id: string, pos: FloatPosition): void {
	const all = readAll();
	all[id] = pos;
	writeAll(all);
}

export function clearFloatPosition(id: string): void {
	const all = readAll();
	delete all[id];
	writeAll(all);
}

export function resetAllFloatPositions(): void {
	localStorage.removeItem(STORAGE_KEY);
}

// Persisted grid order — separate key from float positions since docking a
// widget shouldn't lose the spot it was reordered to, and vice versa.
const ORDER_KEY = 'newtab:widget-order';

export function getWidgetOrder(): string[] | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(ORDER_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function setWidgetOrder(order: string[]): void {
	localStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

export function resetWidgetOrder(): void {
	localStorage.removeItem(ORDER_KEY);
}

// Which docked widgets are stretched to span the full grid row — separate
// key again, same reasoning as order vs. float position above.
const FULL_WIDTH_KEY = 'newtab:widget-full-width';

function readFullWidthIds(): string[] | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(FULL_WIDTH_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

// Returns null (not []) when nothing has been saved yet — lets the caller
// tell "never touched, use sensible defaults" apart from "user explicitly
// shrank everything back down."
export function getFullWidthIds(): string[] | null {
	return readFullWidthIds();
}

// Takes the complete set rather than toggling a single id — the caller
// already has to know the full current set (including un-persisted
// defaults) to compute the new state, so it should just hand that over
// instead of this function re-deriving it from storage and silently
// dropping any default that was never actually written yet.
export function setFullWidthIds(ids: string[]): void {
	localStorage.setItem(FULL_WIDTH_KEY, JSON.stringify(ids));
}

export function resetFullWidth(): void {
	localStorage.removeItem(FULL_WIDTH_KEY);
}

// Whether the quick links row is displayed sorted by click count instead of
// the saved manual order — a per-device display preference, same reasoning
// as everything else in this file.
const QUICK_LINKS_SORT_KEY = 'newtab:quick-links-sort-by-clicks';

export function getQuickLinksSortByClicks(): boolean {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(QUICK_LINKS_SORT_KEY) === '1';
}

export function setQuickLinksSortByClicks(sortByClicks: boolean): void {
	if (sortByClicks) localStorage.setItem(QUICK_LINKS_SORT_KEY, '1');
	else localStorage.removeItem(QUICK_LINKS_SORT_KEY);
}
