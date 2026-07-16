import { getAllDevlogEntries } from '$lib/server/devlog';
import { site } from '$lib/config';
import type { RequestHandler } from './$types';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = () => {
	const entries = getAllDevlogEntries();

	const items = entries
		.map(
			(entry) => `
		<item>
			<title>${escapeXml(entry.title)}</title>
			<link>${site.url}/devlog/${entry.slug}</link>
			<guid>${site.url}/devlog/${entry.slug}</guid>
			<pubDate>${new Date(entry.date).toUTCString()}</pubDate>
			<description>${escapeXml(entry.excerpt)}</description>
		</item>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>${escapeXml(site.name)} — Devlog</title>
		<link>${site.url}/devlog</link>
		<description>${escapeXml(site.description)}</description>${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
