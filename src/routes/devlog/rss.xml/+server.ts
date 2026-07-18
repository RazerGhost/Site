import { getAllDevlogEntries, getDevlogEntry } from '$lib/server/devlog';
import { site } from '$lib/config';
import { cdata, escapeXml } from '$lib/server/xml';
import type { RequestHandler } from './$types';

function resolveUrl(src: string): string {
	return src.startsWith('http') ? src : `${site.url}${src}`;
}

export const GET: RequestHandler = () => {
	const entries = getAllDevlogEntries();

	const items = entries
		.map((meta) => {
			const entry = getDevlogEntry(meta.slug);
			const imageUrl = resolveUrl(meta.cover ?? `/devlog/${meta.slug}/og.png`);
			const contentHtml = entry ? `<img src="${imageUrl}" alt="" />${entry.html}` : escapeXml(meta.excerpt);

			return `
		<item>
			<title>${escapeXml(meta.title)}</title>
			<link>${site.url}/devlog/${meta.slug}</link>
			<guid>${site.url}/devlog/${meta.slug}</guid>
			<pubDate>${new Date(meta.date).toUTCString()}</pubDate>
			<description>${escapeXml(meta.excerpt)}</description>
			<content:encoded>${cdata(contentHtml)}</content:encoded>
		</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(site.name)} — Devlog</title>
		<link>${site.url}/devlog</link>
		<description>${escapeXml(site.description)}</description>
		<atom:link href="${site.url}/devlog/rss.xml" rel="self" type="application/rss+xml" />${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
