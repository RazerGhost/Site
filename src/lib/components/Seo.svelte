<script lang="ts">
	import { site } from '$lib/config';

	let {
		title = site.name,
		description = site.description,
		path = '',
		image,
		noindex = false
	}: {
		title?: string;
		description?: string;
		path?: string;
		image?: string;
		noindex?: boolean;
	} = $props();

	const url = $derived(`${site.url}${path}`);
	const imageUrl = $derived.by(() => {
		const resolved = image || '/brand/logo-wordmark-ghost.svg';
		return resolved.startsWith('http') ? resolved : `${site.url}${resolved}`;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={imageUrl} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
</svelte:head>
