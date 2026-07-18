// Shared by the RSS feeds and the sitemap — all of them build XML by hand
// rather than pulling in a templating dependency for a handful of tags.
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

// A literal "]]>" inside the payload would otherwise terminate the CDATA
// section early — split it across two adjacent CDATA blocks instead.
export function cdata(value: string): string {
	return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}
