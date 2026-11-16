<script lang="ts">
	/**
	 * The striped retro sun from the favicon, animated: stripes peel off the cut
	 * at the bottom of the sun and thin out as they rise. With reduced motion it
	 * holds still, with the stripes spaced much like the favicon.
	 */
	let { size = 30 }: { size?: number } = $props();

	const id = $props.id();
	const bars = 5;
</script>

<svg width={size} height={size} viewBox="4.5 4.5 23 23" aria-hidden="true">
	<defs>
		<linearGradient id="{id}-sun" gradientUnits="userSpaceOnUse" x1="0" y1="5" x2="0" y2="27">
			<stop offset="0" stop-color="#7cf2c9" />
			<stop offset="1" stop-color="#8b9cff" />
		</linearGradient>
		<mask id="{id}-stripes" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
			<rect width="32" height="32" fill="#fff" />
			<rect y="25.8" width="32" height="6.2" fill="#000" />
			{#each { length: bars } as _, i (i)}
				<rect class="bar" y="25.8" width="32" height="2.4" fill="#000" style:--i={i} />
			{/each}
		</mask>
	</defs>
	<circle cx="16" cy="16" r="11" fill="url(#{id}-sun)" mask="url(#{id}-stripes)" />
</svg>

<style>
	svg {
		display: block;
		flex: none;
		filter: drop-shadow(0 0 6px rgb(124 242 201 / 0.3));
	}
	.bar {
		--duration: 16s;
		transform-box: fill-box;
		transform-origin: center;
		animation: rise var(--duration) linear infinite;
		/* Stagger the bars evenly along the loop. */
		animation-delay: calc(var(--i) * var(--duration) / -5);
	}
	@keyframes rise {
		from {
			transform: translateY(0) scaleY(1);
		}
		to {
			transform: translateY(-11.4px) scaleY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar {
			animation-play-state: paused;
		}
	}
</style>
