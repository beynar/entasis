// The `framed` treatment is the shell's own card: the root paints the canvas, one frame element
// draws the rounded, bordered, raised surface, and the sidebar and page live inside it.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import AppShellFramedHarness from './AppShellFramedHarness.test.svelte';

const root = () => {
	const node = document.querySelector('[data-slot="app-shell"]');
	if (!(node instanceof HTMLElement)) throw new Error('app shell not rendered');
	return node;
};
const frame = () => {
	const node = document.querySelector('[data-slot="app-shell-frame"]');
	if (!(node instanceof HTMLElement)) throw new Error('app shell frame not rendered');
	return node;
};

describe('app shell framed variant', () => {
	test('draws one rounded raised card on the canvas around the sidebar and the page', () => {
		render(AppShellFramedHarness);

		expect(root()).toHaveAttribute('data-sidebar-variant', 'framed');
		expect(root().className).toContain('bg-surface-canvas');
		// The border and the elevation both come from the elevation engine, never a raw shadow.
		expect(frame().className).toContain('rounded-xl');
		expect(frame().className).toContain('raised-1');
		expect(frame().className).toContain('bg-surface');
		expect(frame().className).not.toContain('shadow-');
		// The sidebar is told it lives inside the card, so its well is the recessed surface.
		const sidebar = frame().querySelector('[data-slot="sidebar-wrapper"]');
		expect(sidebar).not.toBeNull();
		expect(sidebar).toHaveAttribute('data-variant', 'framed');
		expect(sidebar?.querySelector('[data-slot="sidebar-panel"]')?.className).toContain(
			'bg-surface-recessed'
		);
	});

	test('every other variant leaves the frame element transparent to layout', () => {
		render(AppShellFramedHarness, { props: { variant: 'inset' } });

		expect(frame().className).toBe('contents');
		expect(root().className).not.toContain('bg-surface-canvas');
	});
});
