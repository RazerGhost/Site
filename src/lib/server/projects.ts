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

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface ProjectMeta {
	slug: string;
	name: string;
	description: string;
	href?: string;
	live?: string;
	cover?: string;
	images: string[];
	tags: string[];
	stack: string[];
	status: ProjectStatus;
	featured: boolean;
	readingTime: number;
	searchText: string;
	draft: boolean;
	date: string;
}

export interface ProjectEntry extends ProjectMeta {
	html: string;
	toc: TocEntry[];
}

function toStatus(value: unknown): ProjectStatus {
	return value === 'paused' || value === 'archived' ? value : 'active';
}

function toMeta(slug: string, meta: Record<string, unknown>, body: string): ProjectMeta {
	return {
		slug,
		name: String(meta.name ?? slug),
		description: String(meta.description ?? ''),
		href: meta.href ? String(meta.href) : undefined,
		live: meta.live ? String(meta.live) : undefined,
		cover: meta.cover ? String(meta.cover) : undefined,
		images: Array.isArray(meta.images) ? (meta.images as string[]) : [],
		tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
		stack: Array.isArray(meta.stack) ? (meta.stack as string[]) : [],
		status: toStatus(meta.status),
		featured: meta.featured === true,
		readingTime: estimateReadingTime(body),
		searchText: toSearchText(body),
		draft: meta.draft === true,
		date: toDateString(meta.date)
	};
}

// mtime-keyed caches, same approach as devlog.ts — parsed output is reused
// until a file changes on disk. Callers must not mutate the returned values.
//
// Drafts (`draft: true` in frontmatter) are excluded here — same convention
// as devlog.ts, so the list page, RSS, sitemap, tag pages, and prev/next/
// related computations all stay unpublished at once. getProject() below
// deliberately does NOT filter, so a draft is still viewable by anyone who
// has its direct URL — useful for previewing a project before it goes live.
let listCache: { signature: string; projects: ProjectMeta[] } | null = null;
const entryCache = new Map<string, { mtimeMs: number; entry: ProjectEntry }>();

export function getAllProjects(): ProjectMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	const signature = contentDirSignature(CONTENT_DIR);
	if (listCache && listCache.signature === signature) return listCache.projects;

	const projects = fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const { slug, meta, body } = readEntryFile(CONTENT_DIR, filename);
			return toMeta(slug, meta, body);
		})
		.filter((project) => !project.draft)
		.sort((a, b) => (a.date > b.date ? -1 : 1));

	listCache = { signature, projects };
	return projects;
}

export function getProject(slug: string): ProjectEntry | null {
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
