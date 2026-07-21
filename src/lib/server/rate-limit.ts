// Simple in-memory fixed-window rate limiter, keyed by an arbitrary string
// (caller passes IP + a bucket name). Single-process only — fine for this
// app, which always runs as one Node process (adapter-node).
const windows = new Map<string, { count: number; resetAt: number }>();

// Lazy expiry: sweep old entries opportunistically on each check rather than
// running a timer, since traffic is low enough that unbounded growth between
// sweeps isn't a real concern.
function sweep(now: number) {
	for (const [key, entry] of windows) {
		if (entry.resetAt <= now) windows.delete(key);
	}
}

export type RateLimitResult = { limited: false } | { limited: true; retryAfterSeconds: number };

export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
	const now = Date.now();
	if (Math.random() < 0.01) sweep(now);

	const entry = windows.get(key);
	if (!entry || entry.resetAt <= now) {
		windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
		return { limited: false };
	}

	entry.count += 1;
	if (entry.count > limit) {
		return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
	}
	return { limited: false };
}
