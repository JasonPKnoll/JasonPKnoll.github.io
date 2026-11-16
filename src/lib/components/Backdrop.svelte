<!--
	Quiet ambient layer fixed behind every page: a faint dot grid that fades
	toward the edges, two soft glows in the accent colours that drift very
	slowly, and fine grain so the dark reads as a surface, not a flat fill.
-->
<div class="backdrop" aria-hidden="true">
	<div class="glow mint"></div>
	<div class="glow blue"></div>
	<div class="dots"></div>
	<div class="grain"></div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
	}
	.glow {
		position: absolute;
		width: 70vmax;
		height: 70vmax;
		border-radius: 50%;
		filter: blur(40px);
		animation: drift 46s ease-in-out infinite alternate;
	}
	.mint {
		left: -28vmax;
		bottom: -38vmax;
		background: radial-gradient(closest-side, rgb(124 242 201 / 0.1), transparent);
	}
	.blue {
		right: -26vmax;
		top: -30vmax;
		background: radial-gradient(closest-side, rgb(139 156 255 / 0.12), transparent);
		animation-duration: 58s;
		animation-direction: alternate-reverse;
	}
	@keyframes drift {
		to {
			transform: translate(6vmax, -4vmax) scale(1.08);
		}
	}
	.dots {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.085) 1px, transparent 0) 0 0 / 26px 26px;
		mask-image: radial-gradient(ellipse 75% 65% at 50% 40%, #000 10%, transparent 75%);
		-webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 40%, #000 10%, transparent 75%);
	}
	.grain {
		position: absolute;
		inset: -50%;
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	@media (prefers-reduced-motion: reduce) {
		.glow {
			animation: none;
		}
	}
</style>
