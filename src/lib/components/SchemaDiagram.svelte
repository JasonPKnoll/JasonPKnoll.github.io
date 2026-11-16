<script lang="ts">
	/**
	 * A database diagram built from real tables instead of an image.
	 *
	 * Each foreign key is a wire from its row to the primary key of the table it
	 * points to, with crow's foot ends: a fork on the "many" side and a double
	 * bar on the "one" side. The diagram is laid out at a fixed width and scaled
	 * down as a whole on narrow screens, so phones get the same picture. Picking
	 * a table shows its fields and relationships in a readable panel below.
	 */
	import { tick } from 'svelte';
	import { KeyRound, X } from '@lucide/svelte';
	import type { Schema } from '#lib/projects.ts';

	let { schema }: { schema: Schema } = $props();

	/** Width the diagram is laid out at. Narrower screens scale it down. */
	const WIDTH = 820;

	type Wire = { from: string; to: string; color: string; d: string; marks: string };

	let viewport: HTMLDivElement | undefined = $state();
	let canvas: HTMLDivElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();
	let ready = $state(false);
	let scale = $state(1);
	let height = $state(0);
	let wires: Wire[] = $state([]);
	let hovered: string | null = $state(null);
	let selected: string | null = $state(null);
	const active = $derived(hovered ?? selected);

	const tableOf = (name: string) => schema.tables.find((t) => t.name === name);
	const colorOf = (name: string) => tableOf(name)?.color ?? 'mint';
	const singular = (name: string) => name.replace(/_/g, ' ').replace(/s$/, '');
	const plural = (name: string) => name.replace(/_/g, ' ') + (name.endsWith('s') ? '' : 's');

	const relations = $derived(
		schema.tables.flatMap((t) =>
			t.columns.filter((c) => c.ref).map((c) => ({ from: t.name, col: c.name, to: c.ref! }))
		)
	);

	/** The active table plus every table it links to, in either direction. */
	const linked = $derived.by(() => {
		if (!active) return null;
		const set = new Set<string>([active]);
		for (const r of relations) {
			if (r.from === active) set.add(r.to);
			if (r.to === active) set.add(r.from);
		}
		return set;
	});

	const picked = $derived(selected ? tableOf(selected) : undefined);
	const pickedRelations = $derived(
		selected ? relations.filter((r) => r.from === selected || r.to === selected) : []
	);

	function measure() {
		if (!viewport || !canvas) return;
		scale = Math.min(1, viewport.clientWidth / WIDTH);
		height = canvas.offsetHeight;
		layout();
	}

	function layout() {
		const root = canvas;
		if (!root) return;
		const box = root.getBoundingClientRect();
		// Undo any scaling so wires use the canvas's own coordinates.
		const k = box.width / root.offsetWidth || 1;
		const rect = (el: Element | null) => {
			const r = el!.getBoundingClientRect();
			return {
				l: (r.left - box.left) / k,
				r: (r.right - box.left) / k,
				y: ((r.top + r.bottom) / 2 - box.top) / k
			};
		};

		wires = relations.map(({ from, col, to }) => {
			const a = rect(root.querySelector(`[data-table="${from}"]`));
			const b = rect(root.querySelector(`[data-table="${to}"]`));
			const y1 = rect(root.querySelector(`[data-table="${from}"] [data-col="${col}"]`)).y;
			const y2 = rect(root.querySelector(`[data-table="${to}"] [data-pk]`)).y;
			// n1 and n2 point away from each card, along the wire.
			let x1: number, x2: number, n1: number, n2: number, d: string;

			if (a.l < b.r && b.l < a.r) {
				// Same column: loop out around the side, away from the middle when possible.
				const side = (a.l + a.r) / 2 < WIDTH / 2 - 10 ? -1 : 1;
				x1 = side < 0 ? a.l : a.r;
				x2 = side < 0 ? b.l : b.r;
				n1 = n2 = side;
				d = `M${x1} ${y1} C${x1 + side * 40} ${y1} ${x2 + side * 40} ${y2} ${x2} ${y2}`;
			} else {
				const dir = b.l > a.l ? 1 : -1;
				x1 = dir > 0 ? a.r : a.l;
				x2 = dir > 0 ? b.l : b.r;
				n1 = dir;
				n2 = -dir;
				const dx = Math.max(28, Math.abs(x2 - x1) / 2);
				d = `M${x1} ${y1} C${x1 + dir * dx} ${y1} ${x2 - dir * dx} ${y2} ${x2} ${y2}`;
			}

			// Crow's foot (many) at the foreign key, double bar (one) at the primary key.
			const f = x1 + n1 * 12;
			const marks =
				`M${x1} ${y1 - 5.5} L${f} ${y1} L${x1} ${y1 + 5.5} M${x1 + n1 * 16} ${y1 - 5.5} V${y1 + 5.5} ` +
				`M${x2 + n2 * 7} ${y2 - 5.5} V${y2 + 5.5} M${x2 + n2 * 11} ${y2 - 5.5} V${y2 + 5.5}`;

			return { from, to, color: colorOf(to), d, marks };
		});
	}

	$effect(() => {
		if (!viewport || !canvas) return;
		ready = true;
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		observer.observe(canvas);
		document.fonts?.ready.then(measure);
		return () => observer.disconnect();
	});

	async function pick(name: string) {
		selected = selected === name ? null : name;
		// On a scaled-down diagram the details matter most, so bring them into view.
		if (selected && scale < 0.8) {
			await tick();
			panel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}

	const touches = (w: Wire) => w.from === active || w.to === active;
</script>

{#snippet oneToMany()}
	<svg class="glyph" viewBox="0 0 48 12" aria-hidden="true">
		<path d="M2 6H46M5 1V11M9 1V11M46 1L34 6L46 11M30 1V11" />
	</svg>
{/snippet}

<figure class="schema" aria-label={schema.label}>
	<div
		class="viewport"
		class:ready
		bind:this={viewport}
		style:height={ready ? `${height * scale}px` : null}
	>
		<div
			class="canvas"
			class:has-active={!!active}
			style:width="{WIDTH}px"
			style:transform={ready && scale < 1 ? `scale(${scale})` : null}
			style:--areas={schema.areas.map((row) => `"${row}"`).join(' ')}
			bind:this={canvas}
		>
			<svg class="wires" aria-hidden="true">
				{#each wires as w, i (i)}
					<g class="wire" class:on={active && touches(w)} style:--c="var(--c-{w.color})">
						<path class="line" d={w.d} />
						<path class="marks" d={w.marks} />
					</g>
				{/each}
			</svg>

			{#each schema.tables as t (t.name)}
				<div
					class="card"
					role="button"
					tabindex="0"
					aria-pressed={selected === t.name}
					aria-label="{t.name} table, show fields and relationships"
					data-table={t.name}
					class:dim={linked && !linked.has(t.name)}
					class:current={active === t.name}
					style:--area={t.name}
					style:--c={t.color ? `var(--c-${t.color})` : null}
					onclick={() => pick(t.name)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							pick(t.name);
						}
					}}
					onpointerenter={(e) => e.pointerType === 'mouse' && (hovered = t.name)}
					onpointerleave={() => (hovered = null)}
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
	</div>

	<div class="legend">
		<span class="key">{@render oneToMany()} one to many</span>
		<span class="key"><KeyRound size={12} aria-hidden="true" /> primary key</span>
		<span class="key"><span class="ref" style:--c="var(--c-mint)">→ table</span> foreign key</span>
	</div>

	<div class="panel" bind:this={panel} aria-live="polite">
		{#if picked}
			<div class="panel-head" style:--c={picked.color ? `var(--c-${picked.color})` : null}>
				<h4 class="mono">{picked.name}</h4>
				<button type="button" class="close" onclick={() => (selected = null)} aria-label="Close details">
					<X size={16} />
				</button>
			</div>

			<ul class="fields">
				{#each picked.columns as c (c.name)}
					<li class:fk={!!c.ref} style:--c={c.ref ? `var(--c-${colorOf(c.ref)})` : null}>
						<span class="mono">
							{#if c.pk}<KeyRound size={11} aria-label="Primary key" />{/if}
							{c.name}
						</span>
						<span class="mono type">{c.ref ? `→ ${c.ref}` : c.type}</span>
					</li>
				{/each}
			</ul>

			<p class="label mono">Relationships</p>
			<ul class="rels">
				{#each pickedRelations as r (r.from + r.col)}
					<li>
						<span class="pair mono">
							<span class="name" style:--c="var(--c-{colorOf(r.to)})">{r.to}</span>
							<span class="n">1</span>
							{@render oneToMany()}
							<span class="n">N</span>
							<span class="name" style:--c={tableOf(r.from)?.color ? `var(--c-${colorOf(r.from)})` : null}>{r.from}</span>
						</span>
						<span class="say">
							One {singular(r.to)} has many {plural(r.from)}
							<span class="mono via">{r.from}.{r.col}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="hint">
				<span class="touch">Tap</span><span class="mouse">Hover or click</span> a table to trace its
				relationships and see its fields up close.
			</p>
		{/if}
	</div>
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
	.viewport {
		/* Without JavaScript the diagram scrolls sideways instead of scaling. */
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 20px;
		background:
			radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.05) 1px, transparent 0) 0 0 / 22px 22px,
			var(--bg-raised);
	}
	.viewport.ready {
		overflow: hidden;
	}
	.canvas {
		position: relative;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-areas: var(--areas);
		gap: 2rem 3.4rem;
		align-items: start;
		padding: 2.25rem 2.5rem;
		transform-origin: 0 0;
	}

	/* ---------- Wires ---------- */
	.wires {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}
	.wire {
		color: var(--c);
		opacity: 0.6;
		transition: opacity 0.25s;
	}
	.wire path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.has-active .wire {
		opacity: 0.07;
	}
	.has-active .wire.on {
		opacity: 1;
	}
	.wire.on .line {
		stroke-width: 1.8;
		stroke-dasharray: 5 4;
		animation: flow 0.9s linear infinite;
	}
	.wire.on .marks {
		stroke-width: 1.8;
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
		cursor: pointer;
		transition:
			opacity 0.25s,
			border-color 0.25s,
			box-shadow 0.25s;
	}
	.card.dim {
		opacity: 0.3;
	}
	.card.current,
	.card[aria-pressed='true'] {
		border-color: var(--c, var(--text-dim));
		box-shadow:
			0 0 0 1px var(--c, var(--text-dim)),
			0 10px 30px rgb(0 0 0 / 0.35);
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
	.legend {
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
		gap: 0.45rem;
	}
	.glyph {
		width: 34px;
		height: 10px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.legend .glyph {
		color: var(--text-muted);
	}

	/* ---------- Details panel ---------- */
	.panel {
		margin-top: 1rem;
		padding: 1rem 1.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-card);
		scroll-margin: calc(var(--nav-h) + 1rem) 0 1rem;
	}
	.hint {
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.touch {
		display: none;
	}
	@media (hover: none) {
		.touch {
			display: inline;
		}
		.mouse {
			display: none;
		}
	}
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.85rem;
	}
	.panel-head h4 {
		font-size: 0.95rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--c, var(--text));
	}
	.close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.close:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
	.panel ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* The diagram already shows fields at full size on wide screens. */
	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
		gap: 0 1.5rem;
		margin-bottom: 1rem !important;
		font-size: 0.8rem;
	}
	.fields li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--border);
	}
	.fields li.fk {
		color: var(--c);
	}
	.fields .type {
		color: var(--text-dim);
	}
	.fields li.fk .type {
		color: var(--c);
	}
	.fields :global(svg) {
		display: inline-block;
		vertical-align: -1px;
		margin-right: 0.2rem;
	}
	@container (min-width: 700px) {
		.fields {
			display: none;
		}
	}
	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		margin-bottom: 0.5rem;
	}
	.rels {
		display: grid;
		gap: 0.75rem;
	}
	.rels li {
		display: grid;
		gap: 0.2rem;
	}
	.pair {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
	}
	.pair .name {
		color: var(--c, var(--text));
		font-weight: 600;
	}
	.pair .n {
		color: var(--text-dim);
	}
	.pair .glyph {
		color: var(--text-muted);
	}
	.say {
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.via {
		margin-left: 0.35rem;
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	@media (prefers-reduced-motion: reduce) {
		.wire.on .line {
			animation: none;
		}
	}
</style>
