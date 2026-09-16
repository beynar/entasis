import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Stack from './Stack.svelte';
import { breakpoints } from '../Theme/responsive.js';

/** The `--stack-<axis>-<breakpoint>` declarations of a server-rendered stack, in ladder order. */
const variables = (body: string, axis: string) =>
	breakpoints.map((breakpoint) => {
		const match = body.match(new RegExp(`--stack-${axis}-${breakpoint}:\\s*([^;"]+)`));
		return match?.[1]?.trim();
	});

describe('Stack SSR', () => {
	test('renders the container root around the flex line', () => {
		const body = render(Stack, { props: {} }).body;

		expect(body).toContain('data-slot="stack"');
		expect(body).toContain('data-slot="stack-layout"');
		// The root is the container; the chains that query it live on the element inside it.
		expect(body).toMatch(/data-slot="stack"[^>]*@container\/stack/);
		expect(body).toMatch(/data-slot="stack-layout"[^>]*flex-direction:var\(--stack-direction-xs\)/);
	});

	test('a plain value carries every breakpoint, so the box lays out at any width', () => {
		const body = render(Stack, { props: { orientation: 'horizontal', gap: 'md' } }).body;

		expect(variables(body, 'direction')).toEqual(['row', 'row', 'row', 'row', 'row']);
		expect(variables(body, 'gap')).toEqual(Array(5).fill('var(--space-md)'));
	});

	test('the documented defaults are what an unset prop writes', () => {
		const body = render(Stack, { props: {} }).body;

		expect(variables(body, 'direction')).toEqual(Array(5).fill('column'));
		expect(variables(body, 'gap')).toEqual(Array(5).fill('0px'));
		expect(variables(body, 'align')).toEqual(Array(5).fill('stretch'));
		expect(variables(body, 'justify')).toEqual(Array(5).fill('flex-start'));
		expect(variables(body, 'wrap')).toEqual(Array(5).fill('nowrap'));
	});

	test('a record flips at its own step and holds above it', () => {
		const body = render(Stack, {
			props: { orientation: { md: 'horizontal' }, gap: { sm: 'sm', lg: 'xl' } }
		}).body;

		// Below `md` the documented default applies; from `md` up the record does.
		expect(variables(body, 'direction')).toEqual(['column', 'column', 'row', 'row', 'row']);
		// The nearest DEFINED key at or below each step wins: `sm` holds through `md`.
		expect(variables(body, 'gap')).toEqual([
			'0px',
			'var(--space-sm)',
			'var(--space-sm)',
			'var(--space-xl)',
			'var(--space-xl)'
		]);
	});

	test('the record form is flattened once per breakpoint', () => {
		const body = render(Stack, {
			props: { justify: { xs: 'center', sm: 'between' } }
		}).body;

		expect(variables(body, 'justify')).toEqual([
			'center',
			'space-between',
			'space-between',
			'space-between',
			'space-between'
		]);
	});

	test('every CSS value is a real one, never the enum name', () => {
		const body = render(Stack, {
			props: { orientation: 'vertical', align: 'end', justify: 'evenly', wrap: 'wrap-reverse' }
		}).body;

		expect(variables(body, 'direction')).toEqual(Array(5).fill('column'));
		expect(variables(body, 'align')).toEqual(Array(5).fill('flex-end'));
		expect(variables(body, 'justify')).toEqual(Array(5).fill('space-evenly'));
		expect(variables(body, 'wrap')).toEqual(Array(5).fill('wrap-reverse'));
	});

	test('the box props stay on the root the host sizes', () => {
		const body = render(Stack, {
			props: { as: 'section', width: 280, maxWidth: '40rem', padding: 'lg', scrollable: true }
		}).body;

		expect(body).toContain('<section data-slot="stack"');
		expect(body).toContain('width: 280px');
		expect(body).toContain('max-width: 40rem');
		expect(body).toMatch(/data-slot="stack"[^>]*px-lg/);
		expect(body).toMatch(/data-slot="stack"[^>]*py-lg/);
		expect(body).toMatch(/data-slot="stack"[^>]*overflow-auto/);
	});
});
