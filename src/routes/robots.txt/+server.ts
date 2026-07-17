import { site } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain' }
	});
};
