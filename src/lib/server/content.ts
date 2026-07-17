import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Shared by devlog.ts and projects.ts — both read frontmatter'd markdown
// off disk the same way. Their toMeta()/getAll()/get() functions genuinely
// differ in output shape (devlog has series/toc/searchText/footnotes;
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
