import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Card from './Card/Card.svelte';
import DisabledAnchorHarness from './DisabledAnchorHarness.test.svelte';
import LinkPreview from './LinkPreview/linkPreviewHarness.test.svelte';
import MenuOption from './MenuOption/MenuOption.svelte';
import Tabbar from './Tabbar/Tabbar.svelte';

function expectDisabledAnchor(anchor: HTMLAnchorElement) {
	expect(anchor).not.toHaveAttribute('href');
	expect(anchor).toHaveAttribute('aria-disabled', 'true');
	expect(anchor).toHaveAttribute('tabindex', '-1');

	const click = new MouseEvent('click', { bubbles: true, cancelable: true });
	expect(anchor.dispatchEvent(click)).toBe(false);
	anchor.click();
}

function getAnchor(name: string) {
	const anchor = screen.getByRole('link', { name });
	if (!(anchor instanceof HTMLAnchorElement)) throw new Error(`Expected ${name} to be an anchor.`);
	return anchor;
}

describe('shared disabled anchor owners', () => {
	test('blocks disabled Card anchors', () => {
		render(Card, {
			props: { children: 'Card destination', href: '#card', disabled: true }
		});

		const anchor = screen.getByRole('link', { name: 'Card destination' });
		expectDisabledAnchor(anchor as HTMLAnchorElement);
	});

	test('blocks disabled MenuOption anchors', () => {
		const onclick = vi.fn();
		render(MenuOption, {
			props: {
				children: 'Menu destination',
				href: '#menu',
				disabled: true,
				attrs: { href: '#attrs-destination', tabindex: 0, onclick }
			}
		});

		const anchor = screen.getByRole('link', { name: 'Menu destination' });
		expectDisabledAnchor(anchor as HTMLAnchorElement);
		expect(onclick).not.toHaveBeenCalled();
	});

	test('does not activate disabled submenu triggers on hover', async () => {
		render(DisabledAnchorHarness, { props: { scenario: 'menu' } });
		const trigger = screen.getByRole('menuitem', { name: 'Disabled submenu' });
		await fireEvent.mouseEnter(trigger);
		await fireEvent.pointerEnter(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('menuitem', { name: 'Nested action' })).not.toBeInTheDocument();
	});

	test('blocks disabled LinkPreview anchors', () => {
		render(LinkPreview, {
			props: { children: 'Preview destination', href: '#preview', disabled: true }
		});

		const anchor = screen.getByText('Preview destination').closest('a');
		if (!(anchor instanceof HTMLAnchorElement)) {
			throw new Error('Expected LinkPreview to render an anchor.');
		}
		expectDisabledAnchor(anchor);
	});

	test('blocks disabled Breadcrumbs links and restores native events when enabled', async () => {
		const onclick = vi.fn();
		const { rerender } = render(DisabledAnchorHarness, {
			props: { scenario: 'breadcrumbs', disabled: true, onclick }
		});

		const anchor = getAnchor('Breadcrumb destination');
		expectDisabledAnchor(anchor);
		await fireEvent.keyDown(anchor, { key: 'Enter' });
		expect(onclick).not.toHaveBeenCalled();

		await rerender({ scenario: 'breadcrumbs', disabled: false, onclick });
		expect(anchor).toHaveAttribute('href', '#breadcrumb');
		expect(anchor).not.toHaveAttribute('aria-disabled', 'true');
		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		anchor.dispatchEvent(click);
		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toBe(click);
	});

	test('preserves disabled Breadcrumbs entries in the overflow menu', async () => {
		const onclick = vi.fn();
		render(DisabledAnchorHarness, {
			props: { scenario: 'breadcrumbs-overflow', onclick }
		});
		await fireEvent.click(screen.getByRole('button'));
		const anchor = await screen.findByRole('menuitem', { name: 'Breadcrumb destination' });
		if (!(anchor instanceof HTMLAnchorElement)) throw new Error('Expected an overflow anchor.');
		expectDisabledAnchor(anchor);
		expect(onclick).not.toHaveBeenCalled();
	});

	test('blocks disabled Sidebar links at both menu depths', () => {
		const onclick = vi.fn();
		render(DisabledAnchorHarness, { props: { scenario: 'sidebar', onclick } });
		expectDisabledAnchor(getAnchor('Sidebar destination'));
		expectDisabledAnchor(getAnchor('Nested destination'));
		expect(onclick).not.toHaveBeenCalled();
	});

	test('keeps a disabled selected Tabbar anchor out of the tab order', async () => {
		const onValueChange = vi.fn();
		render(Tabbar, {
			props: {
				items: [{ label: 'Tab destination', href: '#tab', disabled: true }, 'Enabled'],
				defaultValue: 0,
				onValueChange
			}
		});
		const anchor = screen.getByRole('tab', { name: 'Tab destination' });
		if (!(anchor instanceof HTMLAnchorElement)) throw new Error('Expected a tab anchor.');
		expectDisabledAnchor(anchor);
		await fireEvent.keyDown(anchor, { key: 'Enter' });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole('tab', { name: 'Enabled' })).toHaveAttribute('tabindex', '0');
	});
});
