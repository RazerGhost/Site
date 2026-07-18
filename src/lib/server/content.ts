import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Shared by devlog.ts and projects.ts — both read frontmatter'd markdown
// off disk the same way. Their toMeta()/getAll()/get() functions genuinely
// differ in output shape (devlog has series/searchText/footnotes;
// projects has name/href/live), so only the identical file-reading and
// date-normalization bits live here, not a forced full unification.
export function readEntryFile(contentDir: string, filename: string) {
	const raw = fs.readFileSync(path.join(contentDir, filename), 'utf-8');
	const { data, content } = matter(raw);
	return { slug: filename.replace(/\.md$/, ''), meta: data, body: content };
}

// gray-matter (via js-yaml) parses unquoted frontmatter dates like
// `date: 2026-06-01` into native Date objects, not strings — String(date)
// on those yields a verbose, timezone-dependent format ("Mon Jun 01 2026
// 02:00:00 GMT+0200...") that doesn't sort lexicographically. Normalize
// to YYYY-MM-DD so date comparisons (list sort, prev/next) work correctly.
export function toDateString(value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value ?? '');
}

export interface TocEntry {
	id: string;
	text: string;
	level: 2 | 3;
}

// Undoes marked's HTML-escaping (&amp; &lt; &gt; &quot; &#39;) for text that
// gets used as plain text (TOC labels) rather than re-inserted as HTML —
// otherwise a heading like "--prod doesn't mean..." shows a literal "&#39;"
// in the table of contents, since Svelte's {text} interpolation doesn't
// decode entities the way {@html} does.
export function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

export function slugifyHeading(text: string): string {
	return (
		text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '') || 'section'
	);
}

// Gives every h2/h3 a stable, unique id (for the table of contents and
// shareable deep links into a post) by post-processing the rendered HTML
// rather than hooking marked's renderer — keeps this independent of marked's
// renderer API shape.
export function addHeadingAnchors(html: string): { html: string; toc: TocEntry[] } {
	const toc: TocEntry[] = [];
	const seen = new Map<string, number>();

	const withIds = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, levelStr, inner) => {
		const level = Number(levelStr) as 2 | 3;
		const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, '').trim());
		const base = slugifyHeading(text);
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		const id = count > 0 ? `${base}-${count}` : base;

		toc.push({ id, text, level });
		return `<h${level} id="${id}">${inner}</h${level}>`;
	});

	return { html: withIds, toc };
}
