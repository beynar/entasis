// Slot renders text or a snippet, bare or inside a wrapper when it has a class, and falls back to
// its children. One condition chain decides, so every case is listed here.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from './SlotHarness.test.svelte';

const host = () => screen.getByTestId('host');
const wrapper = () => host().querySelector('[data-wrapper]');
// The harness leaves white space around the slot, so an empty host has no element and no text.
const expectNothing = () => {
	expect(host().children).toHaveLength(0);
	expect(host().textContent?.trim()).toBe('');
};

describe('Slot', () => {
	test('renders nothing without content', () => {
		render(Harness, { props: { mode: 'none', class: 'wrapped' } });
		expectNothing();
	});

	test('renders text bare without a class', () => {
		render(Harness, { props: { mode: 'text' } });
		expect(host()).toHaveTextContent('Text');
		expect(host().children).toHaveLength(0);
	});

	test('wraps text in the element when it has a class', () => {
		render(Harness, { props: { mode: 'text', class: 'wrapped' } });
		expect(wrapper()?.tagName).toBe('SPAN');
		expect(wrapper()).toHaveClass('wrapped');
		expect(wrapper()).toHaveTextContent('Text');
	});

	test('renders a snippet with its payload, bare or wrapped', async () => {
		const view = render(Harness, { props: { mode: 'snippet' } });
		expect(screen.getByTestId('snippet')).toHaveTextContent('payload');
		expect(wrapper()).toBeNull();
		await view.rerender({ class: 'wrapped' });
		expect(wrapper()).toContainElement(screen.getByTestId('snippet'));
	});

	test('follows content that changes kind', async () => {
		const view = render(Harness, { props: { mode: 'text' } });
		await view.rerender({ mode: 'snippet' });
		expect(screen.getByTestId('snippet')).toBeInTheDocument();
		await view.rerender({ mode: 'none' });
		expectNothing();
	});

	test('falls back to its children without content, an empty text included', async () => {
		const view = render(Harness, { props: { mode: 'none', fallback: true } });
		expect(screen.getByTestId('fallback')).toBeInTheDocument();
		expect(wrapper()).toBeNull();
		await view.rerender({ mode: 'empty', class: 'wrapped' });
		expect(wrapper()).toContainElement(screen.getByTestId('fallback'));
		await view.rerender({ mode: 'text' });
		expect(screen.queryByTestId('fallback')).toBeNull();
		expect(wrapper()).toHaveTextContent('Text');
	});

	test('renderIf false drops the fallback, never the content', async () => {
		const view = render(Harness, { props: { mode: 'none', fallback: true, renderIf: false } });
		expectNothing();
		await view.rerender({ mode: 'text' });
		expect(host()).toHaveTextContent('Text');
	});
});
