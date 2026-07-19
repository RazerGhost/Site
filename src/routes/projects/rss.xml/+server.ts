import { getAllProjects, getProject } from '$lib/server/projects';
import { site } from '$lib/config';
import { cdata, escapeXml } from '$lib/server/xml';
import type { RequestHandler } from './$types';

function resolveUrl(src: string): string {
	return src.startsWith('http') ? src : `${site.url}${src}`;
}

export const GET: RequestHandler = () => {
	const projects = getAllProjects();

	const items = projects
		.map((meta) => {
			const project = getProject(meta.slug);
			const imageUrl = resolveUrl(meta.cover ?? `/projects/${meta.slug}/og.png`);
			const contentHtml = project
				? `<img src="${imageUrl}" alt="" />${project.html}`
				: escapeXml(meta.description);
			// Drop <pubDate> for an unparseable date rather than emitting the
			// literal string "Invalid Date" into the feed.
			const pubDate = new Date(meta.date);

			return `
		<item>
			<title>${escapeXml(meta.name)}</title>
			<link>${site.url}/projects/${meta.slug}</link>
			<guid>${site.url}/projects/${meta.slug}</guid>${Number.isNaN(pubDate.getTime()) ? '' : `\n\t\t\t<pubDate>${pubDate.toUTCString()}</pubDate>`}
			<description>${escapeXml(meta.description)}</description>
			<content:encoded>${cdata(contentHtml)}</content:encoded>
		</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(site.name)} — Projects</title>
		<link>${site.url}/projects</link>
		<description>${escapeXml(site.description)}</description>
		<atom:link href="${site.url}/projects/rss.xml" rel="self" type="application/rss+xml" />${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
