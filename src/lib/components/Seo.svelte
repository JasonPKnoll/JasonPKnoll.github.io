<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/site.ts';

	let { title, description = site.description }: { title?: string; description?: string } =
		$props();

	const fullTitle = $derived(title ? `${title} · ${site.name}` : `${site.name} — ${site.role}`);
	const canonical = $derived(site.url + page.url.pathname);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:site" content="@JasonPKnoll" />
</svelte:head>
