import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import AccordionHarness from './AccordionHarness.test.svelte';

const noMotion = { in: { duration: 0 }, out: { duration: 0 } };
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const trigger = (name: string) => screen.getByRole('button', { name });
const panelOf = (name: string) =>
	document.getElementById(trigger(name).getAttribute('aria-controls') ?? 'none');

// What the browser dispatches on a `hidden="until-found"` element when find-in-page matches inside.
const findInPage = (text: string) =>
	fireEvent(
		screen.getByText(text).closest('[hidden]')!,
		new Event('beforematch', { bubbles: true })
	);

describe('Accordion structure', () => {
	test('each trigger button sits inside a heading of the requested level', () => {
		render(AccordionHarness, { headingLevel: 4 });
		const heading = screen.getAllByRole('heading', { level: 4 })[0];
		expect(heading.tagName).toBe('H4');
		expect(within(heading).getByRole('button', { name: 'First' })).toBe(trigger('First'));
		// The heading wraps the button; it is not a child of it.
		expect(trigger('First').querySelector('[role="heading"], h2, h3, h4, h5, h6')).toBeNull();
		expect(screen.getAllByRole('heading')).toHaveLength(3);
	});

	test('the default heading level is 3', () => {
		render(AccordionHarness);
		expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
	});

	test('an open item links its trigger to a region labelled by that trigger', async () => {
		render(AccordionHarness, { defaultValue: ['two'] });
		const button = trigger('Second');
		const region = panelOf('Second')!;
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(region).toHaveAttribute('role', 'region');
		expect(region).toHaveAttribute('aria-labelledby', button.id);
		expect(screen.getByRole('region', { name: 'Second' })).toBe(region);
		expect(region).toHaveTextContent('Second body');
		expect(button).toHaveAttribute('data-index', '1');
	});

	test('a collapsed item has no panel, so its content is not read, tabbed to or found', () => {
		render(AccordionHarness, { defaultValue: ['two'] });
		expect(screen.queryByText('First body')).toBeNull();
		expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
		expect(trigger('First')).not.toHaveAttribute('aria-controls');
		expect(document.querySelector('.sr-only')).toBeNull();
		expect(screen.getAllByRole('region')).toHaveLength(1);
	});

	test('toggles with the click and reports the whole expanded set', async () => {
		const onValueChange = vi.fn();
		render(AccordionHarness, { onValueChange, transition: noMotion });
		await fireEvent.click(trigger('First'));
		expect(onValueChange).toHaveBeenLastCalledWith(['one']);
		await fireEvent.click(trigger('Second'));
		expect(onValueChange).toHaveBeenLastCalledWith(['two']);
		await fireEvent.click(trigger('Second'));
		expect(onValueChange).toHaveBeenLastCalledWith([]);
		expect(onValueChange).toHaveBeenCalledTimes(3);
	});

	test('several items can stay open without oneAtATime', async () => {
		render(AccordionHarness, { oneAtATime: false, transition: noMotion });
		await fireEvent.click(trigger('First'));
		await fireEvent.click(trigger('Second'));
		expect(trigger('First')).toHaveAttribute('aria-expanded', 'true');
		expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('Accordion disabled', () => {
	test('an item with disabled: true has a natively disabled trigger that cannot toggle', async () => {
		const onValueChange = vi.fn();
		render(AccordionHarness, {
			onValueChange,
			items: [
				{ id: 'a', title: 'Open one', content: 'A' },
				{ id: 'b', title: 'Locked', content: 'B', disabled: true }
			]
		});
		const locked = trigger('Locked');
		expect(locked).toBeDisabled();
		expect(locked).toHaveAttribute('data-disabled', '');
		expect(trigger('Open one')).toBeEnabled();
		await fireEvent.click(locked);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(locked).toHaveAttribute('aria-expanded', 'false');
	});

	test('disabledKey reads another boolean property', () => {
		render(AccordionHarness, {
			disabledKey: 'locked',
			items: [
				{ id: 'a', title: 'Free', content: 'A', locked: false },
				{ id: 'b', title: 'Locked', content: 'B', locked: true }
			]
		});
		expect(trigger('Locked')).toBeDisabled();
		expect(trigger('Free')).toBeEnabled();
	});

	test('the root disabled prop disables every trigger', () => {
		render(AccordionHarness, { disabled: true });
		for (const name of ['First', 'Second', 'Third']) expect(trigger(name)).toBeDisabled();
	});
});

describe('Accordion keyboard', () => {
	test('arrow keys, Home and End are left to the page: nothing is prevented or moved', async () => {
		render(AccordionHarness);
		trigger('First').focus();
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			const notPrevented = await fireEvent.keyDown(trigger('First'), { key });
			expect(notPrevented).toBe(true);
			expect(trigger('First')).toHaveFocus();
		}
	});

	test('a nested accordion is not reached by arrow keys from the outer one', async () => {
		render(AccordionHarness, { nested: true, defaultValue: ['outer'] });
		trigger('Outer').focus();
		await fireEvent.keyDown(trigger('Outer'), { key: 'ArrowDown' });
		expect(trigger('Outer')).toHaveFocus();
		expect(trigger('Inner A')).not.toHaveFocus();
	});
});

describe('Accordion onItemOpenChange', () => {
	test('runs before the change with the item, its index, the press reason and the event', async () => {
		let expandedInside: string | null = null;
		const onItemOpenChange = vi.fn(() => {
			expandedInside = trigger('Second').getAttribute('aria-expanded');
		});
		render(AccordionHarness, { onItemOpenChange });
		await fireEvent.click(trigger('Second'));
		expect(expandedInside).toBe('false');
		expect(onItemOpenChange).toHaveBeenCalledExactlyOnceWith({
			item: expect.objectContaining({ id: 'two' }),
			index: 1,
			open: true,
			details: expect.objectContaining({
				reason: 'trigger-press',
				trigger: trigger('Second'),
				event: expect.any(MouseEvent)
			})
		});
		expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');
	});

	test('details.cancel() keeps the item closed and skips onValueChange', async () => {
		const onValueChange = vi.fn();
		const onItemOpenChange = vi.fn(({ details }: { details: { cancel(): void } }) =>
			details.cancel()
		);
		render(AccordionHarness, { onItemOpenChange, onValueChange });
		await fireEvent.click(trigger('First'));
		expect(onItemOpenChange).toHaveBeenCalledOnce();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(trigger('First')).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Accordion hiddenUntilFound and keepMounted', () => {
	test('collapsed panels stay in the DOM under hidden="until-found", out of the a11y tree', () => {
		render(AccordionHarness, { hiddenUntilFound: true });
		const region = screen.getByText('First body').closest('[hidden]');
		expect(region).toHaveAttribute('hidden', 'until-found');
		expect(trigger('First').getAttribute('aria-controls')).toBe(region!.id);
		expect(screen.queryAllByRole('region')).toHaveLength(0);
	});

	test('find-in-page opens the item at once, closes the other in single mode and reports it', async () => {
		const onItemOpenChange = vi.fn();
		const onValueChange = vi.fn();
		const onItemAfterOpen = vi.fn();
		render(AccordionHarness, {
			hiddenUntilFound: true,
			defaultValue: ['one'],
			onItemOpenChange,
			onValueChange,
			onItemAfterOpen,
			transition: noMotion
		});
		await findInPage('Second body');

		expect(onItemOpenChange).toHaveBeenCalledOnce();
		expect(onItemOpenChange).toHaveBeenCalledWith(
			expect.objectContaining({
				index: 1,
				open: true,
				details: expect.objectContaining({ reason: 'find-in-page' })
			})
		);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['two']);
		expect(trigger('Second')).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('region', { name: 'Second' })).toBeVisible();
		await waitFor(() =>
			expect(onItemAfterOpen).toHaveBeenCalledExactlyOnceWith({
				item: expect.objectContaining({ id: 'two' }),
				index: 1
			})
		);
	});

	test('cancelling a find-in-page open puts the panel back under hidden="until-found"', async () => {
		const onItemOpenChange = vi.fn(({ details }: { details: { cancel(): void } }) =>
			details.cancel()
		);
		render(AccordionHarness, { hiddenUntilFound: true, onItemOpenChange });
		await findInPage('Third body');
		await waitFor(() =>
			expect(screen.getByText('Third body').closest('[hidden]')).toHaveAttribute(
				'hidden',
				'until-found'
			)
		);
		expect(trigger('Third')).toHaveAttribute('aria-expanded', 'false');
	});

	test('a disabled item is not findable and find-in-page never opens it', async () => {
		const onItemOpenChange = vi.fn();
		render(AccordionHarness, {
			hiddenUntilFound: true,
			onItemOpenChange,
			items: [
				{ id: 'a', title: 'Free', content: 'Free text' },
				{ id: 'b', title: 'Locked', content: 'Locked text', disabled: true }
			]
		});
		// The enabled panel waits for find-in-page; the disabled one is under plain hidden.
		expect(screen.getByText('Free text').closest('[hidden]')).toHaveAttribute(
			'hidden',
			'until-found'
		);
		const locked = screen.getByText('Locked text').closest('[hidden]')!;
		expect(locked).toHaveAttribute('hidden', '');
		// Even a stray `beforematch` leaves it closed.
		await fireEvent(locked, new Event('beforematch', { bubbles: true }));
		await settle();
		expect(onItemOpenChange).not.toHaveBeenCalled();
		expect(trigger('Locked')).toHaveAttribute('aria-expanded', 'false');
		expect(screen.getByText('Locked text').closest('[hidden]')).toHaveAttribute('hidden', '');
	});

	test('keepMounted keeps collapsed panels hidden but mounted', async () => {
		render(AccordionHarness, { keepMounted: true, transition: noMotion });
		const region = screen.getByText('First body').closest('[hidden]');
		expect(region).toHaveAttribute('hidden', '');
		expect(screen.queryAllByRole('region')).toHaveLength(0);
		await fireEvent.click(trigger('First'));
		expect(screen.getByRole('region', { name: 'First' })).toHaveTextContent('First body');
	});
});

describe('Accordion onItemAfterOpen and onItemAfterClose', () => {
	test('fire once per change with the item and index when no animation plays', async () => {
		const onItemAfterOpen = vi.fn();
		const onItemAfterClose = vi.fn();
		render(AccordionHarness, { onItemAfterOpen, onItemAfterClose, transition: noMotion });
		await fireEvent.click(trigger('First'));
		expect(onItemAfterOpen).toHaveBeenCalledExactlyOnceWith({
			item: expect.objectContaining({ id: 'one' }),
			index: 0
		});
		await fireEvent.click(trigger('Second'));
		await settle();
		expect(onItemAfterClose).toHaveBeenCalledExactlyOnceWith({
			item: expect.objectContaining({ id: 'one' }),
			index: 0
		});
		expect(onItemAfterOpen).toHaveBeenCalledTimes(2);
	});

	test('fire after the animation, once, and not for items open at the start', async () => {
		const onItemAfterOpen = vi.fn();
		const onItemAfterClose = vi.fn();
		render(AccordionHarness, { onItemAfterOpen, onItemAfterClose, defaultValue: ['one'] });
		await settle();
		expect(onItemAfterOpen).not.toHaveBeenCalled();
		await fireEvent.click(trigger('First'));
		await waitFor(() => expect(onItemAfterClose).toHaveBeenCalledOnce());
		await settle();
		expect(onItemAfterClose).toHaveBeenCalledOnce();
		expect(onItemAfterOpen).not.toHaveBeenCalled();
	});
});
