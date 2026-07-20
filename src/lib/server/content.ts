import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

// Shared by devlog.ts and projects.ts — both read frontmatter'd markdown
// off disk the same way, and both estimate reading time, build a search
// index, render footnotes, and anchor headings identically. Their
// toMeta()/getAll()/get() functions still genuinely differ in output shape
// (devlog has series; projects has name/href/live/stack), so only the
// identical parsing/rendering bits live here, not a forced full unification.
// Content filenames are always `<slug>.md` with slugs matching this shape
// (devlog: `YYYY-MM-DD-title`, projects: plain kebab-case). Validating URL
// params against it before any path.join keeps traversal sequences out of
// filesystem paths, independent of how the router happens to decode them.
const SLUG_RE = /^[a-z0-9-]+$/;

export function isValidSlug(slug: string): boolean {
	return SLUG_RE.test(slug);
}

// Cheap change-detection key for a content directory: the sorted list of
// markdown filenames + mtimes. Reading/parsing every post on every request
// (the root layout does this for the command palette) is wasted work when
// nothing changed — callers cache their parsed output keyed on this and only
// re-read when a file is added, removed, or touched.
export function contentDirSignature(contentDir: string): string {
	if (!fs.existsSync(contentDir)) return '';
	return fs
		.readdirSync(contentDir)
		.filter((f) => f.endsWith('.md'))
		.sort()
		.map((f) => {
			try {
				return `${f}:${fs.statSync(path.join(contentDir, f)).mtimeMs}`;
			} catch {
				// File deleted between readdir and stat — still changes the signature.
				return `${f}:gone`;
			}
		})
		.join('|');
}

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
const WORDS_PER_MINUTE = 200;

// Shared by devlog.ts and projects.ts — both estimate reading time and
// build a searchable plain-text index from a post/project body the same way.
export function estimateReadingTime(body: string): number {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Strips markdown syntax down to plain, lowercased text so list pages can
// search bodies client-side without shipping raw markdown (code fences,
// link syntax, etc.) into the search match.
export function toSearchText(body: string): string {
	return body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
		.replace(/^\[\^[\w-]+]:\s*.+$/gm, ' ')
		.replace(/\[\^[\w-]+]/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_~-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

export interface FootnoteEntry {
	refId: string;
	noteId: string;
	html: string;
}

// Hand-rolled footnote support ([^label] refs + "[^label]: text" block
// definitions), run on the raw markdown before marked.parse — same
// independent-of-marked's-renderer-API approach as addHeadingAnchors below,
// rather than pulling in a marked plugin for something this small.
export function applyFootnotes(body: string): { body: string; footnotes: FootnoteEntry[] } {
	const defs = new Map<string, string>();
	const withoutDefs = body.replace(/^\[\^([\w-]+)]:\s*(.+)$/gm, (_match, label, text) => {
		defs.set(label, text);
		return '';
	});

	if (defs.size === 0) return { body, footnotes: [] };

	const order: string[] = [];
	const withRefs = withoutDefs.replace(/\[\^([\w-]+)]/g, (match, label) => {
		if (!defs.has(label)) return match;
		let index = order.indexOf(label);
		if (index === -1) {
			order.push(label);
			index = order.length - 1;
		}
		const n = index + 1;
		return `<sup id="fnref-${n}"><a href="#fn-${n}" class="footnote-ref">${n}</a></sup>`;
	});

	const footnotes = order.map((label, i) => {
		const n = i + 1;
		return {
			refId: `fnref-${n}`,
			noteId: `fn-${n}`,
			html: marked.parseInline(defs.get(label) ?? '', { async: false }) as string
		};
	});

	return { body: withRefs, footnotes };
}

export function renderFootnotesSection(footnotes: FootnoteEntry[]): string {
	const items = footnotes
		.map((f) => `<li id="${f.noteId}">${f.html} <a href="#${f.refId}" class="footnote-backref">↩</a></li>`)
		.join('');
	return `<section class="footnotes"><hr />\n<ol>${items}</ol></section>`;
}

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
