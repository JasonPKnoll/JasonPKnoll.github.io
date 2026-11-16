<script lang="ts">
	import { asset } from '$app/paths';
	import type { AssetPath } from '$app/types';
	import type { Media } from '#lib/projects.ts';

	let { media }: { media: Media } = $props();

	let video: HTMLVideoElement | undefined = $state();
	const poster = $derived(media.src.replace(/\.mp4$/, '.jpg') as AssetPath);
	const tall = $derived(media.height > media.width);

	// Only load + play clips while they're on screen. Reduced-motion users get
	// the poster with controls instead of autoplay.
	$effect(() => {
		if (!video) return;
		const el = video;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			el.controls = true;
			return;
		}
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) el.play().catch(() => (el.controls = true));
				else el.pause();
			},
			{ threshold: 0.25 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<figure class:tall>
	<div class="window">
		{#if media.kind === 'video'}
			<video
				bind:this={video}
				src={asset(media.src)}
				poster={asset(poster)}
				width={media.width}
				height={media.height}
				muted
				loop
				playsinline
				preload="none"
				aria-label={media.alt}
			></video>
		{:else}
			<img
				src={asset(media.src)}
				alt={media.alt}
				width={media.width}
				height={media.height}
				loading="lazy"
				decoding="async"
			/>
		{/if}
	</div>
</figure>

<style>
	figure {
		margin: 0;
	}
	.window {
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--bg-raised);
		overflow: hidden;
		box-shadow: 0 30px 70px -40px rgb(0 0 0 / 0.8);
	}
	.window > :global(*) {
		width: 100%;
		height: auto;
	}
	.tall .window {
		max-width: 300px;
		margin-inline: auto;
		border-radius: 28px;
		border: 6px solid #1b1e26;
		outline: 1px solid var(--border-strong);
	}
</style>
