// NavigationMenu in a real browser (Base UI adoption plan, lane C4, NM-1): the pointer behaviour
// jsdom cannot show (hover opening and switching, closing when the pointer leaves, a press that
// pins a hover-opened panel), the real Tab key through the inline panel area, placement against
// the active trigger in both directions and against the viewport edge, and the size animation
// between panels of different sizes.
import { beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import NavigationMenuHarness from './NavigationMenuHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;
const expanded = (name: string) => trigger(name).getAttribute('aria-expanded');
const viewport = () => document.querySelector<HTMLElement>('nav [data-side="bottom"]');
const popup = () => (viewport()?.firstElementChild as HTMLElement | undefined) ?? null;
// The pointer stays where the last test left it; a bar that mounts under it would be hovered.
beforeEach(async () => {
	await userEvent.hover(document.documentElement, {
		position: { x: window.innerWidth - 2, y: window.innerHeight - 2 }
	});
});

const outside = () => page.getByText('Outside').element() as HTMLElement;

describe('hover', () => {
	test('resting on a trigger opens its panel after the delay, moving to another switches at once', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 120 } } });
		await userEvent.hover(trigger('Product'));
		await sleep(40);
		expect(expanded('Product')).toBe('false');
		await expect.poll(() => expanded('Product')).toBe('true');

		await userEvent.hover(trigger('Company'));
		// No delay while a panel is open.
		await expect.poll(() => expanded('Company'), { timeout: 100 }).toBe('true');
		expect(expanded('Product')).toBe('false');
		expect(page.getByRole('link', { name: 'About' }).element()).toBeTruthy();
	});

	test('a hover-opened panel closes once the pointer has left the triggers and the panel', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0, closeDelay: 60 } } });
		await userEvent.hover(trigger('Product'));
		await expect.poll(() => expanded('Product')).toBe('true');
		await userEvent.hover(outside());
		await expect.poll(() => expanded('Product')).toBe('false');
	});

	test('the pointer can travel from the trigger down into the panel', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0, closeDelay: 60 } } });
		await userEvent.hover(trigger('Product'));
		await expect.poll(() => expanded('Product')).toBe('true');
		await userEvent.hover(page.getByRole('link', { name: /Components/ }).element());
		await sleep(200);
		expect(expanded('Product')).toBe('true');
	});

	test('pressing the trigger of a hover-opened panel keeps it open past the pointer leaving', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0, closeDelay: 60 } } });
		await userEvent.hover(trigger('Product'));
		await expect.poll(() => expanded('Product')).toBe('true');
		await userEvent.click(trigger('Product'));
		expect(expanded('Product')).toBe('true');
		await userEvent.hover(outside());
		await sleep(250);
		expect(expanded('Product')).toBe('true');
		// The next press closes it.
		await userEvent.click(trigger('Product'));
		expect(expanded('Product')).toBe('false');
	});

	test('a panel opened by a press does not close when the pointer leaves', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0, closeDelay: 60 } } });
		await userEvent.click(trigger('Company'));
		expect(expanded('Company')).toBe('true');
		await userEvent.hover(outside());
		await sleep(250);
		expect(expanded('Company')).toBe('true');
	});

	test('openOnHover={false} leaves opening to presses', async () => {
		render(NavigationMenuHarness, { props: { menu: { openOnHover: false, delay: 0 } } });
		await userEvent.hover(trigger('Product'));
		await sleep(200);
		expect(expanded('Product')).toBe('false');
	});

	test('a disabled trigger does not open on hover', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0 } } });
		await userEvent.hover(trigger('Labs'), { force: true });
		await sleep(150);
		expect(expanded('Labs')).toBe('false');
	});
});

describe('keyboard in a real browser', () => {
	test('Tab visits every trigger and link, then the open trigger hands over to its panel', async () => {
		render(NavigationMenuHarness);
		await tab();
		expect(document.activeElement).toBe(trigger('Product'));
		await tab();
		expect(document.activeElement).toBe(trigger('Company'));
		await tab();
		expect(document.activeElement).toBe(page.getByRole('link', { name: 'Pricing' }).element());
		// Labs is disabled; the next stop is whatever follows the nav.
		await tab();
		expect(document.activeElement).toBe(
			page.getByRole('button', { name: 'After the menu' }).element()
		);

		await tab({ shift: true });
		await tab({ shift: true });
		await tab({ shift: true });
		expect(document.activeElement).toBe(trigger('Product'));
		await userEvent.keyboard('{Enter}');
		expect(expanded('Product')).toBe('true');
		// Opening keeps focus on the trigger.
		expect(document.activeElement).toBe(trigger('Product'));
		await tab();
		expect(document.activeElement).toBe(page.getByRole('link', { name: /Components/ }).element());
		await tab();
		expect(document.activeElement).toBe(page.getByRole('link', { name: 'Blocks' }).element());
		// Past the last link: on to the next entry of the bar, closing the panel.
		await tab();
		expect(document.activeElement).toBe(trigger('Company'));
		await expect.poll(() => expanded('Product')).toBe('false');
	});

	test('Shift+Tab from the element after an open panel lands inside the panel, not behind it', async () => {
		render(NavigationMenuHarness, { props: { menu: { defaultValue: 'product' } } });
		page.getByRole('button', { name: 'After the menu' }).element().focus();
		await tab({ shift: true });
		expect(document.activeElement).toBe(page.getByRole('link', { name: 'Blocks' }).element());
	});

	test('Escape closes the panel and returns focus to the trigger with a visible ring', async () => {
		render(NavigationMenuHarness);
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await tab();
		await userEvent.keyboard('{Escape}');
		expect(expanded('Product')).toBe('false');
		expect(document.activeElement).toBe(trigger('Product'));
		expect(trigger('Product').matches(':focus-visible')).toBe(true);
	});

	test('Escape after a pointer-opened panel left focus on the body returns focus to the trigger', async () => {
		render(NavigationMenuHarness);
		await userEvent.click(trigger('Product'));
		// Safari does not focus a button on click.
		trigger('Product').blur();
		expect(document.activeElement).toBe(document.body);
		await userEvent.keyboard('{Escape}');
		expect(expanded('Product')).toBe('false');
		expect(document.activeElement).toBe(trigger('Product'));
	});

	test('a link press closes the panel and returns focus to the trigger', async () => {
		render(NavigationMenuHarness);
		await userEvent.click(trigger('Product'));
		await userEvent.click(page.getByRole('link', { name: 'Blocks' }));
		expect(expanded('Product')).toBe('false');
		expect(document.activeElement).toBe(trigger('Product'));
	});
});

describe('keyboard inside a panel and along the bar', () => {
	const linkNamed = (name: string) =>
		page.getByRole('link', { name: new RegExp(`^${name}`) }).element() as HTMLElement;

	test("the arrow keys, Home and End move between the open panel's links, wrapping", async () => {
		render(NavigationMenuHarness);
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(linkNamed('Components'));
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(linkNamed('Blocks'));
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(linkNamed('Components'));
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(linkNamed('Blocks'));
		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(linkNamed('Components'));
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(linkNamed('Blocks'));
		expect(linkNamed('Blocks').matches(':focus-visible')).toBe(true);
		expect(expanded('Product')).toBe('true');
		// The page did not scroll with the keys.
		expect(window.scrollY).toBe(0);
	});

	test('inline arrows inside a panel walk across the menus of the bar, mirrored in right-to-left', async () => {
		render(NavigationMenuHarness, { props: { dir: 'rtl', menu: { dir: 'rtl' } } });
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await tab();
		expect(document.activeElement).toBe(linkNamed('Components'));
		// Right-to-left: ArrowLeft is the inline end, the next menu.
		await userEvent.keyboard('{ArrowLeft}');
		await expect.poll(() => expanded('Company')).toBe('true');
		expect(expanded('Product')).toBe('false');
		await expect.poll(() => document.activeElement).toBe(linkNamed('About'));
		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(() => expanded('Product')).toBe('true');
		await expect.poll(() => document.activeElement).toBe(linkNamed('Components'));
	});

	test('a switch slides the old panel out toward the side away from the new trigger', async () => {
		// The default motion: the harness otherwise turns every transition off.
		render(NavigationMenuHarness, { props: { menu: { transition: undefined } } });
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => expanded('Product')).toBe('true');
		const popup = linkNamed('Components')
			.closest('[data-slot="navigation-menu-content-link"]')!
			.parentElement!.closest('[id]')!.parentElement!;
		await userEvent.keyboard('{ArrowRight}');
		// Both panels are in the popup while the old one leaves, out of the layout.
		const panels = () => Array.from(popup.children).filter((child) => child.id);
		await expect.poll(() => panels().length).toBe(2);
		const leaving = panels().find((panel) => getComputedStyle(panel).position === 'absolute');
		expect(leaving).toBeDefined();
		await expect.poll(() => panels().length, { timeout: 2000 }).toBe(1);
		expect(expanded('Company')).toBe('true');
	});

	test('arrowing along the bar with a panel open switches to the panel of the focused trigger', async () => {
		render(NavigationMenuHarness);
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(trigger('Company'));
		await expect.poll(() => expanded('Company')).toBe('true');
		expect(expanded('Product')).toBe('false');
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(() => document.activeElement).toBe(linkNamed('About'));
	});

	test('Tab from a later entry of the bar skips the open panel and leaves the menu', async () => {
		render(NavigationMenuHarness);
		trigger('Product').focus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(page.getByRole('link', { name: 'Pricing' }).element());
		await tab();
		expect(document.activeElement).toBe(
			page.getByRole('button', { name: 'After the menu' }).element()
		);
		await expect.poll(() => expanded('Product')).toBe('false');
	});
});

describe('pointer, then keyboard', () => {
	test('a pressed trigger takes focus in every engine, without a ring: Tab enters its panel', async () => {
		render(NavigationMenuHarness, { props: { menu: { openOnHover: false } } });
		await userEvent.click(trigger('Product'));
		expect(document.activeElement).toBe(trigger('Product'));
		expect(trigger('Product').matches(':focus-visible')).toBe(false);
		await tab();
		expect(document.activeElement).toBe(page.getByRole('link', { name: /^Components/ }).element());
	});

	test('ArrowDown after a press moves into the panel', async () => {
		render(NavigationMenuHarness, { props: { menu: { openOnHover: false } } });
		await userEvent.click(trigger('Product'));
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(page.getByRole('link', { name: /^Components/ }).element());
	});

	test('Enter on the focused trigger of a hover-opened panel closes it', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 0, closeDelay: 60 } } });
		trigger('Product').focus();
		await userEvent.hover(trigger('Product'));
		await expect.poll(() => expanded('Product')).toBe('true');
		await userEvent.keyboard('{Enter}');
		expect(expanded('Product')).toBe('false');
	});

	test('a quick second press closes the panel for good, before the hover delay runs out', async () => {
		render(NavigationMenuHarness, { props: { menu: { delay: 150 } } });
		await userEvent.click(trigger('Product'));
		await userEvent.click(trigger('Product'));
		expect(expanded('Product')).toBe('false');
		await sleep(300);
		expect(expanded('Product')).toBe('false');
	});
});

describe('wrapping', () => {
	test('a bar wider than its container wraps instead of clipping its last item', async () => {
		render(NavigationMenuHarness, { props: { menu: { class: 'max-w-40' } } });
		const nav = document.querySelector('nav')!;
		const list = nav.querySelector('ul')!;
		expect(list.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
		const last = page.getByRole('link', { name: 'Pricing' }).element().getBoundingClientRect();
		expect(last.right).toBeLessThanOrEqual(nav.getBoundingClientRect().right + 1);
	});
});

describe('placement', () => {
	test('the panel lines up with the start edge of the open trigger', async () => {
		render(NavigationMenuHarness, { props: { menu: { defaultValue: 'company' } } });
		await expect.poll(() => popup()?.getBoundingClientRect().height).toBeGreaterThan(0);
		const rect = popup()!.getBoundingClientRect();
		const button = trigger('Company').getBoundingClientRect();
		expect(Math.abs(rect.left - button.left)).toBeLessThan(1.5);
		expect(rect.top).toBeGreaterThanOrEqual(button.bottom);
		expect(viewport()!.style.getPropertyValue('--anchor-width')).toBe(`${button.width}px`);
	});

	test('in right-to-left it lines up with the end edge, and the arrow keys mirror', async () => {
		render(NavigationMenuHarness, {
			props: { dir: 'rtl', menu: { defaultValue: 'company', dir: 'rtl' } }
		});
		await expect.poll(() => popup()?.getBoundingClientRect().height).toBeGreaterThan(0);
		const rect = popup()!.getBoundingClientRect();
		const button = trigger('Company').getBoundingClientRect();
		expect(Math.abs(rect.right - button.right)).toBeLessThan(1.5);
		trigger('Product').focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(trigger('Company'));
	});

	test('a panel wider than the room to the viewport edge shifts to stay inside it', async () => {
		render(NavigationMenuHarness, {
			props: {
				align: 'end',
				menu: { defaultValue: 'product' },
				items: [
					{ type: 'link', label: 'Home', href: '#home' },
					{
						type: 'panel',
						value: 'wide',
						label: 'Wide panel',
						content: [
							{ label: 'A rather long link label that makes the panel wide', href: '#one' },
							{ label: 'Another rather long link label for the panel', href: '#two' }
						]
					}
				]
			}
		});
		await userEvent.click(trigger('Wide panel'));
		await expect.poll(() => popup()?.getBoundingClientRect().width).toBeGreaterThan(200);
		const rect = popup()!.getBoundingClientRect();
		const button = trigger('Wide panel').getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		expect(rect.right).toBeLessThanOrEqual(width - 8 + 0.5);
		expect(rect.left).toBeGreaterThanOrEqual(8 - 0.5);
		// Shifted left of the trigger's start edge, since it would overflow at the end.
		expect(rect.left).toBeLessThan(button.left);
	});
});

describe('animated size', () => {
	test('switching to a panel of another size animates the popup instead of jumping', async () => {
		render(NavigationMenuHarness, {
			props: {
				menu: { defaultValue: 'a', transition: { in: { duration: 0 }, out: { duration: 0 } } },
				items: [
					{ type: 'panel', value: 'a', label: 'Small', content: [{ label: 'One', href: '#1' }] },
					{
						type: 'panel',
						value: 'b',
						label: 'Large',
						content: [
							{ label: 'Alpha', href: '#a', description: 'First of many' },
							{ label: 'Beta', href: '#b', description: 'Second of many' },
							{ label: 'Gamma', href: '#c', description: 'Third of many' },
							{ label: 'Delta', href: '#d', description: 'Fourth of many' }
						]
					}
				]
			}
		});
		await expect.poll(() => popup()?.getBoundingClientRect().height).toBeGreaterThan(0);
		const before = popup()!.getBoundingClientRect().height;
		await userEvent.click(trigger('Large'));
		await expect.poll(() => popup()!.getAnimations().length).toBeGreaterThan(0);
		const during = popup()!.getBoundingClientRect().height;
		// Started from the old height, not the new one.
		expect(during).toBeLessThan(before + 120);
		await expect.poll(() => popup()!.getAnimations().length, { timeout: 2000 }).toBe(0);
		const after = popup()!.getBoundingClientRect().height;
		expect(after).toBeGreaterThan(before + 60);
	});
});

describe('closing', () => {
	test('the popup stays through its exit animation and is removed once, with onAfterClose', async () => {
		let closed = 0;
		render(NavigationMenuHarness, {
			props: {
				menu: {
					defaultValue: 'product',
					transition: { in: { duration: 0 }, out: { duration: 240, y: -8, opacity: 0 } },
					onAfterClose: () => (closed += 1)
				}
			}
		});
		await expect.poll(() => popup()).not.toBeNull();
		await userEvent.click(trigger('Product'));
		expect(expanded('Product')).toBe('false');
		// Still there, exiting.
		expect(popup()).not.toBeNull();
		expect(popup()!.hasAttribute('data-exiting')).toBe(true);
		await expect.poll(() => popup(), { timeout: 2000 }).toBeNull();
		expect(closed).toBe(1);
	});

	test('keepMounted hides the popup at once and keeps the panel links in the DOM', async () => {
		render(NavigationMenuHarness, { props: { menu: { keepMounted: true } } });
		expect(viewport()!.hasAttribute('hidden')).toBe(true);
		await userEvent.click(trigger('Product'));
		await expect.poll(() => viewport()!.hasAttribute('hidden')).toBe(false);
		await userEvent.click(trigger('Product'));
		await expect.poll(() => viewport()!.hasAttribute('hidden')).toBe(true);
		expect(document.body.textContent).toContain('Components');
	});
});
