// Hover across components: the Theme's warm-up group (OV-INFRA-8) shared by hover popovers,
// hover cards and tooltips; Popover `closeDelay` feeding the safe area, and touch-free hover
// cards (MN-7).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './HoverIntentHarness.test.svelte';
import ProposedLawsHarness from './ProposedLawsHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const button = (name: string) => screen.getByRole('button', { name });

// Each hover arrives somewhere new, as a pointer that travelled there would.
let position = 0;
/** A mouse hover as `useHoverAction` reads it (Popover, Tooltip). */
const hover = async (element: HTMLElement) => {
	position += 10;
	await fireEvent.pointerEnter(element, { pointerType: 'mouse' });
	await fireEvent.mouseEnter(element, { clientX: position, clientY: position });
};
const unhover = (element: HTMLElement) => fireEvent.mouseLeave(element);

const mount = async (props: Parameters<typeof render<typeof Harness>>[1] = {}) => {
	render(Harness, props);
	// Svelte's `on` attaches hover listeners a microtask later.
	await tick();
};

describe('hover warm-up group', () => {
	test('a hover popover opens without its delay while a neighbouring one is open', async () => {
		await mount();
		await hover(button('Popover A'));
		await waitFor(() => expect(screen.getByText('Popover A body')).toBeInTheDocument());
		await unhover(button('Popover A'));

		await hover(button('Popover B'));
		await sleep(30);
		expect(screen.getByText('Popover B body')).toBeInTheDocument();
	});

	test('the next hover popover also opens at once shortly after the last one closed', async () => {
		await mount();
		await hover(button('Popover A'));
		await waitFor(() => expect(button('Popover A')).toHaveAttribute('aria-expanded', 'true'));
		await unhover(button('Popover A'));
		// A press on a hover-opened trigger pins it; Escape closes it.
		await fireEvent.keyDown(document.body, { key: 'Escape' });
		await waitFor(() => expect(button('Popover A')).toHaveAttribute('aria-expanded', 'false'));

		await hover(button('Popover B'));
		await sleep(30);
		expect(button('Popover B')).toHaveAttribute('aria-expanded', 'true');
	});

	test('a hover card opens without its delay while a neighbouring card is open', async () => {
		await mount();
		await fireEvent.pointerEnter(button('Card A'), { pointerType: 'mouse' });
		await waitFor(() => expect(screen.getByText('Card A body')).toBeInTheDocument());
		// Card A waits its close delay; card B does not wait its open delay meanwhile.
		await fireEvent.pointerLeave(button('Card A'), { pointerType: 'mouse' });
		await fireEvent.pointerEnter(button('Card B'), { pointerType: 'mouse' });
		await sleep(30);
		expect(screen.getByText('Card B body')).toBeInTheDocument();
	});

	test('a tooltip shows at once right after a hover card closed', async () => {
		await mount();
		// Focus rests elsewhere, so the closing card does not hand focus back to its trigger
		// (which would reopen it through openOnFocus).
		screen.getByRole('textbox', { name: 'Elsewhere' }).focus();
		await fireEvent.pointerEnter(button('Card A'), { pointerType: 'mouse' });
		await waitFor(() => expect(screen.getByText('Card A body')).toBeInTheDocument());
		await fireEvent.pointerLeave(button('Card A'), { pointerType: 'mouse' });
		await waitFor(() => expect(button('Card A')).toHaveAttribute('aria-expanded', 'false'));

		await hover(button('Page tooltip'));
		await sleep(30);
		expect(screen.getByRole('tooltip')).toHaveTextContent('Page tip');
	});

	test('one tooltip after another shows at once', async () => {
		await mount();
		await hover(button('Page tooltip'));
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Page tip'));
		await unhover(button('Page tooltip'));
		await hover(button('Second tooltip'));
		await sleep(30);
		expect(screen.getByRole('tooltip')).toHaveTextContent('Second tip');
	});

	test('a tooltip inside an open hover card keeps its delay', async () => {
		await mount();
		await fireEvent.pointerEnter(button('Card A'), { pointerType: 'mouse' });
		await waitFor(() => expect(screen.getByText('Card A body')).toBeInTheDocument());
		await hover(button('Inner tooltip'));
		await sleep(100);
		expect(screen.queryByRole('tooltip')).toBeNull();
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Inner tip'));
	});

	test('the first hover of the page waits its delay', async () => {
		await mount();
		await hover(button('Popover B'));
		await sleep(100);
		expect(button('Popover B')).toHaveAttribute('aria-expanded', 'false');
		await waitFor(() => expect(button('Popover B')).toHaveAttribute('aria-expanded', 'true'));
	});
});

describe('hover-opening popovers', () => {
	test('a11y:popover.hover-ignores-touch-and-disabled a touch tap or a disabled trigger never hover-opens a popover', async () => {
		const { unmount } = render(ProposedLawsHarness, { props: { scenario: 'popover-hover' } });
		await tick();
		const trigger = button('Hover trigger');
		// A tap: touch pointer events, then the compatibility mouse events (no click here).
		await fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
		await fireEvent.pointerDown(trigger, { pointerType: 'touch' });
		await fireEvent.pointerUp(trigger, { pointerType: 'touch' });
		await fireEvent.mouseEnter(trigger);
		await sleep(30);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		unmount();

		render(ProposedLawsHarness, { props: { scenario: 'popover-hover', triggerDisabled: true } });
		await tick();
		await hover(button('Hover trigger'));
		await sleep(30);
		expect(screen.queryByRole('button', { name: 'Inside hover popover' })).toBeNull();
	});
});

describe('hover cards and touch', () => {
	test('a touch tap’s pointerenter does not open a hover card', async () => {
		await mount();
		await fireEvent.pointerEnter(button('Card B'), { pointerType: 'touch' });
		await sleep(250);
		expect(screen.queryByText('Card B body')).toBeNull();
	});
});

describe('Popover closeDelay', () => {
	test('a hover popover waits closeDelay outside its safe area before closing', async () => {
		await mount({ closeDelay: 300, popoverDelay: 0 });
		await hover(button('Popover A'));
		await waitFor(() => expect(button('Popover A')).toHaveAttribute('aria-expanded', 'true'));
		// The safe area starts listening a microtask after it activates.
		await tick();
		await fireEvent.pointerMove(window, { clientX: 900, clientY: 900 });
		await sleep(200);
		expect(button('Popover A')).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() => expect(button('Popover A')).toHaveAttribute('aria-expanded', 'false'));
	});
});
