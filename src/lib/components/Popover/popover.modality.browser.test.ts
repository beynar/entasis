// `data-modality` on the panel follows the last input that drove the popup, keyboard in the
// anchoring input included, without re-rendering the panel (Chromium and WebKit).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PopoverModalityHarness from './PopoverModalityHarness.test.svelte';

const panel = () => document.querySelector('[role="listbox"]')?.parentElement ?? null;

describe('data-modality', () => {
	test('keys in the anchoring input mark the panel keyboard, a pointer move over it pointer', async () => {
		let pointer = { screenX: 0, screenY: 0 };
		const remember = (event: PointerEvent) =>
			(pointer = { screenX: event.screenX, screenY: event.screenY });
		document.addEventListener('pointermove', remember, true);
		render(PopoverModalityHarness);
		const input = page.getByRole('combobox', { name: 'Fruit' });
		await userEvent.click(input);
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(() => panel()?.getAttribute('data-modality')).toBe('keyboard');
		const node = panel()!;
		const options = [...node.querySelectorAll('[role="option"]')];

		await userEvent.hover(page.getByRole('option', { name: 'Pear' }));
		await expect.poll(() => node.getAttribute('data-modality')).toBe('pointer');

		// Typing again hands it back to the keyboard; the panel and its rows are the same nodes.
		await userEvent.keyboard('a');
		await expect.poll(() => node.getAttribute('data-modality')).toBe('keyboard');
		expect(panel()).toBe(node);
		expect([...node.querySelectorAll('[role="option"]')]).toEqual(options);

		// A move reported where the pointer already rests (content scrolled under it) is not one.
		options[0].dispatchEvent(new PointerEvent('pointermove', { ...pointer, bubbles: true }));
		expect(node.getAttribute('data-modality')).toBe('keyboard');

		// A modifier on its own does not count as keyboard use.
		await userEvent.hover(page.getByRole('option', { name: 'Apple' }));
		await expect.poll(() => node.getAttribute('data-modality')).toBe('pointer');
		await userEvent.keyboard('{Shift}');
		expect(node.getAttribute('data-modality')).toBe('pointer');
		document.removeEventListener('pointermove', remember, true);
	});
});
