import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
	readEntryFile,
	toDateString,
	addHeadingAnchors,
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

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(body: string): number {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Strips markdown syntax down to plain, lowercased text so the devlog list
// page can search post bodies client-side without shipping raw markdown
// (code fences, link syntax, etc.) into the search match.
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

interface FootnoteEntry {
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

function renderFootnotesSection(footnotes: FootnoteEntry[]): string {
	const items = footnotes
		.map((f) => `<li id="${f.noteId}">${f.html} <a href="#${f.refId}" class="footnote-backref">↩</a></li>`)
		.join('');
	return `<section class="footnotes"><hr />\n<ol>${items}</ol></section>`;
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
			const { slug, meta, body } = readEntryFile(CONTENT_DIR, filename);
			return toMeta(slug, meta, body);
		})
		.filter((entry) => !entry.draft)
		.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.slug.localeCompare(b.slug)));
}

export function getDevlogEntry(slug: string): DevlogEntry | null {
	const filename = `${slug}.md`;
	if (!fs.existsSync(path.join(CONTENT_DIR, filename))) return null;

	const { meta, body } = readEntryFile(CONTENT_DIR, filename);
	const { body: bodyWithFootnoteRefs, footnotes } = applyFootnotes(body);
	const rawHtml = marked.parse(bodyWithFootnoteRefs, { async: false }) as string;
	const { html: htmlWithAnchors, toc } = addHeadingAnchors(rawHtml);
	const html = footnotes.length ? htmlWithAnchors + renderFootnotesSection(footnotes) : htmlWithAnchors;

	return { ...toMeta(slug, meta, body), html, toc };
}
