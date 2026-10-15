// Closed popovers build none of the open-only machinery (CX-10): no layer, focus scope or safe
// area until they open, all of it gone once they have closed, and the nested-layer chain intact.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import PopoverSessionHarness from './PopoverSessionHarness.test.svelte';
import { popoverInternals } from './popover.state.svelte.js';
import type { PopoverApi } from './popover.api.js';

type Scenario = 'many' | 'nested' | 'triggers' | 'slow';

const mount = (scenario: Scenario, props: { triggers?: number } = {}) => {
	const apis = new Map<string, PopoverApi>();
	const result = render(PopoverSessionHarness, {
		props: { scenario, ...props, onApi: (name, popover) => apis.set(name, popover) }
	});
	const state = (name: string) => popoverInternals(apis.get(name)!);
	return { ...result, apis, state };
};
const button = (name: string) => screen.getByRole('button', { name });

describe('closed popovers (CX-10)', () => {
	test('a closed popover registers no layer and has no safe area', () => {
		const { apis, state } = mount('many');
		expect([...apis.keys()]).toEqual(['First', 'Second', 'Third']);
		for (const name of apis.keys()) {
			expect(state(name).layer).toBeNull();
			expect(state(name).isTopLayer).toBe(false);
			expect(state(name).safeArea.containsPoint(0, 0)).toBe(false);
		}
	});

	test('opening builds the layer around the panel and the trigger; closing removes it', async () => {
		const { state } = mount('many');
		await fireEvent.click(button('Second'));
		await screen.findByRole('button', { name: 'Inside Second' });
		const layer = state('Second').layer;
		expect(layer).not.toBeNull();
		expect(layer!.isOpen).toBe(true);
		expect(layer!.nodes.has(button('Second'))).toBe(true);
		expect([...layer!.nodes].some((node) => node.contains(button('Inside Second')))).toBe(true);
		await waitFor(() => expect(state('Second').isTopLayer).toBe(true));
		// The others stay closed and keep nothing.
		expect(state('First').layer).toBeNull();
		expect(state('Third').layer).toBeNull();

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside Second' })).not.toBeInTheDocument()
		);
		await waitFor(() => expect(state('Second').layer).toBeNull());
		expect(state('Second').status).toBe('closed');
	});

	test('a press outside still closes it, and a press on its trigger does not count as outside', async () => {
		const { state } = mount('many');
		await fireEvent.click(button('First'));
		await screen.findByRole('button', { name: 'Inside First' });
		await waitFor(() => expect(state('First').status).toBe('open'));
		// The press on the trigger belongs to the layer: no outside-press close before its click.
		await fireEvent.pointerDown(button('First'));
		expect(state('First').isOpen).toBe(true);
		await fireEvent.pointerDown(button('Outside'));
		await waitFor(() => expect(state('First').isOpen).toBe(false));
	});

	test('a popover in an open panel registers its layer above the outer one', async () => {
		const { state } = mount('nested');
		await fireEvent.click(button('Outer'));
		await fireEvent.click(await screen.findByRole('button', { name: 'Inner' }));
		const inside = await screen.findByRole('button', { name: 'Inside inner' });
		const outer = state('outer').layer;
		const inner = state('inner').layer;
		expect(outer).not.toBeNull();
		expect(inner?.parent).toBe(outer);
		await waitFor(() => expect(state('inner').status).toBe('open'));
		// A press inside the nested panel is inside the outer popover too.
		await fireEvent.pointerDown(inside);
		expect(state('outer').isOpen).toBe(true);
		expect(state('inner').isOpen).toBe(true);
		await fireEvent.pointerDown(button('Outside'));
		await waitFor(() => expect(state('outer').isOpen).toBe(false));
		expect(state('inner').isOpen).toBe(false);
	});

	test('attaching another trigger to a closed popover leaves the other triggers untouched', async () => {
		const { rerender } = mount('triggers', { triggers: 2 });
		const first = button('Row 1');
		expect(first).toHaveAttribute('aria-expanded', 'false');
		const writes: string[] = [];
		const observer = new MutationObserver((records) =>
			records.forEach((record) => writes.push(record.attributeName ?? ''))
		);
		observer.observe(first, { attributes: true });
		await rerender({ triggers: 3 });
		flushSync();
		await Promise.resolve();
		observer.disconnect();
		expect(button('Row 3')).toHaveAttribute('aria-haspopup', 'dialog');
		expect(writes).toEqual([]);
	});

	test('the trigger that opened a shared popover is the one that reads as expanded', async () => {
		mount('triggers', { triggers: 3 });
		await fireEvent.click(button('Row 2'));
		await screen.findByText('Row panel');
		expect(button('Row 2')).toHaveAttribute('aria-expanded', 'true');
		expect(button('Row 1')).toHaveAttribute('aria-expanded', 'false');
		expect(button('Row 3')).toHaveAttribute('aria-expanded', 'false');
		expect(button('Row 1')).not.toHaveAttribute('aria-controls');
	});
});
