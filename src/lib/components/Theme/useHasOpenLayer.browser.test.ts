// Who Escape belongs to: an open layer, seen from a layer the app keeps itself, and a control inside
// one that takes keys of its own.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './EscapeLayerHarness.test.svelte';

const radio = () => document.querySelector<HTMLElement>('[role="radio"]');
const state = page.getByTestId('layer-open');

test('a SegmentedControl lets Escape reach the layer, and the app can tell it will', async () => {
	const seen: boolean[] = [];
	await render(Harness, { props: { onEscape: (open: boolean) => seen.push(open) } });
	await expect.element(state).toHaveTextContent('none');

	await userEvent.click(page.getByRole('button', { name: 'Open' }));
	await expect.element(state).toHaveTextContent('open');
	await expect.poll(radio).not.toBeNull();
	radio()!.focus();
	await expect.poll(() => document.activeElement).toBe(radio());

	await userEvent.keyboard('{Escape}');
	await expect.element(state).toHaveTextContent('none');
	await expect.poll(radio).toBeNull();

	await userEvent.keyboard('{Escape}');
	expect(seen).toEqual([true, false]);
});
