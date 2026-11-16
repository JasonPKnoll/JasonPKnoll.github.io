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

{#snippet content()}
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
{/snippet}

<figure class:tall>
	{#if tall}
		<!-- Phone-sized recordings sit in a drawn phone, status bar on top like the real thing. -->
		<div class="phone">
			<div class="screen">
				<div class="status" aria-hidden="true">
					<span class="time">9:41</span>
					<span class="island"></span>
					<span class="icons">
						<svg viewBox="0 0 18 12"
							><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect
								x="10"
								y="3"
								width="3"
								height="9"
								rx="1"
							/><rect x="15" y="0" width="3" height="12" rx="1" /></svg
						>
						<svg viewBox="0 0 16 12"
							><path
								d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .5 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 3.9a7 7 0 0 0-4.8 1.8L4.4 7c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c.5 0 1 .2 1.3.5L8 11 6.7 9.5c.3-.3.8-.5 1.3-.5Z"
							/></svg
						>
						<svg class="battery" viewBox="0 0 27 13"
							><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" /><rect
								x="2"
								y="2"
								width="20"
								height="9"
								rx="2"
							/><path d="M25 4.5v4c.8-.3 1.5-1 1.5-2s-.7-1.7-1.5-2Z" opacity="0.45" /></svg
						>
					</span>
				</div>
				{@render content()}
				<span class="home" aria-hidden="true"></span>
			</div>
		</div>
	{:else}
		<div class="window">{@render content()}</div>
	{/if}
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

	/* ---------- Phone ---------- */
	.phone {
		position: relative;
		max-width: 300px;
		margin-inline: auto;
		padding: 11px;
		border-radius: 54px;
		background: linear-gradient(145deg, #4a4f5c, #23262e 35%, #1a1c22 65%, #3b3f4a);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 255 255 / 0.14),
			inset 0 0 0 4px #121318,
			0 0 0 1px #08090c,
			0 40px 80px -30px rgb(0 0 0 / 0.9),
			0 0 60px -20px rgb(124 242 201 / 0.18);
	}
	/* Side buttons: action and volume on the left, power on the right. */
	.phone::before,
	.phone::after {
		content: '';
		position: absolute;
		width: 3px;
		border-radius: 2px;
		background: linear-gradient(90deg, #2b2e36, #4a4f5c);
	}
	.phone::before {
		left: -3px;
		top: 18%;
		height: 30%;
		background:
			linear-gradient(#2b2e36, #4a4f5c) 0 0 / 100% 10% no-repeat,
			linear-gradient(#2b2e36, #4a4f5c) 0 32% / 100% 28% no-repeat,
			linear-gradient(#2b2e36, #4a4f5c) 0 100% / 100% 28% no-repeat;
	}
	.phone::after {
		right: -3px;
		top: 26%;
		height: 15%;
	}
	.screen {
		position: relative;
		container-type: inline-size;
		border-radius: 43px;
		overflow: hidden;
		background: #fff;
		/* Hairline so the screen edge reads against the bezel. */
		box-shadow: 0 0 0 1px #000;
	}
	.screen > :global(video),
	.screen > :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}
	.status {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 13.5cqw;
		padding: 0 7.5cqw 0 9.5cqw;
		color: #000;
		font-family: -apple-system, BlinkMacSystemFont, 'Inter Variable', sans-serif;
	}
	.time {
		font-size: 4.3cqw;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.island {
		position: absolute;
		left: 50%;
		top: 2.9cqw;
		width: 31cqw;
		height: 9.2cqw;
		border-radius: 999px;
		background: #000;
		transform: translateX(-50%);
	}
	.icons {
		display: flex;
		align-items: center;
		gap: 1.4cqw;
	}
	.icons svg {
		height: 3cqw;
		width: auto;
		fill: currentColor;
	}
	.icons .battery {
		height: 3.3cqw;
	}
	.home {
		position: absolute;
		left: 50%;
		bottom: 2.2cqw;
		width: 34cqw;
		height: 1.3cqw;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.75);
		transform: translateX(-50%);
	}
</style>
