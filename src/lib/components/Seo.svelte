<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/site.ts';

	type Props = {
		title?: string;
		description?: string;
		/** Share image: an absolute URL or a site-relative path. Defaults to the site card. */
		image?: string;
		imageAlt?: string;
		/** Pixel size of `image`, when known (lets crawlers render the card without fetching it first). */
		imageSize?: { width: number; height: number };
		type?: 'website' | 'article' | 'profile';
		/** Keep this page out of search results (error pages). */
		noindex?: boolean;
		/** schema.org JSON-LD objects for this page. */
		jsonLd?: Record<string, unknown>[];
	};

	let {
		title,
		description = site.description,
		image,
		imageAlt,
		imageSize,
		type = 'website',
		noindex = false,
		jsonLd = []
	}: Props = $props();

	const fullTitle = $derived(title ? `${title} · ${site.name}` : `${site.name} — ${site.role}`);
	const canonical = $derived(site.url + page.url.pathname);
	const ogImage = $derived(new URL(image ?? site.ogImage.src, site.url).href);
	const ogAlt = $derived(image ? (imageAlt ?? fullTitle) : site.ogImage.alt);
	const ogSize = $derived(image ? imageSize : site.ogImage);

	// `<` is escaped so content can never close the script tag early.
	const ldScript = (data: Record<string, unknown>) =>
		`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</` +
		'script>';
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<meta name="author" content={site.name} />

	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={ogAlt} />
	{#if ogSize}
		<meta property="og:image:width" content={String(ogSize.width)} />
		<meta property="og:image:height" content={String(ogSize.height)} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={site.twitter} />
	<meta name="twitter:creator" content={site.twitter} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={ogAlt} />

	{#each jsonLd as data, i (i)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- serialized JSON-LD, `<` escaped -->
		{@html ldScript(data)}
	{/each}
</svelte:head>
