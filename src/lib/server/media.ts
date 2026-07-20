import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { slugifyHeading } from './content';

export const ALLOWED_TYPES: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp'
};
export const MAX_BYTES = 8 * 1024 * 1024;

export type MediaFile = {
	filename: string;
	url: string;
	size: number;
	uploadedAt: string;
};

export function mediaDir(): string {
	const dir = env.MEDIA_DIR || path.join(process.cwd(), 'data', 'media');
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function toMediaFile(filename: string): MediaFile {
	const stat = fs.statSync(path.join(mediaDir(), filename));
	return {
		filename,
		url: `/media/${filename}`,
		size: stat.size,
		uploadedAt: stat.mtime.toISOString()
	};
}

export async function saveMediaFile(file: File, originalName: string): Promise<MediaFile> {
	if (file.size > MAX_BYTES) throw new Error('File too large (max 8MB)');

	const ext = ALLOWED_TYPES[file.type];
	if (!ext) throw new Error('Unsupported file type — use PNG, JPEG, GIF, or WebP');

	const baseName = slugifyHeading(originalName.replace(/\.[^.]+$/, ''));
	const filename = `${randomUUID()}-${baseName}.${ext}`;

	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(path.join(mediaDir(), filename), buffer);
	return toMediaFile(filename);
}

export function listMediaFiles(): MediaFile[] {
	const dir = mediaDir();
	return fs
		.readdirSync(dir)
		.filter((name) => Object.values(ALLOWED_TYPES).includes(name.split('.').pop() ?? ''))
		.map((name) => toMediaFile(name))
		.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export function deleteMediaFile(filename: string): void {
	const safeName = path.basename(filename);
	const filePath = path.join(mediaDir(), safeName);
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
