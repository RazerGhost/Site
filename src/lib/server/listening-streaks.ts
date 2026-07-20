export type Streak = { startDate: string; endDate: string; days: number };
export type StreakSummary = { longest: Streak | null; current: Streak | null };

// dates: distinct 'YYYY-MM-DD' strings; duplicates are harmless (deduped up front).
export function computeStreaks(dates: string[], today: Date = new Date()): StreakSummary {
	if (dates.length === 0) return { longest: null, current: null };
	const unique = Array.from(new Set(dates)).sort();

	let longest: Streak = { startDate: unique[0], endDate: unique[0], days: 1 };
	let runStart = unique[0];
	let prev = unique[0];

	for (let i = 1; i < unique.length; i++) {
		const d = unique[i];
		if (daysBetween(prev, d) !== 1) {
			if (daysBetween(runStart, prev) + 1 > longest.days) {
				longest = { startDate: runStart, endDate: prev, days: daysBetween(runStart, prev) + 1 };
			}
			runStart = d;
		}
		prev = d;
	}
	if (daysBetween(runStart, prev) + 1 > longest.days) {
		longest = { startDate: runStart, endDate: prev, days: daysBetween(runStart, prev) + 1 };
	}

	// Current streak is only "alive" if the last active date is today or
	// yesterday (UTC) relative to `today` — otherwise it's broken, not short.
	const todayStr = today.toISOString().slice(0, 10);
	const lastActive = unique[unique.length - 1];
	const gapToToday = daysBetween(lastActive, todayStr);
	let current: Streak | null = null;
	if (gapToToday <= 1) {
		let end = unique.length - 1;
		let start = end;
		while (start > 0 && daysBetween(unique[start - 1], unique[start]) === 1) start--;
		current = { startDate: unique[start], endDate: unique[end], days: end - start + 1 };
	}

	return { longest, current };
}

function daysBetween(a: string, b: string): number {
	return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
