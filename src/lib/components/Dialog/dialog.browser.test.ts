// Non-modal dialogs and drawer snap points with real layout, hit testing and focus (Chromium and
// WebKit).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DialogBrowserHarness from './dialogBrowserHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('non-modal dialog (DLG-3)', () => {
	test('the page behind stays clickable and focusable while the dialog is open', async () => {
		render(DialogBrowserHarness, { props: { scenario: 'non-modal' } });
		await userEvent.click(page.getByRole('button', { name: 'Open inspector' }));
		await expect.element(page.getByRole('dialog', { name: 'Inspector' })).toBeVisible();

		// A real click goes through the viewport-sized root to the page.
		await userEvent.click(page.getByRole('button', { name: /Page button/ }));
		await expect.element(page.getByRole('button', { name: 'Page button 1' })).toBeVisible();
		expect(document.documentElement.hasAttribute('data-entasis-scroll-lock')).toBe(false);
		expect(document.querySelector('[inert]')).toBeNull();

		// And the panel still takes its own clicks without closing.
		await userEvent.click(page.getByRole('button', { name: 'Inside button' }));
		await expect.element(page.getByRole('dialog', { name: 'Inspector' })).toBeVisible();
	});

	test('Escape closes it and focus returns to the trigger', async () => {
		render(DialogBrowserHarness, { props: { scenario: 'non-modal' } });
		const trigger = page.getByRole('button', { name: 'Open inspector' });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('dialog', { name: 'Inspector' })).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
		await expect.poll(() => document.activeElement).toBe(trigger.element());
	});
});

describe('drawer snap points (DLG-5)', () => {
	const pointer = (target: Element, type: string, y: number) =>
		target.dispatchEvent(
			new PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				pointerId: 21,
				pointerType: 'touch',
				button: 0,
				buttons: type === 'pointerup' ? 0 : 1,
				clientX: 200,
				clientY: y
			})
		);

	const layout = () => {
		const root = document.querySelector('[role="dialog"]') as HTMLElement;
		const positioner = root.firstElementChild as HTMLElement;
		const panel = positioner.firstElementChild as HTMLElement;
		const style = getComputedStyle(positioner);
		const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		return {
			panel,
			available: positioner.clientHeight - padding,
			floor: positioner.getBoundingClientRect().bottom - parseFloat(style.paddingBottom)
		};
	};

	test('the panel is as tall as the largest point and rests with only the default point showing', async () => {
		render(DialogBrowserHarness, { props: { scenario: 'snap' } });
		await userEvent.click(page.getByRole('button', { name: 'Open sheet' }));
		await expect.element(page.getByRole('dialog', { name: 'Sheet' })).toBeVisible();
		await expect.poll(() => layout().panel.style.transform).not.toBe('');

		await expect
			.poll(() => {
				const { panel, available, floor } = layout();
				const rect = panel.getBoundingClientRect();
				return [Math.round(rect.height), Math.round(floor - rect.top), Math.round(available * 0.4)];
			})
			.toSatisfy(([height, visible, expected]: number[]) => {
				const { available } = layout();
				return height === Math.round(available) && Math.abs(visible - expected) <= 1;
			});
		// Only the largest point scrolls its body.
		expect(layout().panel.style.overflowY).toBe('hidden');
	});

	test('dragging the sheet up rests it at the largest point and reports it through snapPoint', async () => {
		render(DialogBrowserHarness, { props: { scenario: 'snap' } });
		await userEvent.click(page.getByRole('button', { name: 'Open sheet' }));
		await expect.element(page.getByRole('dialog', { name: 'Sheet' })).toBeVisible();
		await expect.poll(() => layout().panel.style.transform).not.toBe('');
		const { panel, available } = layout();
		const body = page.getByTestId('sheet-body').element();
		void panel;

		// A slow finger drag up by most of the hidden part.
		const startY = 600;
		pointer(body, 'pointerdown', startY);
		for (let step = 1; step <= 8; step += 1) {
			await sleep(40);
			pointer(body, 'pointermove', startY - step * ((available * 0.6) / 8));
		}
		await sleep(250);
		pointer(body, 'pointerup', startY - available * 0.6);

		await expect.element(page.getByTestId('snap')).toHaveTextContent('1');
		await expect.poll(() => layout().panel.style.transform).toBe('');
		await expect.poll(() => layout().panel.style.overflowY).toBe('');
		await expect
			.poll(() => Math.round(layout().panel.getBoundingClientRect().height))
			.toBe(Math.round(available));
	});
});
