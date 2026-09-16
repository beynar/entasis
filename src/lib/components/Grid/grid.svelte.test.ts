import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Grid from './Grid.svelte';
import GridSpan from './GridSpan.svelte';

const grid = (container: HTMLElement) => container.querySelector('[data-slot="grid"]')!;
const tracks = (container: HTMLElement) =>
	container.querySelector('[data-slot="grid-tracks"]') as HTMLElement;

describe('Grid markup', () => {
	test('the root is the container and the tracks it wraps carry the layout', () => {
		const { container } = render(Grid, { props: { columns: 3, gap: 'lg' } });
		expect(grid(container).className).toContain('@container/grid');
		expect(tracks(container).parentElement).toBe(grid(container));
		expect(tracks(container).style.getPropertyValue('--grid-columns-xs')).toBe(
			'repeat(3, minmax(0, 1fr))'
		);
		expect(tracks(container).style.getPropertyValue('--grid-gap-xl')).toBe(
			'var(--space-lg) var(--space-lg)'
		);
	});

	test('a record writes a different template per step while the DOM stays readable', () => {
		const { container } = render(Grid, { props: { columns: { sm: 2, lg: 4 } } });
		expect(grid(container).getAttribute('data-columns')).toBe('responsive');
		expect(tracks(container).style.getPropertyValue('--grid-columns-xs')).toBe('1fr');
		expect(tracks(container).style.getPropertyValue('--grid-columns-sm')).toBe(
			'repeat(2, minmax(0, 1fr))'
		);
		expect(tracks(container).style.getPropertyValue('--grid-columns-xl')).toBe(
			'repeat(4, minmax(0, 1fr))'
		);
	});

	test('sizing stays on the root and implicit rows on the tracks', () => {
		const { container } = render(Grid, {
			props: { width: 400, maxWidth: '50rem', minHeight: 120, rowHeight: 64 }
		});
		expect((grid(container) as HTMLElement).style.width).toBe('400px');
		expect((grid(container) as HTMLElement).style.maxWidth).toBe('50rem');
		expect((grid(container) as HTMLElement).style.minHeight).toBe('120px');
		expect(tracks(container).style.gridAutoRows).toBe('64px');
	});

	test('class, style and attributes stay on the root the consumer addresses', () => {
		const { container } = render(Grid, {
			props: { class: 'custom-grid', style: 'outline:1px solid red', id: 'metrics' }
		});
		expect(grid(container)).toHaveClass('custom-grid');
		expect(grid(container)).toHaveAttribute('id', 'metrics');
		expect((grid(container) as HTMLElement).style.outline).toBe('1px solid red');
	});
});

describe('GridSpan markup', () => {
	test('an unset axis resolves to auto at every step', () => {
		const { container } = render(GridSpan, {});
		const span = container.querySelector('[data-slot="grid-span"]') as HTMLElement;
		expect(span.style.getPropertyValue('--grid-span-columns-xs')).toBe('auto');
		expect(span.style.getPropertyValue('--grid-span-rows-xl')).toBe('auto');
		expect(span).not.toHaveAttribute('data-columns');
	});

	test('a span keeps the consumer style beside its own properties', () => {
		const { container } = render(GridSpan, {
			props: { columns: 'full', rows: 2, style: 'opacity:0.5;' }
		});
		const span = container.querySelector('[data-slot="grid-span"]') as HTMLElement;
		expect(span.style.opacity).toBe('0.5');
		expect(span.style.getPropertyValue('--grid-span-columns-md')).toBe('1 / -1');
		expect(span.style.getPropertyValue('--grid-span-rows-md')).toBe('span 2');
		expect(span).toHaveAttribute('data-columns', 'full');
		expect(span).toHaveAttribute('data-rows', '2');
	});

	test('a responsive span reports itself as responsive in the DOM', () => {
		const { container } = render(GridSpan, { props: { columns: { xs: 'full', md: 2 } } });
		const span = container.querySelector('[data-slot="grid-span"]') as HTMLElement;
		expect(span).toHaveAttribute('data-columns', 'responsive');
		expect(span.style.getPropertyValue('--grid-span-columns-sm')).toBe('1 / -1');
		expect(span.style.getPropertyValue('--grid-span-columns-md')).toBe('span 2');
	});
});
