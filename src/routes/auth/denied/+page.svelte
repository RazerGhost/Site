<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';

	const messages: Record<string, string> = {
		'not-owner': "That GitHub account isn't authorized for this area.",
		state: 'The login attempt could not be verified — try again.',
		error: 'GitHub login failed — try again.'
	};

	const reason = $derived(page.url.searchParams.get('reason') ?? '');
	const message = $derived(messages[reason] ?? 'Access denied.');
</script>

<Seo title="Access denied — RazerGhost" description="Access denied." path="/auth/denied" noindex />

<main class="mx-auto max-w-2xl px-6 py-16">
	<section class="flex flex-col items-center py-16 text-center">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Access denied</h1>
		<p class="mt-3 max-w-sm text-gray">{message}</p>

		<div class="mt-8">
			<a
				href="/"
				class="link rounded-full border border-border px-4 py-2 text-sm text-gray transition-colors hover:border-primary hover:text-primary"
			>
				Back home
			</a>
		</div>
	</section>
</main>
