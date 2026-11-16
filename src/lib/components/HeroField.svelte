<script lang="ts">
	/**
	 * A perspective "terrain" of points that undulates over time and lifts
	 * where the pointer hovers. Pure canvas 2D, no dependencies.
	 * Pauses when offscreen / tab hidden, renders a still frame for reduced motion.
	 */
	let canvas: HTMLCanvasElement;

	$effect(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const COLS = 96;
		const ROWS = 72;
		const SPACING = 0.32;
		const Z0 = 3.5; // nearest row; closer rows would fall below the viewport
		const CAM_HEIGHT = 2.1;
		const HORIZON = 0.42; // vanishing line, as a fraction of canvas height
		const FOCAL = 1.15;

		// accent (#7cf2c9) -> accent-2 (#8b9cff), interpolated by depth
		const near = [124, 242, 201];
		const far = [139, 156, 255];

		let w = 0;
		let h = 0;
		let dpr = 1;
		let raf = 0;
		let running = false;
		let visible = true;
		const start = performance.now();

		// pointer, in CSS pixels; eased toward target for smoothness
		const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, strength: 0, target: 0 };

		function resize() {
			const rect = canvas.getBoundingClientRect();
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = rect.width;
			h = rect.height;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (!running) draw(performance.now());
		}

		function project(x: number, y: number, z: number) {
			// camera at (0, CAM_HEIGHT, 0) looking straight down +z
			if (z <= 0.1) return null;
			const scale = (FOCAL * Math.min(w, h * 1.6)) / z;
			return { sx: w / 2 + x * scale, sy: h * HORIZON - (y - CAM_HEIGHT) * scale, depth: z, scale };
		}

		function draw(now: number) {
			const t = (now - start) / 1000;
			pointer.x += (pointer.tx - pointer.x) * 0.12;
			pointer.y += (pointer.ty - pointer.y) * 0.12;
			pointer.strength += (pointer.target - pointer.strength) * 0.06;

			ctx!.clearRect(0, 0, w, h);
			const halfW = (COLS * SPACING) / 2;
			const radius = Math.max(140, Math.min(w, h) * 0.22);

			for (let r = 0; r < ROWS; r++) {
				const z = Z0 + r * SPACING;
				for (let c = 0; c < COLS; c++) {
					const x = -halfW + c * SPACING;
					let y =
						Math.sin(x * 0.55 + t * 0.7) * 0.18 +
						Math.cos(z * 0.45 - t * 0.5) * 0.22 +
						Math.sin((x + z) * 0.25 + t * 0.3) * 0.15;

					let p = project(x, y, z);
					if (!p) continue;

					if (pointer.strength > 0.01) {
						// lift points near the pointer (measured in screen space)
						const dx = p.sx - pointer.x;
						const dy = p.sy - pointer.y;
						const falloff = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
						if (falloff > 0.002) {
							y += falloff * 0.9 * pointer.strength;
							p = project(x, y, z);
						}
					}

					if (!p || p.sx < -10 || p.sx > w + 10 || p.sy < -10 || p.sy > h + 10) continue;

					const k = Math.min(1, (p.depth - Z0) / (ROWS * SPACING));
					const alpha = Math.max(0, 0.85 * (1 - k) ** 1.4) * Math.min(1, 0.35 + (y + 0.5) * 0.8);
					if (alpha < 0.02) continue;

					const cr = near[0] + (far[0] - near[0]) * k;
					const cg = near[1] + (far[1] - near[1]) * k;
					const cb = near[2] + (far[2] - near[2]) * k;
					const size = Math.max(0.6, Math.min(2.6, p.scale * 0.022));

					ctx!.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha.toFixed(3)})`;
					ctx!.fillRect(p.sx - size / 2, p.sy - size / 2, size, size);
				}
			}
		}

		function loop(now: number) {
			draw(now);
			raf = requestAnimationFrame(loop);
		}

		function play() {
			if (running || reduceMotion || !visible || document.hidden) return;
			running = true;
			raf = requestAnimationFrame(loop);
		}
		function pause() {
			running = false;
			cancelAnimationFrame(raf);
		}

		function onPointerMove(e: PointerEvent) {
			const rect = canvas.getBoundingClientRect();
			pointer.tx = e.clientX - rect.left;
			pointer.ty = e.clientY - rect.top;
			if (pointer.x < -1000) {
				pointer.x = pointer.tx;
				pointer.y = pointer.ty;
			}
			pointer.target = 1;
		}
		function onPointerLeave() {
			pointer.target = 0;
		}
		function onVisibility() {
			if (document.hidden) pause();
			else play();
		}

		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible) play();
			else pause();
		});
		io.observe(canvas);

		const host = canvas.parentElement!;
		host.addEventListener('pointermove', onPointerMove);
		host.addEventListener('pointerleave', onPointerLeave);
		document.addEventListener('visibilitychange', onVisibility);

		resize();
		play();

		return () => {
			pause();
			ro.disconnect();
			io.disconnect();
			host.removeEventListener('pointermove', onPointerMove);
			host.removeEventListener('pointerleave', onPointerLeave);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
