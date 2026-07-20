<script lang="ts">
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';
	import { socialLinks } from '$lib/config';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	const feeds = [
		{ label: 'Devlog RSS', href: '/devlog/rss.xml' },
		{ label: 'Projects RSS', href: '/projects/rss.xml' }
	];
</script>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-dim sm:flex-row sm:justify-between"
	>
		<p>&copy; {new Date().getFullYear()} RazerGhost</p>

		<ul class="flex flex-wrap justify-center gap-4">
			{#each feeds as feed}
				<li>
					<a
						href={feed.href}
						data-sveltekit-reload
						class="link flex items-center gap-1.5 hover:text-primary"
					>
						<Rss size={14} aria-hidden="true" />
						{feed.label}
					</a>
				</li>
			{/each}
		</ul>

		<ul class="flex flex-wrap justify-center gap-4">
			{#each socialLinks as link}
				{@const Icon = icons[link.icon]}
				<li>
					<a href={link.href} class="link flex items-center gap-1.5 hover:text-primary">
						<Icon size={16} aria-hidden="true" />
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</footer>
