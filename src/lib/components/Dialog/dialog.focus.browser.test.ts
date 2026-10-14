// Focus return in real engines: the page behind a modal is `inert`, which refuses focus, so the
// trigger only takes it back once the dialog has released the page.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DialogTriggerHarness from './DialogTriggerHarness.test.svelte';

test.each(['Escape', 'close button'] as const)(
	'an animated close with %s puts focus back on the trigger',
	async (how) => {
		await render(DialogTriggerHarness, { scenario: 'animated-trigger' });
		const opener = page.getByTestId('opener');
		(opener.element() as HTMLElement).focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('dialog', { name: 'Animated card' })).toBeVisible();
		await expect.poll(() => !!opener.element().closest('[inert]')).toBe(true);

		if (how === 'Escape') await userEvent.keyboard('{Escape}');
		else await userEvent.click(page.getByRole('dialog').getByRole('button').first());
		await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
		await expect.poll(() => document.activeElement).toBe(opener.element());
		expect(opener.element().closest('[inert]')).toBeNull();
	}
);
