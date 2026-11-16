<script lang="ts">
	/**
	 * A database diagram built from real tables instead of an image. Each
	 * foreign key is drawn as a wire from its row to the primary key of the
	 * table it points to. Hovering a table highlights its relationships.
	 * On narrow screens the wires are hidden and each key names its table.
	 */
	import { KeyRound } from '@lucide/svelte';
	import type { Schema } from '#lib/projects.ts';

	let { schema }: { schema: Schema } = $props();

	type Wire = { from: string; to: string; color: string; d: string; a: [number, number]; b: [number, number] };

	let canvas: HTMLDivElement | undefined = $state();
	let size = $state({ w: 0, h: 0 });
	let wires: Wire[] = $state([]);
	let active: string | null = $state(null);

	const colorOf = (name: string) => schema.tables.find((t) => t.name === name)?.color ?? 'mint';

	const relations = $derived(
		schema.tables.flatMap((t) =>
			t.columns.filter((c) => c.ref).map((c) => ({ from: t.name, col: c.name, to: c.ref! }))
		)
	);

	/** The active table plus every table it links to, in either direction. */
	const linked = $derived.by(() => {
		if (!active) return null;
		const set = new Set([active]);
		for (const r of relations) {
			if (r.from === active) set.add(r.to);
			if (r.to === active) set.add(r.from);
		}
		return set;
	});

	function layout() {
		const root = canvas;
		if (!root) return;
		const box = root.getBoundingClientRect();
		size = { w: box.width, h: box.height };
		const rect = (el: Element | null) => {
			const r = el!.getBoundingClientRect();
			return { l: r.left - box.left, r: r.right - box.left, y: (r.top + r.bottom) / 2 - box.top };
		};

		wires = relations.map(({ from, col, to }) => {
			const a = rect(root.querySelector(`[data-table="${from}"]`));
			const b = rect(root.querySelector(`[data-table="${to}"]`));
			const y1 = rect(root.querySelector(`[data-table="${from}"] [data-col="${col}"]`)).y;
			const y2 = rect(root.querySelector(`[data-table="${to}"] [data-pk]`)).y;
			let x1: number, x2: number, c1: number, c2: number;

			if (a.l < b.r && b.l < a.r) {
				// Same column: loop out around the side, away from the middle when possible.
				const side = (a.l + a.r) / 2 < box.width / 2 - 10 ? -1 : 1;
				x1 = side < 0 ? a.l : a.r;
				x2 = side < 0 ? b.l : b.r;
				c1 = x1 + side * 34;
				c2 = x2 + side * 34;
			} else {
				const dir = b.l > a.l ? 1 : -1;
				x1 = dir > 0 ? a.r : a.l;
				x2 = dir > 0 ? b.l : b.r;
				const dx = Math.max(24, Math.abs(x2 - x1) / 2);
				c1 = x1 + dir * dx;
				c2 = x2 - dir * dx;
			}
			return {
				from,
				to,
				color: colorOf(to),
				d: `M${x1} ${y1} C${c1} ${y1} ${c2} ${y2} ${x2} ${y2}`,
				a: [x1, y1],
				b: [x2, y2]
			};
		});
	}

	$effect(() => {
		if (!canvas) return;
		const observer = new ResizeObserver(layout);
		observer.observe(canvas);
		document.fonts?.ready.then(layout);
		return () => observer.disconnect();
	});

	const touches = (w: Wire) => w.from === active || w.to === active;
</script>

<figure class="schema" aria-label={schema.label}>
	<div
		class="canvas"
		class:has-active={!!active}
		style:--areas={schema.areas.map((row) => `"${row}"`).join(' ')}
		bind:this={canvas}
	>
		<svg class="wires" width={size.w} height={size.h} aria-hidden="true">
			{#each wires as w, i (i)}
				<g class="wire" class:on={active && touches(w)} style:--c="var(--c-{w.color})">
					<path d={w.d} />
					<circle class="end" cx={w.a[0]} cy={w.a[1]} r="2.5" />
					<circle class="start" cx={w.b[0]} cy={w.b[1]} r="3" />
				</g>
			{/each}
		</svg>

		{#each schema.tables as t (t.name)}
			<div
				class="card"
				role="group"
				aria-label="{t.name} table"
				data-table={t.name}
				class:dim={linked && !linked.has(t.name)}
				class:current={active === t.name}
				style:--area={t.name}
				style:--c={t.color ? `var(--c-${t.color})` : null}
				onpointerenter={() => (active = t.name)}
				onpointerleave={() => (active = null)}
			>
				<table>
					<caption class:colored={!!t.color}>{t.name}</caption>
					<tbody>
						{#each t.columns as c (c.name)}
							<tr
								data-col={c.name}
								data-pk={c.pk ? '' : undefined}
								class:fk={!!c.ref}
								style:--c={c.ref ? `var(--c-${colorOf(c.ref)})` : null}
							>
								<th scope="row">
									{#if c.pk}<KeyRound size={12} aria-label="Primary key" />{/if}
									{c.name}
								</th>
								<td>
									{#if c.ref}<span class="ref"><span aria-hidden="true">→</span> {c.ref}</span>{:else}{c.type}{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>
	<figcaption>
		<span class="key"><KeyRound size={12} aria-hidden="true" /> primary key</span>
		<span class="key"><span class="ref" style:--c="var(--c-mint)">→ table</span> foreign key, colored by the table it points to</span>
		<span class="hint">Hover a table to trace its relationships.</span>
	</figcaption>
</figure>

<style>
	.schema {
		--c-mint: var(--accent);
		--c-blue: var(--accent-2);
		--c-coral: #ff9c86;
		--c-pink: #f592cf;
		margin: 0.5rem 0 0;
		container-type: inline-size;
	}
	.canvas {
		position: relative;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-areas: var(--areas);
		gap: 2rem 3.25rem;
		align-items: start;
		padding: 2.25rem 2.5rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background:
			radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.05) 1px, transparent 0) 0 0 / 22px 22px,
			var(--bg-raised);
	}

	/* ---------- Wires ---------- */
	.wires {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: visible;
	}
	.wire {
		color: var(--c);
		opacity: 0.45;
		transition: opacity 0.25s;
	}
	.wire path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.25;
	}
	.wire .start {
		fill: currentColor;
	}
	.wire .end {
		fill: var(--bg-raised);
		stroke: currentColor;
		stroke-width: 1.25;
	}
	.has-active .wire {
		opacity: 0.07;
	}
	.has-active .wire.on {
		opacity: 1;
	}
	.wire.on path {
		stroke-width: 1.75;
		stroke-dasharray: 5 4;
		animation: flow 0.9s linear infinite;
	}
	@keyframes flow {
		to {
			stroke-dashoffset: -9;
		}
	}

	/* ---------- Tables ---------- */
	.card {
		position: relative;
		grid-area: var(--area);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		background: var(--bg-card);
		overflow: hidden;
		transition:
			opacity 0.25s,
			border-color 0.25s,
			box-shadow 0.25s;
	}
	.card.dim {
		opacity: 0.3;
	}
	.card.current {
		border-color: var(--c, var(--text-dim));
		box-shadow: 0 0 0 1px var(--c, var(--text-dim)), 0 10px 30px rgb(0 0 0 / 0.35);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.74rem;
	}
	caption {
		text-align: left;
		padding: 0.6rem 0.8rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text);
		background: rgb(255 255 255 / 0.03);
		border-bottom: 1px solid var(--border-strong);
	}
	caption.colored {
		color: var(--c);
		background: color-mix(in srgb, var(--c) 10%, transparent);
		box-shadow: inset 0 2px 0 var(--c);
	}
	th,
	td {
		padding: 0.38rem 0.8rem;
		text-align: left;
		font-weight: 400;
		white-space: nowrap;
	}
	tr + tr {
		border-top: 1px solid var(--border);
	}
	th {
		color: var(--text);
	}
	th :global(svg) {
		display: inline-block;
		vertical-align: -1px;
		margin-right: 0.25rem;
		color: var(--c, var(--text-muted));
	}
	td {
		text-align: right;
		color: var(--text-dim);
	}
	tr.fk th {
		color: var(--c);
		box-shadow: inset 2px 0 0 var(--c);
	}
	.ref {
		display: inline-block;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		color: var(--c);
		background: color-mix(in srgb, var(--c) 13%, transparent);
	}

	/* ---------- Legend ---------- */
	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		margin-top: 0.9rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.hint {
		margin-left: auto;
	}

	/* Too narrow for wires: a plain grid of tables. */
	@container (max-width: 760px) {
		.canvas {
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
			grid-template-areas: none;
			gap: 1rem;
			padding: 1rem;
		}
		.card {
			grid-area: auto;
		}
		.wires,
		.hint {
			display: none;
		}
	}
	@media (hover: none) {
		.hint {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.wire.on path {
			animation: none;
		}
	}
</style>
