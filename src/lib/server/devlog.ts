import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/devlog');

export interface DevlogMeta {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	cover?: string;
	excerpt: string;
	readingTime: number;
	searchText: string;
	draft: boolean;
}

export interface TocEntry {
	id: string;
	text: string;
	level: 2 | 3;
}

export interface DevlogEntry extends DevlogMeta {
	html: string;
	toc: TocEntry[];
}

function readEntryFile(filename: string) {
	const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
	const { data, content } = matter(raw);
	return { slug: filename.replace(/\.md$/, ''), meta: data, body: content };
}

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(body: string): number {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Strips markdown syntax down to plain, lowercased text so the devlog list
// page can search post bodies client-side without shipping raw markdown
// (code fences, link syntax, etc.) into the search match.
function toSearchText(body: string): string {
	return body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_~-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

// gray-matter (via js-yaml) parses unquoted frontmatter dates like
// `date: 2026-06-01` into native Date objects, not strings — String(date)
// on those yields a verbose, timezone-dependent format ("Mon Jun 01 2026
// 02:00:00 GMT+0200...") that doesn't sort lexicographically. Normalize
// to YYYY-MM-DD so date comparisons (list sort, prev/next) work correctly.
function toDateString(value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value ?? '');
}

function toMeta(slug: string, meta: Record<string, unknown>, body: string): DevlogMeta {
	return {
		slug,
		title: String(meta.title ?? slug),
		date: toDateString(meta.date),
		tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
		cover: meta.cover ? String(meta.cover) : undefined,
		excerpt: String(meta.excerpt ?? ''),
		readingTime: estimateReadingTime(body),
		searchText: toSearchText(body),
		draft: meta.draft === true
	};
}

// Gives every h2/h3 a stable, unique id (for the table of contents and
// shareable deep links into a post) by post-processing the rendered HTML
// rather than hooking marked's renderer — keeps this independent of marked's
// renderer API shape.
function slugifyHeading(text: string): string {
	return (
		text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '') || 'section'
	);
}

function addHeadingAnchors(html: string): { html: string; toc: TocEntry[] } {
	const toc: TocEntry[] = [];
	const seen = new Map<string, number>();

	const withIds = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, levelStr, inner) => {
		const level = Number(levelStr) as 2 | 3;
		const text = inner.replace(/<[^>]+>/g, '').trim();
		const base = slugifyHeading(text);
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		const id = count > 0 ? `${base}-${count}` : base;

		toc.push({ id, text, level });
		return `<h${level} id="${id}">${inner}</h${level}>`;
	});

	return { html: withIds, toc };
}

// Drafts (`draft: true` in frontmatter) are excluded here — this is what
// backs the list page, RSS, sitemap, tag pages, and prev/next/related
// computations, so leaving them out of this function keeps them unpublished
// everywhere at once. getDevlogEntry() below deliberately does NOT filter,
// so a draft is still viewable by anyone who has its direct URL — useful
// for previewing a post before it goes live.
export function getAllDevlogEntries(): DevlogMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	return fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const { slug, meta, body } = readEntryFile(filename);
			return toMeta(slug, meta, body);
		})
		.filter((entry) => !entry.draft)
		.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.slug.localeCompare(b.slug)));
}

export function getDevlogEntry(slug: string): DevlogEntry | null {
	const filename = `${slug}.md`;
	if (!fs.existsSync(path.join(CONTENT_DIR, filename))) return null;

	const { meta, body } = readEntryFile(filename);
	const rawHtml = marked.parse(body, { async: false }) as string;
	const { html, toc } = addHeadingAnchors(rawHtml);

	return { ...toMeta(slug, meta, body), html, toc };
}
