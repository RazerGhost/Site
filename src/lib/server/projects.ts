import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
	readEntryFile,
	toDateString,
	addHeadingAnchors,
	isValidSlug,
	contentDirSignature,
	type TocEntry
} from './content';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export interface ProjectMeta {
	slug: string;
	name: string;
	description: string;
	href?: string;
	live?: string;
	cover?: string;
	tags: string[];
	date: string;
}

export interface ProjectEntry extends ProjectMeta {
	html: string;
	toc: TocEntry[];
}

function toMeta(slug: string, meta: Record<string, unknown>): ProjectMeta {
	return {
		slug,
		name: String(meta.name ?? slug),
		description: String(meta.description ?? ''),
		href: meta.href ? String(meta.href) : undefined,
		live: meta.live ? String(meta.live) : undefined,
		cover: meta.cover ? String(meta.cover) : undefined,
		tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
		date: toDateString(meta.date)
	};
}

// mtime-keyed caches, same approach as devlog.ts — parsed output is reused
// until a file changes on disk. Callers must not mutate the returned values.
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
			const { slug, meta } = readEntryFile(CONTENT_DIR, filename);
			return toMeta(slug, meta);
		})
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
	const rawHtml = marked.parse(body, { async: false }) as string;
	const { html, toc } = addHeadingAnchors(rawHtml);

	const entry = { ...toMeta(slug, meta), html, toc };
	entryCache.set(slug, { mtimeMs, entry });
	return entry;
}
