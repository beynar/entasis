<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useTheme } from 'entasis/theme';
	import type { SectionDensity, Tone } from '../engine/levers.js';
	import { provideSectionTone } from './sectionKit.js';
	import { useSectionScope } from './sectionScope.js';

	/**
	 * The boundaries every generative section shares, enforced in one place: a 12-column grid with
	 * a fixed gutter, safe inline space, a maximum content width, block padding from the density
	 * lever, and the tone's surface. Everything resolves to theme tokens, so the global theme moves
	 * every section at once.
	 */
	interface Props {
		tone: Tone;
		density: SectionDensity;
		as?: 'section' | 'header' | 'footer' | 'nav' | 'aside';
		label?: string;
		/** A bar (navigation) pads by control spacing instead of section spacing. */
		bar?: boolean;
		width?: 'content' | 'narrow';
		class?: string;
		children: Snippet;
	}

	let {
		tone,
		density,
		as = 'section',
		label,
		bar = false,
		width = 'content',
		class: className = '',
		children
	}: Props = $props();

	const theme = useTheme();
	provideSectionTone(() => tone);
	const scope = useSectionScope();
	// Inverse flips the colour scheme for the subtree: every component inside re-reads the palette.
	const flipped = $derived(
		tone === 'inverse' ? (theme.resolvedTheme === 'dark' ? 'light' : 'dark') : undefined
	);
	const toneClasses: Record<Tone, string> = {
		plain: 'bg-surface text-neutral',
		muted: 'bg-surface-recessed text-neutral',
		tint: 'bg-primary-muted text-neutral',
		inverse: 'bg-surface text-neutral',
		brand: 'bg-primary text-primary-contrast'
	};
</script>

<svelte:element
	this={as}
	aria-label={label}
	data-tone={tone}
	data-density={density}
	data-bar={bar || undefined}
	class="gen-section @container/section {flipped ?? ''} {toneClasses[tone]} {className}"
	style={flipped ? scope.inverseStyle?.() : undefined}
	style:color-scheme={flipped}
>
	<div class="gen-inner">
		<div class="gen-content" data-width={width}>
			{@render children()}
		</div>
	</div>
</svelte:element>

<style>
	.gen-section {
		position: relative;
		width: 100%;
	}
	.gen-inner {
		--gen-gutter: var(--layout-space-md);
		--gen-pad: var(--layout-space-xl);
		--gen-gap: var(--layout-space-lg);
		padding-inline: var(--layout-space-md);
		padding-block: var(--gen-pad);
	}
	.gen-content {
		margin-inline: auto;
		width: 100%;
		max-width: 72rem;
	}
	.gen-content[data-width='narrow'] {
		max-width: 48rem;
	}
	[data-density='compact'] > .gen-inner {
		--gen-pad: var(--layout-space-lg);
		--gen-gap: var(--layout-space-md);
	}
	[data-density='comfortable'] > .gen-inner {
		--gen-pad: calc(var(--layout-space-xl) * 1.5);
		--gen-gap: var(--layout-space-xl);
	}
	[data-bar] > .gen-inner {
		--gen-pad: var(--space-md);
		--gen-gap: var(--space-xl);
	}

	@container section (min-width: 48rem) {
		.gen-inner {
			--gen-gutter: var(--layout-space-lg);
			padding-inline: var(--layout-space-xl);
		}
		[data-density='compact'] > .gen-inner {
			--gen-pad: var(--layout-space-xl);
			--gen-gap: var(--layout-space-lg);
		}
		[data-density='normal'] > .gen-inner {
			--gen-pad: calc(var(--layout-space-xl) * 2);
			--gen-gap: var(--layout-space-xl);
		}
		[data-density='comfortable'] > .gen-inner {
			--gen-pad: calc(var(--layout-space-xl) * 3);
			--gen-gap: calc(var(--layout-space-xl) * 1.5);
		}
		[data-bar][data-density='compact'] > .gen-inner {
			--gen-pad: var(--space-lg);
		}
		[data-bar][data-density='normal'] > .gen-inner {
			--gen-pad: var(--space-xl);
		}
	}

	/* Layout vocabulary for the sections inside: a 12-column grid that collapses to one column
	   below the section breakpoint, columns placed by span/start/row variables, and a vertical
	   flow spaced by the density gap. */
	.gen-section :global(.gen-grid) {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--gen-gap) var(--gen-gutter);
	}
	.gen-section :global(.gen-col) {
		grid-column: 1 / -1;
		min-width: 0;
	}
	.gen-section :global(.gen-flow) {
		display: flex;
		flex-direction: column;
		gap: var(--gen-gap);
	}
	/* Item grids (cards, quotes, plans) share the section gutter, so every grid on a page lines up. */
	.gen-section :global(.gen-items) {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--gen-gutter);
	}
	@container section (min-width: 36rem) {
		.gen-section :global(.gen-items:not([data-cols='1'])) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@container section (min-width: 56rem) {
		.gen-section :global(.gen-items[data-cols='3']) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.gen-section :global(.gen-items[data-cols='4']) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		.gen-section :global(.gen-items[data-cols='6']) {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
	}
	@container section (min-width: 48rem) {
		.gen-section :global(.gen-grid) {
			grid-template-columns: repeat(12, minmax(0, 1fr));
		}
		.gen-section :global(.gen-col) {
			grid-column: var(--gen-start, auto) / span var(--gen-span, 12);
			grid-row: var(--gen-row, auto);
		}
		.gen-section :global(.gen-desktop-hidden) {
			display: none;
		}
	}
	@container section (max-width: calc(48rem - 0.02px)) {
		.gen-section :global(.gen-mobile-hidden) {
			display: none;
		}
	}
</style>
