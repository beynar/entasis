// NavigationMenu (Base UI adoption plan, lane C4, NM-1): disclosure markup, keyboard opening that
// keeps focus on the trigger, Tab order between the bar and the inline panel area, link presses
// that close every level once, disabled triggers, controlled and uncontrolled value, and
// kept-mounted panels. Real pointer hover, size animation and placement run in
// `navigationMenu.browser.test.ts`.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import NavigationMenuHarness from './NavigationMenuHarness.test.svelte';
import type { NavigationMenuItem } from './navigationMenu.props.js';

type Props = Parameters<typeof NavigationMenuHarness>[1];
type Change = { value: string | null; reason: string };

const mount = async (props: Props = {}) => {
	const changes: Change[] = [];
	const view = render(NavigationMenuHarness, { props: { changes, ...props } });
	await tick();
	return { changes, ...view };
};
const trigger = (name: string) => screen.getByRole('button', { name });
// A panel link's name includes its description, so match on the start.
const link = (name: string) => screen.getByRole('link', { name: new RegExp(`^${name}`) });
const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(element, { key, ...init });
const open = async (name: string) => {
	await fireEvent.click(trigger(name));
	await tick();
};

describe('markup', () => {
	test('a nav landmark with a list of disclosure buttons and links', async () => {
		await mount();
		const nav = screen.getByRole('navigation', { name: 'Main' });
		expect(nav.querySelector('ul')).not.toBeNull();
		for (const name of ['Product', 'Company']) {
			const button = trigger(name);
			expect(button).toHaveAttribute('aria-expanded', 'false');
			// A disclosure, not a menu.
			expect(button).not.toHaveAttribute('aria-haspopup');
			expect(button.tagName).toBe('BUTTON');
		}
		expect(link('Pricing')).toHaveAttribute('href', '#pricing');
		expect(link('Pricing')).toHaveAttribute('aria-current', 'page');
		// No orientation attribute on any list.
		expect(nav.querySelector('[aria-orientation]')).toBeNull();
	});

	test('an open trigger controls a panel that exists in the DOM', async () => {
		await mount();
		await open('Product');
		const button = trigger('Product');
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button).toHaveAttribute('data-popup-open');
		const panel = document.getElementById(button.getAttribute('aria-controls')!);
		expect(panel).not.toBeNull();
		expect(panel).toContainElement(link('Components'));
		expect(panel).not.toBeNull();
		// The panel area sits inside the nav, in the flow, not at the end of <body>.
		expect(screen.getByRole('navigation')).toContainElement(panel);
	});
});

describe('opening', () => {
	test('a press opens one panel at a time and reports a trigger press', async () => {
		const { changes } = await mount();
		await open('Product');
		expect(link('Components')).toBeVisible();
		await open('Company');
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() => expect(screen.queryByRole('link', { name: 'Components' })).toBeNull());
		expect(changes).toEqual([
			{ value: 'product', reason: 'trigger-press' },
			{ value: 'company', reason: 'trigger-press' }
		]);
	});

	test('a second press closes the panel', async () => {
		const { changes } = await mount();
		await open('Product');
		await open('Product');
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'trigger-press' });
	});

	test('a11y:navigation-menu.opening-keeps-focus ArrowDown opens the panel and focus stays on the trigger', async () => {
		await mount();
		const button = trigger('Product');
		button.focus();
		await keydown(button, 'ArrowDown');
		await tick();
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button).toHaveFocus();
		expect(link('Components')).toBeInTheDocument();
	});

	test('a Space or Enter press keeps focus on the trigger too', async () => {
		await mount();
		const button = trigger('Company');
		button.focus();
		await fireEvent.click(button);
		await tick();
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(button).toHaveFocus();
	});

	test('ArrowDown on an open trigger moves focus into the panel', async () => {
		await mount();
		const button = trigger('Product');
		button.focus();
		await keydown(button, 'ArrowDown');
		await tick();
		await keydown(button, 'ArrowDown');
		expect(link('Components')).toHaveFocus();
	});

	test('a disabled trigger never opens', async () => {
		const { changes } = await mount();
		const labs = trigger('Labs');
		expect(labs).toBeDisabled();
		expect(labs).toHaveAttribute('data-disabled');
		await fireEvent.click(labs);
		await keydown(labs, 'ArrowDown');
		expect(labs).toHaveAttribute('aria-expanded', 'false');
		expect(changes).toEqual([]);
	});

	test('a disabled panel assigned through value does not open', async () => {
		await mount({ menu: { defaultValue: 'labs' } });
		expect(trigger('Labs')).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Tab order', () => {
	test('a11y:navigation-menu.tab-enters-panel Tab from the open trigger enters the panel, Shift+Tab returns', async () => {
		await mount();
		const button = trigger('Product');
		button.focus();
		await open('Product');
		await keydown(button, 'Tab');
		expect(link('Components')).toHaveFocus();
		await keydown(link('Components'), 'Tab', { shiftKey: true });
		expect(button).toHaveFocus();
	});

	test('Tab past the last link continues after the trigger and closes the panel', async () => {
		const { changes } = await mount();
		const button = trigger('Product');
		button.focus();
		await open('Product');
		await keydown(button, 'Tab');
		link('Blocks').focus();
		await keydown(link('Blocks'), 'Tab');
		// The element after the trigger is the next entry of the bar.
		expect(trigger('Company')).toHaveFocus();
		expect(changes.at(-1)).toEqual({ value: null, reason: 'focus-out' });
		await waitFor(() => expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false'));
	});

	test('every trigger and link keeps its place in the Tab order', async () => {
		await mount();
		const stops = [...screen.getByRole('navigation').querySelectorAll<HTMLElement>('button, a')];
		for (const stop of stops.filter((element) => !element.matches(':disabled'))) {
			expect(stop.tabIndex).toBe(0);
		}
	});
});

describe('moving along the bar', () => {
	test('ArrowRight and ArrowLeft move between enabled triggers and links, Home and End jump', async () => {
		await mount();
		const product = trigger('Product');
		product.focus();
		await keydown(product, 'ArrowRight');
		expect(trigger('Company')).toHaveFocus();
		await keydown(trigger('Company'), 'ArrowRight');
		expect(link('Pricing')).toHaveFocus();
		// Labs is disabled and skipped; the bar ends at Pricing.
		await keydown(link('Pricing'), 'ArrowRight');
		expect(link('Pricing')).toHaveFocus();
		await keydown(link('Pricing'), 'ArrowLeft');
		expect(trigger('Company')).toHaveFocus();
		await keydown(trigger('Company'), 'Home');
		expect(product).toHaveFocus();
		await keydown(product, 'End');
		expect(link('Pricing')).toHaveFocus();
	});

	test('the arrow keys mirror in right-to-left', async () => {
		await mount({ dir: 'rtl' });
		const product = trigger('Product');
		product.focus();
		await keydown(product, 'ArrowLeft');
		expect(trigger('Company')).toHaveFocus();
		await keydown(trigger('Company'), 'ArrowRight');
		expect(product).toHaveFocus();
	});

	test('with a panel open, the open panel follows the arrow keys along the bar; a link closes it', async () => {
		const { changes } = await mount();
		const product = trigger('Product');
		product.focus();
		await open('Product');
		await keydown(product, 'ArrowRight');
		await tick();
		expect(trigger('Company')).toHaveFocus();
		expect(product).toHaveAttribute('aria-expanded', 'false');
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
		await keydown(trigger('Company'), 'ArrowRight');
		await tick();
		expect(link('Pricing')).toHaveFocus();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
		// No panel open any more: the arrows only move focus again.
		await keydown(link('Pricing'), 'ArrowLeft');
		await tick();
		expect(trigger('Company')).toHaveFocus();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
		expect(changes).toEqual([
			{ value: 'product', reason: 'trigger-press' },
			{ value: 'company', reason: 'list-navigation' },
			{ value: null, reason: 'list-navigation' }
		]);
	});

	test('Escape on another entry of the bar closes the open panel and leaves focus there', async () => {
		await mount();
		trigger('Product').focus();
		await open('Product');
		await keydown(trigger('Product'), 'ArrowRight');
		await keydown(trigger('Company'), 'Escape');
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
		expect(trigger('Company')).toHaveFocus();
	});

	test('Tab from the last entry of the bar skips a panel that belongs to another trigger', async () => {
		const { changes } = await mount();
		trigger('Product').focus();
		await open('Product');
		link('Pricing').focus();
		await keydown(link('Pricing'), 'Tab');
		expect(screen.getByRole('button', { name: 'After the menu' })).toHaveFocus();
		await tick();
		expect(changes.at(-1)).toEqual({ value: null, reason: 'focus-out' });
	});
});

describe('moving inside a panel', () => {
	const panelLinks: NavigationMenuItem<string>[] = [
		{
			type: 'panel',
			value: 'docs',
			label: 'Docs',
			content: [
				{ label: 'One', href: '#one' },
				{ label: 'Two', href: '#two' },
				{ label: 'Gone', href: '#gone', disabled: true },
				{ label: 'Three', href: '#three' }
			]
		},
		{ type: 'link', label: 'Blog', href: '#blog' }
	];

	test('a11y:navigation-menu.panel-arrows ArrowDown and ArrowUp move between the links, wrapping, and skip a disabled one', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		await keydown(trigger('Docs'), 'ArrowDown');
		expect(link('One')).toHaveFocus();
		await keydown(link('One'), 'ArrowDown');
		expect(link('Two')).toHaveFocus();
		await keydown(link('Two'), 'ArrowDown');
		expect(link('Three')).toHaveFocus();
		await keydown(link('Three'), 'ArrowDown');
		expect(link('One')).toHaveFocus();
		await keydown(link('One'), 'ArrowUp');
		expect(link('Three')).toHaveFocus();
		expect(trigger('Docs')).toHaveAttribute('aria-expanded', 'true');
	});

	test('Home and End jump to the first and last link and leave the bar alone', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		link('Two').focus();
		await keydown(link('Two'), 'End');
		expect(link('Three')).toHaveFocus();
		await keydown(link('Three'), 'Home');
		expect(link('One')).toHaveFocus();
	});

	test('ArrowRight inside a panel goes to the next entry of the bar: a link closes the panel and takes focus', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		link('One').focus();
		await keydown(link('One'), 'ArrowRight');
		expect(link('Blog')).toHaveFocus();
		expect(trigger('Docs')).toHaveAttribute('aria-expanded', 'false');
	});

	test('ArrowLeft at the first entry of the bar stays put, and the arrows mirror in right-to-left', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		link('One').focus();
		await keydown(link('One'), 'ArrowLeft');
		expect(link('One')).toHaveFocus();
		expect(trigger('Docs')).toHaveAttribute('aria-expanded', 'true');
	});

	test('in right-to-left ArrowLeft goes to the next entry of the bar', async () => {
		await mount({ items: panelLinks, dir: 'rtl', menu: { dir: 'rtl' } });
		trigger('Docs').focus();
		await open('Docs');
		link('One').focus();
		await keydown(link('One'), 'ArrowLeft');
		expect(link('Blog')).toHaveFocus();
	});

	test('a modified arrow key is left to the browser', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		link('One').focus();
		await keydown(link('One'), 'ArrowDown', { altKey: true });
		expect(link('One')).toHaveFocus();
	});

	test('nested triggers are stops, links of a collapsed level are not', async () => {
		const items: NavigationMenuItem<string>[] = [
			{
				type: 'panel',
				value: 'outer',
				label: 'Outer',
				content: [{ label: 'Top link', href: '#top' }],
				items: [
					{
						type: 'panel',
						value: 'inner',
						label: 'Inner',
						content: [{ label: 'Deep link', href: '#deep' }]
					},
					{ type: 'link', label: 'Last link', href: '#last' }
				]
			}
		];
		await mount({ items, menu: { keepMounted: true } });
		trigger('Outer').focus();
		await open('Outer');
		link('Top link').focus();
		await keydown(link('Top link'), 'ArrowDown');
		expect(trigger('Inner')).toHaveFocus();
		await keydown(trigger('Inner'), 'ArrowDown');
		expect(link('Last link')).toHaveFocus();
		await fireEvent.click(trigger('Inner'));
		await tick();
		await keydown(link('Last link'), 'ArrowUp');
		expect(link('Deep link')).toHaveFocus();
	});

	test('a snippet panel moves between its controls, and a text field keeps its arrow keys', async () => {
		await mount({ withSnippet: true });
		trigger('Rich').focus();
		await open('Rich');
		const guide = screen.getByRole('link', { name: 'Guide' });
		const search = screen.getByRole('textbox', { name: 'Search the docs' });
		const close = screen.getByRole('button', { name: 'Close panel' });
		guide.focus();
		// The text field is not an arrow stop: ArrowDown goes from the link to the button.
		await keydown(guide, 'ArrowDown');
		expect(close).toHaveFocus();
		search.focus();
		await keydown(search, 'ArrowDown');
		await keydown(search, 'Home');
		expect(search).toHaveFocus();
	});

	test('a control that handles an arrow key itself keeps it', async () => {
		await mount({ items: panelLinks });
		trigger('Docs').focus();
		await open('Docs');
		link('One').focus();
		link('One').addEventListener('keydown', (event) => event.preventDefault(), { once: true });
		await keydown(link('One'), 'ArrowDown');
		expect(link('One')).toHaveFocus();
	});
});

describe('pointer and keyboard together', () => {
	test('a pointer press focuses the trigger, as Safari does not', async () => {
		await mount();
		screen.getByRole('button', { name: 'After the menu' }).focus();
		await fireEvent.click(trigger('Product'), { detail: 1 });
		await tick();
		expect(trigger('Product')).toHaveFocus();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'true');
	});

	test('Enter on the trigger of a hover-opened panel closes it; a pointer press pins it', async () => {
		const { changes } = await mount({ menu: { delay: 0 } });
		await fireEvent.mouseEnter(trigger('Product'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.click(trigger('Product'), { detail: 1 });
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.mouseLeave(trigger('Product'));
		await fireEvent.mouseEnter(trigger('Company'));
		await tick();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
		trigger('Company').focus();
		// Enter and Space click with no pointer: detail 0.
		await fireEvent.click(trigger('Company'), { detail: 0 });
		await tick();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'trigger-press' });
	});

	test('a hover that began before a press cannot reopen the panel the press closed', async () => {
		await mount({ menu: { delay: 40 } });
		await fireEvent.mouseEnter(trigger('Product'));
		await fireEvent.click(trigger('Product'), { detail: 1 });
		await tick();
		await fireEvent.click(trigger('Product'), { detail: 1 });
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		await new Promise((resolve) => setTimeout(resolve, 80));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
	});

	test('Tab past the last link of the last panel, with nothing after the menu, closes it', async () => {
		const items: NavigationMenuItem<string>[] = [
			{ type: 'link', label: 'Home', href: '#home' },
			{ type: 'panel', value: 'more', label: 'More', content: [{ label: 'Last', href: '#last' }] }
		];
		const { changes } = await mount({ items });
		screen.getByRole('button', { name: 'After the menu' }).remove();
		trigger('More').focus();
		await open('More');
		link('Last').focus();
		const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		link('Last').dispatchEvent(tab);
		await tick();
		// The browser moves focus out of the page, so the key is not taken.
		expect(tab.defaultPrevented).toBe(false);
		expect(changes.at(-1)).toEqual({ value: null, reason: 'focus-out' });
		await waitFor(() => expect(trigger('More')).toHaveAttribute('aria-expanded', 'false'));
	});
});

describe('closing', () => {
	test('a11y:navigation-menu.escape-restores-focus Escape closes the panel and returns focus to the trigger', async () => {
		const { changes } = await mount();
		const button = trigger('Product');
		button.focus();
		await open('Product');
		await keydown(button, 'Tab');
		expect(link('Components')).toHaveFocus();
		await keydown(link('Components'), 'Escape');
		await tick();
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveFocus();
		expect(changes.at(-1)).toEqual({ value: null, reason: 'escape-key' });
	});

	test('Escape returns focus to the trigger when a pointer-opened panel left focus on the body', async () => {
		// Safari does not focus a button on click: the panel opens, focus stays on the body.
		const { changes } = await mount();
		const button = trigger('Product');
		await open('Product');
		button.blur();
		expect(document.body).toHaveFocus();
		await keydown(document.body, 'Escape');
		await tick();
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveFocus();
		expect(changes.at(-1)).toEqual({ value: null, reason: 'escape-key' });
	});

	test('a press outside closes it', async () => {
		const { changes } = await mount();
		await open('Product');
		await fireEvent.pointerDown(screen.getByText('Outside'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'outside-press' });
	});

	test('a press inside the bar does not count as outside', async () => {
		await mount();
		await open('Product');
		await fireEvent.pointerDown(link('Components'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'true');
	});

	test('focus moving out of the menu closes it', async () => {
		const { changes } = await mount();
		const button = trigger('Product');
		button.focus();
		await open('Product');
		await fireEvent.focusOut(button, { relatedTarget: screen.getByText('After the menu') });
		await tick();
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'focus-out' });
	});

	test('a link press closes the panel and reports one change to null', async () => {
		const { changes } = await mount();
		await open('Product');
		await fireEvent.click(link('Blocks'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.filter((change) => change.value === null)).toEqual([
			{ value: null, reason: 'item-press' }
		]);
	});

	test('a plain link of the bar closes an open panel as well', async () => {
		const { changes } = await mount();
		await open('Product');
		await fireEvent.click(link('Pricing'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'item-press' });
	});

	test('a link whose own handler calls preventDefault keeps the panel open', async () => {
		const items: NavigationMenuItem<string>[] = [
			{
				type: 'panel',
				value: 'p',
				label: 'Panel',
				content: [{ label: 'Stay', href: '#stay', onclick: (event) => event.preventDefault() }]
			}
		];
		const { changes } = await mount({ items });
		await open('Panel');
		await fireEvent.click(link('Stay'));
		await tick();
		expect(trigger('Panel')).toHaveAttribute('aria-expanded', 'true');
		expect(changes).toEqual([{ value: 'p', reason: 'trigger-press' }]);
	});

	test('a link press closes every nested level once', async () => {
		const items: NavigationMenuItem<string>[] = [
			{
				type: 'panel',
				value: 'outer',
				label: 'Outer',
				content: [{ label: 'Top link', href: '#top' }],
				items: [
					{
						type: 'panel',
						value: 'inner',
						label: 'Inner',
						content: [{ label: 'Deep link', href: '#deep' }]
					}
				]
			}
		];
		const { changes } = await mount({ items });
		await open('Outer');
		await fireEvent.click(trigger('Inner'));
		expect(trigger('Inner')).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.click(link('Deep link'));
		await tick();
		expect(trigger('Outer')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.filter((change) => change.value === null)).toHaveLength(1);
		// Reopening finds the nested level collapsed again.
		await open('Outer');
		expect(trigger('Inner')).toHaveAttribute('aria-expanded', 'false');
	});

	test('a nested level is indented with a logical inline-start padding', async () => {
		const items: NavigationMenuItem<string>[] = [
			{
				type: 'panel',
				value: 'outer',
				label: 'Outer',
				content: [{ label: 'Top link', href: '#top' }],
				items: [
					{
						type: 'panel',
						value: 'inner',
						label: 'Inner',
						content: [{ label: 'Deep link', href: '#deep' }]
					}
				]
			}
		];
		await mount({ items });
		await open('Outer');
		await fireEvent.click(trigger('Inner'));
		const nested = link('Deep link').closest('ul');
		expect(nested).toHaveClass('ps-md');
		expect(nested).not.toHaveClass('pl-md');
	});

	test('a snippet panel receives close()', async () => {
		const { changes } = await mount({ withSnippet: true });
		await open('Rich');
		expect(screen.getByText('Custom content')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
		await tick();
		expect(trigger('Rich')).toHaveAttribute('aria-expanded', 'false');
		expect(changes.at(-1)).toEqual({ value: null, reason: 'close-press' });
	});
});

describe('value', () => {
	test('onValueChange can cancel a change and the panel stays closed', async () => {
		const items = undefined;
		const { container } = render(NavigationMenuHarness, {
			props: {
				items,
				menu: {
					onValueChange: ({ details }: { details: { cancel: () => void } }) => details.cancel()
				}
			}
		});
		await tick();
		await fireEvent.click(trigger('Product'));
		await tick();
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		expect(container.querySelector('[data-open]')).toBeNull();
	});

	test('defaultValue opens a panel at mount without reporting', async () => {
		const { changes } = await mount({ menu: { defaultValue: 'company' } });
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
		expect(link('About')).toBeInTheDocument();
		expect(changes).toEqual([]);
	});

	test('a bound value controls the open panel', async () => {
		const { rerender } = await mount({ value: 'product' });
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'true');
		await rerender({ value: 'company' });
		await tick();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true');
		expect(trigger('Product')).toHaveAttribute('aria-expanded', 'false');
		await rerender({ value: null });
		await tick();
		expect(trigger('Company')).toHaveAttribute('aria-expanded', 'false');
	});

	test('rebuilding the items with the same values leaves the open panel alone', async () => {
		const make = (): NavigationMenuItem<string>[] => [
			{ type: 'panel', value: 'a', label: 'A', content: [{ label: 'One', href: '#1' }] },
			{ type: 'panel', value: 'b', label: 'B', content: [{ label: 'Two', href: '#2' }] }
		];
		const { changes, rerender } = await mount({ items: make() });
		await open('A');
		await rerender({ items: make() });
		await tick();
		expect(trigger('A')).toHaveAttribute('aria-expanded', 'true');
		expect(link('One')).toBeInTheDocument();
		expect(changes).toEqual([{ value: 'a', reason: 'trigger-press' }]);
	});

	test('the value resets when the open panel disappears', async () => {
		const full: NavigationMenuItem<string>[] = [
			{ type: 'panel', value: 'a', label: 'A', content: [{ label: 'One', href: '#1' }] },
			{ type: 'panel', value: 'b', label: 'B', content: [{ label: 'Two', href: '#2' }] }
		];
		const { changes, rerender } = await mount({ items: full });
		await open('A');
		await rerender({ items: full.slice(1) });
		await tick();
		await waitFor(() => expect(changes.at(-1)).toEqual({ value: null, reason: 'trigger-unmount' }));
		expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('iconOnly', () => {
	test('the string label names an icon-only link and trigger without painting', async () => {
		const items: NavigationMenuItem<string>[] = [
			{ type: 'link', label: 'Home', href: '#home', iconOnly: true, prefix: 'H' },
			{
				type: 'panel',
				value: 'menu',
				label: 'Open navigation',
				prefix: 'M',
				iconOnly: true,
				content: [{ label: 'One', href: '#1' }]
			}
		];
		await mount({ items });
		const home = screen.getByRole('link', { name: 'Home' });
		expect(home).toHaveAttribute('aria-label', 'Home');
		expect(home).not.toHaveTextContent('Home');
		const menuTrigger = trigger('Open navigation');
		expect(menuTrigger).toHaveAttribute('aria-label', 'Open navigation');
		expect(menuTrigger).not.toHaveTextContent('Open navigation');
		await open('Open navigation');
		expect(link('One')).toBeInTheDocument();
	});

	test('a painted label adds no aria-label', async () => {
		await mount();
		expect(trigger('Company')).not.toHaveAttribute('aria-label');
	});
});

describe('keepMounted', () => {
	test('closed panels stay in the DOM under hidden', async () => {
		await mount({ menu: { keepMounted: true } });
		const panels = document.querySelectorAll<HTMLElement>(
			'nav [id$="-panel-0"], nav [id$="-panel-1"]'
		);
		expect(panels).toHaveLength(2);
		for (const panel of panels) expect(panel).toHaveAttribute('hidden');
		// A crawler reads the links in the markup.
		expect(screen.getByText('Components', { ignore: 'script' })).toBeInTheDocument();
		await open('Product');
		const [first, second] = panels;
		expect(first).not.toHaveAttribute('hidden');
		expect(second).toHaveAttribute('hidden');
	});

	test('without keepMounted nothing is rendered while closed', async () => {
		await mount();
		expect(screen.queryByText('Components')).toBeNull();
	});
});

describe('lifecycle callbacks', () => {
	test('onAfterOpen and onAfterClose fire once per open and close', async () => {
		const calls: string[] = [];
		await mount({
			menu: { onAfterOpen: () => calls.push('open'), onAfterClose: () => calls.push('close') }
		});
		await open('Product');
		await waitFor(() => expect(calls).toEqual(['open']));
		await open('Product');
		await waitFor(() => expect(calls).toEqual(['open', 'close']));
	});
});
