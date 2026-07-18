import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Local-dev-only write helpers for the frontmatter markdown files that back
// devlog and projects (see devlog.ts / projects.ts / content.ts for the read
// side). These write straight to src/content/**, same as hand-editing the
// .md file — meant to be used against `pnpm dev`, then committed via git.
// Content dirs are baked into the Docker image at build time, not on the
// persistent volume, so writing here from a running prod container would be
// lost on the next deploy; this is intentionally not wired up for that.

const SLUG_RE = /^[a-z0-9-]+$/;

export function isValidSlug(slug: string): boolean {
	return SLUG_RE.test(slug);
}

export interface RawEntry {
	slug: string;
	meta: Record<string, unknown>;
	body: string;
}

export function listRawEntries(contentDir: string): RawEntry[] {
	if (!fs.existsSync(contentDir)) return [];
	return fs
		.readdirSync(contentDir)
		.filter((f) => f.endsWith('.md'))
		.map((filename) => {
			const raw = fs.readFileSync(path.join(contentDir, filename), 'utf-8');
			const { data, content } = matter(raw);
			return { slug: filename.replace(/\.md$/, ''), meta: data, body: content };
		});
}

export function getRawEntry(contentDir: string, slug: string): RawEntry | null {
	const file = path.join(contentDir, `${slug}.md`);
	if (!fs.existsSync(file)) return null;
	const raw = fs.readFileSync(file, 'utf-8');
	const { data, content } = matter(raw);
	return { slug, meta: data, body: content };
}

export function writeEntry(
	contentDir: string,
	slug: string,
	meta: Record<string, unknown>,
	body: string
): void {
	if (!isValidSlug(slug)) throw new Error('Invalid slug');
	fs.mkdirSync(contentDir, { recursive: true });
	const file = matter.stringify(body.trim() + '\n', meta);
	fs.writeFileSync(path.join(contentDir, `${slug}.md`), file, 'utf-8');
}

export function deleteEntry(contentDir: string, slug: string): boolean {
	if (!isValidSlug(slug)) return false;
	const file = path.join(contentDir, `${slug}.md`);
	if (!fs.existsSync(file)) return false;
	fs.unlinkSync(file);
	return true;
}

export function renameEntry(contentDir: string, oldSlug: string, newSlug: string): void {
	if (!isValidSlug(oldSlug) || !isValidSlug(newSlug)) throw new Error('Invalid slug');
	if (oldSlug === newSlug) return;
	const oldFile = path.join(contentDir, `${oldSlug}.md`);
	const newFile = path.join(contentDir, `${newSlug}.md`);
	if (fs.existsSync(newFile)) throw new Error('A file with that slug already exists');
	fs.renameSync(oldFile, newFile);
}
