// Where nothing can be animated (no layout, no Web Animations), the number still follows its
// props: every change is drawn at once, and nothing of the previous number is left behind.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import AnimatedNumber from './AnimatedNumber.svelte';

const root = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[data-slot="animated-number"]')!;
const read = (container: HTMLElement) =>
	root(container).querySelector('[data-slot="animated-number-text"]')!.textContent;
const shown = (container: HTMLElement) =>
	root(container).querySelector('[data-slot="animated-number-visual"]')!.textContent;
const keys = (container: HTMLElement) =>
	[...root(container).querySelectorAll<HTMLElement>('[data-key]')].map((node) => node.dataset.key);

describe('AnimatedNumber without animations', () => {
	test('a change is drawn at once, in both what is read and what is seen', async () => {
		const { container, rerender } = render(AnimatedNumber, { props: { value: 987 } });
		expect(read(container)).toBe('987');
		expect(shown(container)).toBe('987');

		await rerender({ value: 12345 });
		expect(read(container)).toBe('12,345');
		expect(shown(container)).toBe('12,345');
		expect(keys(container)).toEqual([
			'integer:4',
			'integer:3',
			'group:0',
			'integer:2',
			'integer:1',
			'integer:0'
		]);

		await rerender({ value: 7 });
		expect(shown(container)).toBe('7');
		expect(keys(container)).toEqual(['integer:0']);
		expect(root(container).querySelector('[data-exiting]')).toBeNull();
	});

	test('the units stay the same element when the number gains a digit', async () => {
		const { container, rerender } = render(AnimatedNumber, { props: { value: 9 } });
		const units = root(container).querySelector('[data-key="integer:0"]');

		await rerender({ value: 10 });
		expect(root(container).querySelector('[data-key="integer:0"]')).toBe(units);
		expect((units as HTMLElement).style.getPropertyValue('--_current')).toBe('0');
		expect(root(container).querySelectorAll('[data-slot="animated-number-numeral"]')).toHaveLength(
			2
		);
	});

	test('format, locale, prefix and suffix redraw the number', async () => {
		const { container, rerender } = render(AnimatedNumber, {
			props: { value: 1234.5, locale: 'en-US' }
		});
		expect(shown(container)).toBe('1,234.5');

		await rerender({ format: { style: 'currency', currency: 'EUR' } });
		expect(shown(container)).toBe('€1,234.50');

		await rerender({ locale: 'de-DE' });
		expect(read(container)).toBe('1.234,50 €');

		await rerender({ format: undefined, prefix: '~', suffix: ' pts' });
		expect(read(container)).toBe('~1.234,5 pts');
		expect(root(container).querySelector('[data-part="prefix"]')).toHaveTextContent('~');
	});

	test('the variant changes how digits are drawn, not the number', async () => {
		const { container, rerender } = render(AnimatedNumber, { props: { value: 42 } });
		expect(root(container).querySelectorAll('[data-wheel]')).toHaveLength(2);

		await rerender({ variant: 'blur' });
		expect(root(container)).toHaveAttribute('data-variant', 'blur');
		expect(root(container).querySelectorAll('[data-wheel]')).toHaveLength(0);
		expect(root(container).querySelectorAll('[data-layer="current"]')).toHaveLength(2);
		expect(shown(container)).toBe('42');

		await rerender({ value: 43 });
		expect(shown(container)).toBe('43');
		expect(root(container).querySelector('[data-layer="outgoing"]')).toBeNull();
	});
});
