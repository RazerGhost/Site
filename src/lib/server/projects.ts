import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

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
}

function readEntryFile(filename: string) {
	const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
	const { data, content } = matter(raw);
	return { slug: filename.replace(/\.md$/, ''), meta: data, body: content };
}

// gray-matter (via js-yaml) parses unquoted frontmatter dates like
// `date: 2026-06-01` into native Date objects, not strings — String(date)
// on those yields a verbose, timezone-dependent format ("Mon Jun 01 2026
// 02:00:00 GMT+0200...") that doesn't sort lexicographically. Normalize
// to YYYY-MM-DD so date comparisons (list sort) work correctly.
function toDateString(value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value ?? '');
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
			const { slug, meta } = readEntryFile(filename);
			return toMeta(slug, meta);
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getProject(slug: string): ProjectEntry | null {
	const filename = `${slug}.md`;
	if (!fs.existsSync(path.join(CONTENT_DIR, filename))) return null;

	const { meta, body } = readEntryFile(filename);
	const html = marked.parse(body, { async: false }) as string;

	return { ...toMeta(slug, meta), html };
}
