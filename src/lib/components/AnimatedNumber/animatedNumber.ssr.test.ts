import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import AnimatedNumber from './AnimatedNumber.svelte';

const count = (body: string, needle: string) => body.split(needle).length - 1;

describe('AnimatedNumber server rendering', () => {
	test('renders the plain number to read, and its characters hidden from assistive technology', () => {
		const { body } = render(AnimatedNumber, { props: { value: 1284 } });

		expect(body).toMatch(/<span[^>]*data-slot="animated-number"/);
		expect(body).toContain('data-variant="flow"');
		expect(body).toContain('dir="ltr"');
		expect(body).toMatch(/<span[^>]*data-slot="animated-number-text"[^>]*>1,284<\/span>/);
		expect(body).toMatch(/<span[^>]*data-slot="animated-number-visual"[^>]*aria-hidden="true"/);
		expect(body).not.toMatch(/data-slot="animated-number-text"[^>]*aria-hidden/);
	});

	test('a wheel at rest carries the one digit it shows', () => {
		const { body } = render(AnimatedNumber, { props: { value: 1284 } });

		expect(count(body, 'data-slot="animated-number-digit"')).toBe(4);
		expect(count(body, 'data-slot="animated-number-numeral"')).toBe(4);
		expect(count(body, 'data-slot="animated-number-symbol"')).toBe(1);
		expect(body).toMatch(
			/data-key="integer:0"[^>]*data-part="integer"[^>]*style="--_current: ?4;?"/
		);
		expect(body).toMatch(/data-key="group:0"[^>]*data-part="group"/);
	});

	test('the four runs of the number are there, in order, even when empty', () => {
		const { body } = render(AnimatedNumber, {
			props: { value: 49.5, format: { style: 'currency', currency: 'USD' } }
		});

		const runs = [...body.matchAll(/data-section="(\w+)"/g)].map((match) => match[1]);
		expect(runs).toEqual(['pre', 'integer', 'fraction', 'post']);
		expect(body).toMatch(/data-slot="animated-number-text"[^>]*>\$49\.50</);
		expect(body).toMatch(/data-key="currency:0"[^>]*data-part="currency"/);
		expect(body).toMatch(/data-key="decimal:0"[^>]*data-part="decimal"/);
	});

	test('the blur variant renders each digit as a layer', () => {
		const { body } = render(AnimatedNumber, { props: { value: 42, variant: 'blur', blur: 12 } });

		expect(body).toContain('data-variant="blur"');
		expect(body).not.toContain('animated-number-numeral');
		expect(count(body, 'data-layer="current"')).toBe(2);
		expect(body).not.toContain('data-layer="outgoing"');
		expect(body).toMatch(/--animated-number-blur: ?12px/);
	});

	test('prefix and suffix are read with the number', () => {
		const { body } = render(AnimatedNumber, {
			props: { value: 18200, format: { notation: 'compact' }, prefix: '~', suffix: ' followers' }
		});

		expect(body).toMatch(/data-slot="animated-number-text"[^>]*>~18K followers</);
		expect(body).toMatch(/data-key="prefix:0"/);
		expect(body).toMatch(/data-key="suffix:0"/);
	});

	test('a locale written from right to left lays its symbols out that way', () => {
		const { body } = render(AnimatedNumber, {
			props: { value: 0.25, locale: 'ar-EG', format: { style: 'percent' } }
		});

		expect(body).toContain('dir="rtl"');
		expect(body).toMatch(/data-section="pre"[^>]*data-anchor="left"/);
		expect(body).toMatch(/data-section="post"[^>]*data-anchor="right"/);
		expect(body).toMatch(/data-section="integer"[^>]*data-anchor="right"/);
		expect(body).toContain('٢');
	});

	test('class, theme and other attributes reach the root and its parts', () => {
		const { body } = render(AnimatedNumber, {
			props: {
				value: 3.5,
				class: 'text-4xl',
				id: 'total',
				theme: { fraction: { base: 'text-2xl' } }
			}
		});

		expect(body).toMatch(/<span[^>]*data-slot="animated-number"[^>]*class="[^"]*text-4xl/);
		expect(body).toMatch(/<span[^>]*id="total"/);
		expect(body).toMatch(/data-section="fraction"[^>]*class="[^"]*text-2xl/);
	});
});
