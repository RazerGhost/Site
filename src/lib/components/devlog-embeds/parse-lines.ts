// Devlog embeds take a `lines` prop that arrives as a plain string when set
// via a markdown data-lines attribute (data-* attributes can only ever be
// strings) — accept both a real array (programmatic use) and a JSON-encoded
// one (markdown use), falling back to a single-element array wrapping the
// raw string if it doesn't parse.
export function parseLines(raw: string[] | string): string[] {
	if (Array.isArray(raw)) return raw;
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [raw];
	} catch {
		return [raw];
	}
}
