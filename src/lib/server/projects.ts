import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { readEntryFile, toDateString, addHeadingAnchors, type TocEntry } from './content';

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

export function getAllProjects(): ProjectMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	return fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const { slug, meta } = readEntryFile(CONTENT_DIR, filename);
			return toMeta(slug, meta);
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getProject(slug: string): ProjectEntry | null {
	const filename = `${slug}.md`;
	if (!fs.existsSync(path.join(CONTENT_DIR, filename))) return null;

	const { meta, body } = readEntryFile(CONTENT_DIR, filename);
	const rawHtml = marked.parse(body, { async: false }) as string;
	const { html, toc } = addHeadingAnchors(rawHtml);

	return { ...toMeta(slug, meta), html, toc };
}
