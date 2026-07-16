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
}

export interface DevlogEntry extends DevlogMeta {
	html: string;
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

function toMeta(slug: string, meta: Record<string, unknown>, body: string): DevlogMeta {
	return {
		slug,
		title: String(meta.title ?? slug),
		date: String(meta.date ?? ''),
		tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
		cover: meta.cover ? String(meta.cover) : undefined,
		excerpt: String(meta.excerpt ?? ''),
		readingTime: estimateReadingTime(body)
	};
}

export function getAllDevlogEntries(): DevlogMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	return fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const { slug, meta, body } = readEntryFile(filename);
			return toMeta(slug, meta, body);
		})
		.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getDevlogEntry(slug: string): DevlogEntry | null {
	const filename = `${slug}.md`;
	if (!fs.existsSync(path.join(CONTENT_DIR, filename))) return null;

	const { meta, body } = readEntryFile(filename);
	const html = marked.parse(body, { async: false }) as string;

	return { ...toMeta(slug, meta, body), html };
}
