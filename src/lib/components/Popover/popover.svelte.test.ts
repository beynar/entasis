// Laws for `inline` popovers: the panel stays in normal document flow instead of portaling to
// the viewport-fixed layer, so docs and visual-stress pages can show an open panel statically.
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import PopoverInlineHarness from './PopoverInlineHarness.test.svelte';

describe('popover inline', () => {
	test('a11y:popover.inline-in-flow renders the panel inside the component parent, not portaled', async () => {
		render(PopoverInlineHarness, { props: { inline: true, open: true } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const host = screen.getByTestId('host');
		// The panel lives where the component sits…
		expect(host.contains(panel)).toBe(true);
		// …and nothing was portaled to the body.
		expect(document.body.querySelector(':scope > dialog')).toBeNull();
		expect([...document.querySelectorAll('dialog')].every((el) => host.contains(el))).toBe(true);
	});

	test('a11y:popover.inline-in-flow a floating popover still portals out of the parent', async () => {
		render(PopoverInlineHarness, { props: { inline: false, open: true } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const host = screen.getByTestId('host');
		await waitFor(() => expect(host.contains(panel)).toBe(false));
		expect(document.body.querySelector(':scope > dialog')).not.toBeNull();
	});
});

describe('popover positionPanel', () => {
	test('places the panel where the callback says, with the panel and the reference', async () => {
		const positionPanel = vi.fn(() => ({ x: 12, y: 34 }));
		render(PopoverInlineHarness, { props: { open: true, positionPanel } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const dialog = panel.closest('dialog')!;
		await waitFor(() => expect(dialog.style.left).toBe('12px'));
		expect(dialog.style.top).toBe('34px');
		expect(dialog.style.position).toBe('fixed');
		expect(positionPanel).toHaveBeenCalledWith({
			panel: dialog,
			reference: screen.getByRole('button', { name: 'Open popover' })
		});
	});

	test('null falls back to the floating-ui placement', async () => {
		const positionPanel = vi.fn(() => null);
		render(PopoverInlineHarness, { props: { open: true, positionPanel } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const dialog = panel.closest('dialog')!;
		await waitFor(() => expect(dialog.style.visibility).toBe(''));
		expect(positionPanel).toHaveBeenCalled();
		expect(dialog.style.left).not.toBe('12px');
	});
});
