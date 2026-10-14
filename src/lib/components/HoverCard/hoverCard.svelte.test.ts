// HoverCard behaviour of the Base UI adoption plan, lane C2: reopening while it closes (OV-21;
// the close transition itself runs in `hoverCard.browser.test.ts`) and cards opened from inside a
// card (OV-22).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import HoverCardHarness from './HoverCardHarness.test.svelte';

type Props = Parameters<typeof HoverCardHarness>[1];
const mount = async (props: Props) => {
	render(HoverCardHarness, { props });
	// Svelte's `on` attaches hover listeners a microtask later.
	await tick();
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = (name: string) => screen.getByRole('button', { name });
const mouse = { pointerType: 'mouse' };
const enter = (element: Element) => fireEvent.pointerEnter(element, mouse);
const leave = (element: Element) => fireEvent.pointerLeave(element, mouse);
const card = (text: string) => screen.queryByText(text);
// The element a card's pointer handlers sit on: its content wrapper.
const wrapperOf = (text: string) => card(text)!.closest('[role="presentation"]')!;

describe('reopening while the card closes (OV-21)', () => {
	test('a card that has fully closed waits its delay again', async () => {
		await mount({
			scenario: 'single',
			card: { delay: 300, closeDelay: 0 }
		});
		await enter(trigger('Card trigger'));
		await waitFor(() => expect(card('Card body')).toBeInTheDocument());
		await leave(trigger('Card trigger'));
		await waitFor(() => expect(card('Card body')).toBeNull());
		// Past the warm-up window of the group.
		await sleep(450);

		await enter(trigger('Card trigger'));
		await sleep(80);
		expect(trigger('Card trigger')).toHaveAttribute('aria-expanded', 'false');
		await waitFor(() => expect(trigger('Card trigger')).toHaveAttribute('aria-expanded', 'true'));
	});

	test('moving to a neighbouring card opens it without waiting its delay', async () => {
		await mount({ scenario: 'sibling', card: { delay: 600, closeDelay: 0 } });
		await enter(trigger('First card'));
		await waitFor(() => expect(card('First body')).toBeInTheDocument(), { timeout: 1500 });
		await leave(trigger('First card'));
		await enter(trigger('Second card'));
		await sleep(40);
		expect(card('Second body')).toBeInTheDocument();
	});
});

describe('nested hover cards (OV-22)', () => {
	const openBoth = async () => {
		await enter(trigger('Outer trigger'));
		await waitFor(() => expect(card('Outer body')).toBeInTheDocument());
		await enter(trigger('Inner trigger'));
		await waitFor(() => expect(card('Inner body')).toBeInTheDocument());
	};

	test('moving from the outer card onto the card it opened keeps both open', async () => {
		await mount({
			scenario: 'nested',
			card: { delay: 0, closeDelay: 30 },
			innerCard: { delay: 0, closeDelay: 30 }
		});
		await openBoth();
		// The pointer leaves the outer card for the inner one, which is portaled elsewhere.
		await leave(wrapperOf('Outer body'));
		await enter(wrapperOf('Inner body'));
		await sleep(150);
		expect(card('Outer body')).toBeInTheDocument();
		expect(card('Inner body')).toBeInTheDocument();
	});

	test('leaving the inner card for good closes it, then the outer card behind it', async () => {
		await mount({
			scenario: 'nested',
			card: { delay: 0, closeDelay: 30 },
			innerCard: { delay: 0, closeDelay: 30 }
		});
		await openBoth();
		await leave(wrapperOf('Outer body'));
		await enter(wrapperOf('Inner body'));
		await sleep(100);

		await leave(wrapperOf('Inner body'));
		await waitFor(() => expect(card('Inner body')).toBeNull());
		await waitFor(() => expect(card('Outer body')).toBeNull());
	});

	test('going back from the inner card to the outer one keeps the outer card open', async () => {
		await mount({
			scenario: 'nested',
			card: { delay: 0, closeDelay: 30 },
			innerCard: { delay: 0, closeDelay: 30 }
		});
		await openBoth();
		await leave(wrapperOf('Outer body'));
		await enter(wrapperOf('Inner body'));
		await sleep(100);

		await leave(wrapperOf('Inner body'));
		await enter(wrapperOf('Outer body'));
		await waitFor(() => expect(card('Inner body')).toBeNull());
		await sleep(120);
		expect(card('Outer body')).toBeInTheDocument();
	});

	test('without a card inside, leaving the outer card closes it as before', async () => {
		await mount({ scenario: 'single', card: { delay: 0, closeDelay: 30 } });
		await enter(trigger('Card trigger'));
		await waitFor(() => expect(card('Card body')).toBeInTheDocument());
		await leave(trigger('Card trigger'));
		await waitFor(() => expect(card('Card body')).toBeNull());
	});

	test('the outer card stays while focus is inside it when the inner card closes', async () => {
		await mount({
			scenario: 'nested',
			card: { delay: 0, closeDelay: 30 },
			innerCard: { delay: 0, closeDelay: 30 }
		});
		await openBoth();
		// Pointer on the inner card, keyboard focus on the inner trigger inside the outer card.
		trigger('Inner trigger').focus();
		await leave(wrapperOf('Outer body'));
		await enter(wrapperOf('Inner body'));
		await sleep(100);
		await leave(wrapperOf('Inner body'));
		await waitFor(() => expect(card('Inner body')).toBeNull());
		await sleep(120);
		expect(card('Outer body')).toBeInTheDocument();
	});
});
