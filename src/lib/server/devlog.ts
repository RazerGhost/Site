import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
	readEntryFile,
	toDateString,
	addHeadingAnchors,
	isValidSlug,
	contentDirSignature,
	estimateReadingTime,
	toSearchText,
	applyFootnotes,
	renderFootnotesSection,
	type TocEntry
} from './content';

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
	// Plain human-readable string shared across posts in the same series
	// (e.g. "Shipping the Devlog Pipeline") — used directly as both the
	// grouping key and the display label, matched by exact equality.
	series?: string;
}

export interface DevlogEntry extends DevlogMeta {
	html: string;
	toc: TocEntry[];
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
		draft: meta.draft === true,
		series: meta.series ? String(meta.series) : undefined
	};
}

// Sorted oldest-first — prev/next and series math in devlog/[slug]'s load
// relies on ascending order, so display consumers (homepage "Latest", the
// /devlog list, RSS) must .toReversed() for newest-first themselves.
//
// Drafts (`draft: true` in frontmatter) are excluded here — this is what
// backs the list page, RSS, sitemap, tag pages, and prev/next/related
// computations, so leaving them out of this function keeps them unpublished
// everywhere at once. getDevlogEntry() below deliberately does NOT filter,
// so a draft is still viewable by anyone who has its direct URL — useful
// for previewing a post before it goes live.
// Parsed results are cached per server process and invalidated by file
// mtimes (see contentDirSignature) — editing a post on disk (by hand or via
// /notes/devlog) still takes effect on the next request, but unchanged
// content no longer costs a full re-read + re-parse of every file per
// request. Callers must not mutate the returned arrays/objects.
let listCache: { signature: string; entries: DevlogMeta[] } | null = null;
const entryCache = new Map<string, { mtimeMs: number; entry: DevlogEntry }>();

export function getAllDevlogEntries(): DevlogMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	const signature = contentDirSignature(CONTENT_DIR);
	if (listCache && listCache.signature === signature) return listCache.entries;

	const entries = fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const { slug, meta, body } = readEntryFile(CONTENT_DIR, filename);
			return toMeta(slug, meta, body);
		})
		.filter((entry) => !entry.draft)
		.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.slug.localeCompare(b.slug)));

	listCache = { signature, entries };
	return entries;
}

// Computes each entry's position within its series (1-indexed) and the
// series' total part count, keyed by slug. `allEntries` must be in
// chronological (oldest-first) order — the same order returned by
// getAllDevlogEntries() — so that part numbers line up with publish order.
export function getSeriesInfoMap(allEntries: DevlogMeta[]): Map<string, { part: number; total: number }> {
	const bySeries = new Map<string, DevlogMeta[]>();
	for (const entry of allEntries) {
		if (!entry.series) continue;
		const parts = bySeries.get(entry.series) ?? [];
		parts.push(entry);
		bySeries.set(entry.series, parts);
	}

	const info = new Map<string, { part: number; total: number }>();
	for (const parts of bySeries.values()) {
		parts.forEach((entry, i) => info.set(entry.slug, { part: i + 1, total: parts.length }));
	}
	return info;
}

export function getDevlogEntry(slug: string): DevlogEntry | null {
	if (!isValidSlug(slug)) return null;
	const filename = `${slug}.md`;

	let mtimeMs: number;
	try {
		mtimeMs = fs.statSync(path.join(CONTENT_DIR, filename)).mtimeMs;
	} catch {
		entryCache.delete(slug);
		return null;
	}

	const cached = entryCache.get(slug);
	if (cached && cached.mtimeMs === mtimeMs) return cached.entry;

	const { meta, body } = readEntryFile(CONTENT_DIR, filename);
	const { body: bodyWithFootnoteRefs, footnotes } = applyFootnotes(body);
	const rawHtml = marked.parse(bodyWithFootnoteRefs, { async: false }) as string;
	const { html: htmlWithAnchors, toc } = addHeadingAnchors(rawHtml);
	const html = footnotes.length ? htmlWithAnchors + renderFootnotesSection(footnotes) : htmlWithAnchors;

	const entry = { ...toMeta(slug, meta, body), html, toc };
	entryCache.set(slug, { mtimeMs, entry });
	return entry;
}
