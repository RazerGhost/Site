import { getAllProjects } from '$lib/server/projects';
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
	const projects = getAllProjects();

	const items = projects
		.map(
			(project) => `
		<item>
			<title>${escapeXml(project.name)}</title>
			<link>${site.url}/projects/${project.slug}</link>
			<guid>${site.url}/projects/${project.slug}</guid>
			<pubDate>${new Date(project.date).toUTCString()}</pubDate>
			<description>${escapeXml(project.description)}</description>
		</item>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>${escapeXml(site.name)} — Projects</title>
		<link>${site.url}/projects</link>
		<description>${escapeXml(site.description)}</description>${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
