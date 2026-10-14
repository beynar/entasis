import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import SelectHarness from './SelectHarness.test.svelte';
import type { SelectItems } from './select.props.js';

const scrollIntoView = Element.prototype.scrollIntoView;
const animate = Element.prototype.animate;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	// A closing popover waits for its exit animation: finish every animation on the next tick.
	Element.prototype.animate = function entasisFiniteAnimate() {
		const animation = {
			onfinish: null as null | (() => void),
			oncancel: null,
			cancel() {},
			finish() {},
			play() {},
			pause() {},
			finished: Promise.resolve()
		};
		setTimeout(() => animation.onfinish?.(), 0);
		return animation as unknown as Animation;
	};
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	Element.prototype.animate = animate;
});

const fruits = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'cherry', label: 'Cherry' },
	{ value: 'durian', label: 'Durian', disabled: true }
];

const countries = [
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'us', label: 'United States' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'ci', label: 'Côte d’Ivoire' }
];

const grouped: SelectItems = [
	{
		label: 'Fruit',
		items: [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' }
		]
	},
	{
		label: 'Vegetables',
		items: [
			{ value: 'carrot', label: 'Carrot' },
			{ value: 'leek', label: 'Leek' }
		]
	}
];

type Props = Record<string, unknown>;
const mount = (props: Props = {}) =>
	render(SelectHarness, { props: { label: 'Fruit', items: fruits, ...props } as never });
const trigger = (name = 'Fruit') => screen.getByRole('combobox', { name }) as HTMLButtonElement;
const form = () => screen.getByTestId('form') as HTMLFormElement;
const value = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null');
const key = (name: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(trigger(), { key: name, ...init });
// `as const` data type-checks as items.
const constItems = [
	{ value: 'a', label: 'A' },
	{ label: 'Group', items: [{ value: 'b', label: 'B' }] }
] as const;
const typedConstItems: SelectItems = constItems;
const typeText = async (text: string) => {
	for (const character of text) await key(character);
};
// The typeahead forgets what was typed after a second of silence.
const searchOver = () => new Promise((resolve) => setTimeout(resolve, 1050));
const highlighted = () => {
	const id = trigger().getAttribute('aria-activedescendant');
	return id ? document.getElementById(id)?.textContent?.trim() : undefined;
};
const open = async () => {
	await fireEvent.click(trigger());
	return screen.findByRole('listbox');
};
const expanded = () => trigger().getAttribute('aria-expanded');
const option = (name: string | RegExp) => screen.getByRole('option', { name });

describe('Select typeahead (SC-2)', () => {
	test('a11y:select.typeahead Space continues a search instead of choosing the highlighted option', async () => {
		const onValueChange = vi.fn();
		mount({ items: countries, onValueChange });
		await open();
		await waitFor(() => expect(highlighted()).toBe('United Kingdom'));

		await typeText('united s');

		expect(highlighted()).toBe('United States');
		expect(expanded()).toBe('true');
		expect(onValueChange).not.toHaveBeenCalled();
		// Once the search is over, Space chooses as before.
		await searchOver();
		await key(' ');
		await waitFor(() => expect(value()).toBe('us'));
	});

	test('typing on a closed trigger picks the match without opening, with one callback', async () => {
		const onValueChange = vi.fn();
		mount({ onValueChange });
		trigger().focus();

		await key('b');

		expect(value()).toBe('banana');
		expect(expanded()).toBe('false');
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('banana');
	});

	test('repeating a letter on a closed trigger cycles through the matches', async () => {
		mount({
			items: [
				{ value: 'be', label: 'Beet' },
				{ value: 'br', label: 'Broccoli' },
				{ value: 'ca', label: 'Carrot' }
			]
		});
		trigger().focus();
		await key('b');
		expect(value()).toBe('be');
		await searchOver();
		await key('b');
		expect(value()).toBe('br');
	});

	test('skips disabled options', async () => {
		mount({ items: [{ value: 'x', label: 'Dud', disabled: true }, ...fruits] });
		trigger().focus();
		await key('d');
		expect(value()).toBeNull();
	});

	test('the typed text is forgotten when the list closes', async () => {
		mount();
		await open();
		await waitFor(() => expect(highlighted()).toBe('Apple'));
		await key('b');
		expect(highlighted()).toBe('Banana');
		await key('Escape');
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

		await open();
		await waitFor(() => expect(highlighted()).toBe('Apple'));
		// A buffer of "bc" would match nothing and leave the highlight on Apple.
		await key('c');
		expect(highlighted()).toBe('Cherry');
	});

	test('a closed read-only Select does not pick by typing', async () => {
		mount({ readOnly: true });
		trigger().focus();
		await key('b');
		expect(value()).toBeNull();
	});
});

describe('Select label (SC-3)', () => {
	test('clicking the label focuses the trigger without opening the list', async () => {
		mount();
		await fireEvent.click(screen.getByText('Fruit'));

		expect(trigger()).toHaveFocus();
		expect(expanded()).toBe('false');
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});

describe('Select listbox (SC-1c)', () => {
	test('the scrolling viewport is the listbox, and its bare options need no group', async () => {
		mount();
		const listbox = await open();

		expect(listbox).toHaveAttribute('data-scroll-area-viewport');
		expect(listbox).toHaveAttribute('tabindex', '-1');
		expect(listbox).toHaveAttribute('id', trigger().getAttribute('aria-controls'));
		expect(screen.queryByRole('group')).toBeNull();
		expect(screen.getAllByRole('option')).toHaveLength(4);
		for (const optionElement of screen.getAllByRole('option')) {
			expect(optionElement.closest('[role="listbox"]')).toBe(listbox);
		}
	});

	test('labelled sets stay named groups', async () => {
		mount({ items: grouped });
		await open();

		expect(screen.getByRole('group', { name: 'Fruit' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Vegetables' })).toBeInTheDocument();
	});
});

describe('Select read-only (SC-4)', () => {
	test('a11y:select.read-only opens and browses, but nothing can be chosen', async () => {
		const onValueChange = vi.fn();
		mount({ readOnly: true, defaultValue: 'banana', onValueChange });

		expect(trigger()).toHaveAttribute('aria-readonly', 'true');
		expect(trigger()).toHaveAttribute('data-readonly');
		const listbox = await open();
		expect(expanded()).toBe('true');
		// aria-readonly belongs to the combobox, not to the popup.
		expect(listbox).not.toHaveAttribute('aria-readonly');
		await waitFor(() => expect(highlighted()).toBe('Banana'));

		await key('ArrowDown');
		expect(highlighted()).toBe('Cherry');
		await key('Enter');
		await fireEvent.click(option('Apple'));
		await key(' ');

		expect(value()).toBe('banana');
		expect(onValueChange).not.toHaveBeenCalled();
		// Browsing goes on until Escape.
		expect(expanded()).toBe('true');
		await key('Escape');
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('still submits its value in a native form', () => {
		mount({ readOnly: true, name: 'fruit', defaultValue: 'banana' });
		expect(new FormData(form()).get('fruit')).toBe('banana');
	});

	test('has no clear button', () => {
		mount({ readOnly: true, clearable: true, defaultValue: 'banana' });
		expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
	});
});

describe('Select autofill and native validation (SC-5)', () => {
	const autofill = () =>
		document.querySelector<HTMLInputElement>('input[data-field-hidden-input][autocomplete]')!;
	const fill = async (text: string) => {
		autofill().value = text;
		await fireEvent.change(autofill());
	};

	test('renders a hidden text input a browser can autofill', () => {
		mount({ items: countries, name: 'country', autocomplete: 'country-name' });

		const input = autofill();
		expect(input).toHaveAttribute('autocomplete', 'country-name');
		expect(input).toHaveAttribute('name', 'country');
		expect(input).toHaveAttribute('aria-hidden', 'true');
		expect(input).toHaveAttribute('tabindex', '-1');
	});

	test('a11y:select.autofill matches the filled text by value, then by label, then ignoring case and accents', async () => {
		const onValueChange = vi.fn();
		mount({ items: countries, name: 'country', autocomplete: 'country', onValueChange });

		await fill('ca');
		expect(value()).toBe('ca');
		await fill('United States');
		expect(value()).toBe('us');
		await fill('cote d’ivoire');
		expect(value()).toBe('ci');
		await fill('Atlantis');
		expect(value()).toBe('ci');

		expect(onValueChange.mock.calls.map(([next]) => next)).toEqual(['ca', 'us', 'ci']);
		// Autofill never opens the list.
		expect(expanded()).toBe('false');
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(new FormData(form()).get('country')).toBe('ci');
	});

	test('is ignored while read-only', async () => {
		mount({ items: countries, autocomplete: 'country', readOnly: true, name: 'country' });
		await fill('Canada');
		expect(value()).toBeNull();
	});

	test('a required Select blocks a native submit until it has a value', async () => {
		mount({ items: countries, name: 'country', required: true });

		expect(form().checkValidity()).toBe(false);
		await fireEvent.click(await open().then(() => option('Canada')));
		await waitFor(() => expect(form().checkValidity()).toBe(true));
		expect(new FormData(form()).get('country')).toBe('ca');
	});

	test('a disabled Select is neither submitted nor required', () => {
		mount({ items: countries, name: 'country', required: true, disabled: true });
		expect(form().checkValidity()).toBe(true);
		expect(new FormData(form()).has('country')).toBe(false);
	});
});

describe('Select touch opens (SC-6)', () => {
	const wheel = (target: EventTarget) => {
		const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, composed: true });
		target.dispatchEvent(event);
		return event;
	};
	const listRoot = () => screen.getByRole('listbox').closest('[data-slot="scroll-area"]')!;

	test('a mouse open is item-aligned: the page holds still and the list has no dropdown cap', async () => {
		mount();
		await fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
		await fireEvent.click(trigger(), { detail: 1 });
		await screen.findByRole('listbox');

		expect(listRoot().className).not.toContain('max-h-[min(240px');
		expect(wheel(document.body).defaultPrevented).toBe(true);
	});

	test('a11y:select.touch-dropdown a touch open is a dropdown: capped list, page scroll left alone', async () => {
		mount();
		await fireEvent.pointerDown(trigger(), { pointerType: 'touch' });
		await fireEvent.click(trigger(), { detail: 1 });
		await screen.findByRole('listbox');

		expect(listRoot().className).toContain('max-h-[min(240px');
		expect(wheel(document.body).defaultPrevented).toBe(false);
	});

	test('a tap whose click reports a mouse pointer (WebKit) is still a touch open', async () => {
		const onOpenChange = vi.fn();
		mount({ onOpenChange });
		await fireEvent.pointerDown(trigger(), { pointerType: 'touch' });
		trigger().dispatchEvent(
			new PointerEvent('click', {
				bubbles: true,
				cancelable: true,
				pointerType: 'mouse',
				detail: 1
			})
		);
		await screen.findByRole('listbox');

		expect(listRoot().className).toContain('max-h-[min(240px');
		expect(onOpenChange.mock.calls[0][1]).toMatchObject({ interaction: 'touch' });
	});

	test('the next keyboard open aligns again', async () => {
		mount();
		await fireEvent.pointerDown(trigger(), { pointerType: 'touch' });
		await fireEvent.click(trigger(), { detail: 1 });
		await screen.findByRole('listbox');
		await key('Escape');
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

		await key('ArrowDown');
		await screen.findByRole('listbox');
		expect(listRoot().className).not.toContain('max-h-[min(240px');
	});

	test('reports the touch interaction to onOpenChange', async () => {
		const onOpenChange = vi.fn();
		mount({ onOpenChange });
		await fireEvent.pointerDown(trigger(), { pointerType: 'touch' });
		await fireEvent.click(trigger(), { detail: 1 });
		expect(onOpenChange.mock.calls[0][1]).toMatchObject({
			reason: 'trigger-press',
			interaction: 'touch'
		});
	});
});

describe('Select open state (SC-8)', () => {
	test('opens by default with defaultOpen', async () => {
		mount({ defaultOpen: true });
		await screen.findByRole('listbox');
		expect(expanded()).toBe('true');
	});

	test('a11y:select.open-change onOpenChange runs before the change with a reason, and may cancel', async () => {
		const states: string[] = [];
		const onOpenChange = vi.fn((next: boolean, details: { reason: string; cancel: () => void }) => {
			states.push(`${next}:${details.reason}:${expanded()}`);
			if (details.reason === 'escape-key') details.cancel();
		});
		mount({ onOpenChange });

		await fireEvent.click(trigger());
		await screen.findByRole('listbox');
		expect(states).toEqual(['true:trigger-press:false']);

		// A cancelled Escape leaves the list open and the event alone.
		const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		trigger().dispatchEvent(escape);
		expect(states.at(-1)).toBe('false:escape-key:true');
		expect(expanded()).toBe('true');
		expect(escape.defaultPrevented).toBe(false);

		// Choosing an option reports the item press.
		await fireEvent.click(option('Banana'));
		expect(states.at(-1)).toBe('false:item-press:true');
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('arrow keys open with the list-navigation reason', async () => {
		const onOpenChange = vi.fn();
		mount({ onOpenChange });
		trigger().focus();
		await key('ArrowDown');
		expect(onOpenChange.mock.calls[0][0]).toBe(true);
		expect(onOpenChange.mock.calls[0][1]).toMatchObject({
			reason: 'list-navigation',
			interaction: 'keyboard'
		});
	});

	test('a cancelled open leaves the list closed', async () => {
		mount({ onOpenChange: (_open: boolean, details: { cancel: () => void }) => details.cancel() });
		await fireEvent.click(trigger());
		expect(expanded()).toBe('false');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	test('an external open is silent, and the lifecycle callbacks fire once per open and close', async () => {
		const onOpenChange = vi.fn();
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		mount({ onOpenChange, onAfterOpen, onAfterClose });

		await fireEvent.click(screen.getByRole('button', { name: 'External open' }));
		await screen.findByRole('listbox');
		expect(expanded()).toBe('true');
		expect(onOpenChange).not.toHaveBeenCalled();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledTimes(1));
		expect(onAfterClose).not.toHaveBeenCalled();

		await key('Escape');
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledTimes(1));
		expect(onAfterOpen).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledTimes(1);
	});

	test('an externally opened list takes focus, so Escape and an outside press close it', async () => {
		mount();
		const external = screen.getByRole('button', { name: 'External open' });
		await fireEvent.click(external);
		await screen.findByRole('listbox');
		await waitFor(() => expect(document.activeElement).toBe(trigger()));

		await key('Escape');
		await waitFor(() => expect(expanded()).toBe('false'));
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

		// A second external open starts a new session with focus again; focus leaving closes it.
		await fireEvent.click(external);
		await screen.findByRole('listbox');
		await waitFor(() => expect(document.activeElement).toBe(trigger()));
		external.focus();
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('a list open at mount takes focus on the trigger', async () => {
		mount({ defaultOpen: true });
		await screen.findByRole('listbox');
		await waitFor(() => expect(document.activeElement).toBe(trigger()));
		await key('Escape');
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('a touch open followed by an external open is item-aligned again', async () => {
		mount({ defaultValue: 'banana' });
		const popupSide = () =>
			document.querySelector('[data-popup-side]')?.getAttribute('data-popup-side');

		trigger().dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true })
		);
		await fireEvent.click(trigger());
		await screen.findByRole('listbox');
		expect(popupSide()).toBe('bottom');
		await key('Escape');
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

		await fireEvent.click(screen.getByRole('button', { name: 'External open' }));
		await screen.findByRole('listbox');
		expect(popupSide()).toBe('none');
	});

	test('the bindable open state follows the list', async () => {
		mount();
		expect(screen.getByTestId('open')).toHaveTextContent('false');
		await fireEvent.click(trigger());
		await waitFor(() => expect(screen.getByTestId('open')).toHaveTextContent('true'));
		await key('Escape');
		await waitFor(() => expect(screen.getByTestId('open')).toHaveTextContent('false'));
	});

	test('a Select disabled while open closes', async () => {
		const { rerender } = mount();
		await open();
		await rerender({ disabled: true });
		await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
	});
});

describe('Select large lists (SC-9)', () => {
	test('option ids are unique, also for values that sanitise alike', async () => {
		mount({
			items: [
				{ value: 'a.b', label: 'Dot' },
				{ value: 'a_b', label: 'Underscore' },
				{ value: 'a b', label: 'Space' }
			]
		});
		await open();
		const ids = screen.getAllByRole('option').map((element) => element.id);
		expect(new Set(ids).size).toBe(3);
		expect(trigger().getAttribute('aria-activedescendant')).toBe(ids[0]);
	});

	test('a thousand options mount without duplicate ids', async () => {
		const items = Array.from({ length: 1000 }, (_, index) => ({
			value: `item-${index}`,
			label: `Item ${index}`
		}));
		mount({ items });
		await open();
		const ids = screen.getAllByRole('option').map((element) => element.id);
		expect(ids).toHaveLength(1000);
		expect(new Set(ids).size).toBe(1000);
	});

	test('rows keep the MenuOption look', async () => {
		mount({ defaultValue: 'banana' });
		await open();
		const row = option('Banana');
		expect(row).toHaveAttribute('data-size', 'normal');
		expect(row).toHaveAttribute('data-density', 'normal');
		expect(row).toHaveAttribute('aria-selected', 'true');
		expect(row).toHaveAttribute('data-selected', 'true');
		expect(option('Apple')).toHaveAttribute('aria-selected', 'false');
		expect(option('Durian')).toBeDisabled();
		expect(option('Durian')).toHaveAttribute('aria-disabled', 'true');
	});
});

describe('Select id and clearable (SC-10)', () => {
	test('accepts readonly items, as const data included', async () => {
		mount({ items: typedConstItems });
		await open();
		expect(screen.getAllByRole('option').map((element) => element.textContent?.trim())).toEqual([
			'A',
			'B'
		]);
	});

	test('a custom id lands on the trigger, so an external label reaches it', async () => {
		mount({ id: 'fruit-select', externalLabelFor: 'fruit-select', label: undefined });

		expect(trigger('External label')).toHaveAttribute('id', 'fruit-select');
		await fireEvent.click(screen.getByText('External label'));
		expect(trigger('External label')).toHaveFocus();
		// The browser forwards a label's click to the control; it must not open the list.
		expect(trigger('External label')).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('listbox')).toBeNull();
		// An ordinary press afterwards still opens it.
		await fireEvent.click(trigger('External label'));
		await screen.findByRole('listbox');
	});

	test('clearing sets the value to null once and returns focus to the trigger', async () => {
		const onValueChange = vi.fn();
		mount({ clearable: true, defaultValue: 'banana', onValueChange });

		await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

		expect(value()).toBeNull();
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(trigger()).toHaveFocus();
		expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
	});

	test('shows no clear button until something is selected', () => {
		mount({ clearable: true });
		expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
	});
});

describe('Select focus and touch screen readers (SC-21)', () => {
	test('focus moving into the panel keeps the list open', async () => {
		mount();
		await open();
		await fireEvent.blur(trigger(), { relatedTarget: option('Banana') });
		expect(expanded()).toBe('true');
		expect(screen.getByRole('listbox')).toBeInTheDocument();
	});

	test('focus leaving the trigger for the page closes it', async () => {
		mount();
		await open();
		await fireEvent.blur(trigger(), {
			relatedTarget: screen.getByRole('button', { name: 'External change' })
		});
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('focus leaving the panel for the page closes it, back to the trigger does not', async () => {
		mount();
		await open();
		await fireEvent.focusOut(option('Banana'), { relatedTarget: trigger() });
		expect(expanded()).toBe('true');
		await fireEvent.focusOut(option('Banana'), {
			relatedTarget: screen.getByRole('button', { name: 'External change' })
		});
		await waitFor(() => expect(expanded()).toBe('false'));
	});

	test('Escape on a focused option closes the list and returns focus to the trigger', async () => {
		mount();
		await open();
		const row = option('Banana');
		row.focus();
		await fireEvent.keyDown(row, { key: 'Escape' });
		await waitFor(() => expect(expanded()).toBe('false'));
		expect(trigger()).toHaveFocus();
	});

	test('a hidden close button outside the listbox closes it', async () => {
		mount();
		const listbox = await open();
		const close = screen.getByRole('button', { name: 'Close' });
		expect(listbox.contains(close)).toBe(false);
		expect(close).toHaveClass('sr-only');

		await fireEvent.click(close);
		await waitFor(() => expect(expanded()).toBe('false'));
		expect(trigger()).toHaveFocus();
	});
});

describe('Select multiple (SC-7)', () => {
	const checked = () =>
		screen
			.getAllByRole('option')
			.filter((element) => element.getAttribute('aria-selected') === 'true')
			.map((element) => element.textContent?.trim());

	test('a11y:select.multiple toggling keeps the list open and publishes one callback per change', async () => {
		const onValueChange = vi.fn();
		mount({ multiple: true, onValueChange, placeholder: 'Pick fruit' });
		const listbox = await open();
		expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
		expect(trigger()).toHaveTextContent('Pick fruit');

		await fireEvent.click(option('Cherry'));
		await fireEvent.click(option('Apple'));
		expect(value()).toEqual(['apple', 'cherry']);
		expect(expanded()).toBe('true');
		expect(checked()).toEqual(['Apple', 'Cherry']);
		expect(onValueChange.mock.calls).toEqual([[['cherry']], [['apple', 'cherry']]]);

		await fireEvent.click(option('Apple'));
		expect(value()).toEqual(['cherry']);
		expect(trigger()).toHaveTextContent('Cherry');
	});

	test('Enter and Space toggle the highlighted option without closing', async () => {
		mount({ multiple: true });
		await open();
		await waitFor(() => expect(highlighted()).toBe('Apple'));
		await key('Enter');
		await key('ArrowDown');
		await key(' ');
		expect(value()).toEqual(['apple', 'banana']);
		expect(expanded()).toBe('true');
	});

	test('the trigger lists two labels and counts the rest', () => {
		mount({
			multiple: true,
			items: [...fruits.slice(0, 3), { value: 'fig', label: 'Fig' }],
			defaultValue: ['apple', 'banana', 'cherry', 'fig']
		});
		expect(trigger()).toHaveTextContent('Apple, Banana +2');
	});

	test('formatValue shapes the trigger text', () => {
		mount({
			multiple: true,
			defaultValue: ['banana', 'apple'],
			formatValue: (options: { label: string }[]) => `${options.length} fruits`
		});
		expect(trigger()).toHaveTextContent('2 fruits');
	});

	test('the list opens on the first selected option in render order', async () => {
		mount({ multiple: true, items: grouped, defaultValue: ['leek', 'banana'] });
		await open();
		await waitFor(() => expect(highlighted()).toBe('Banana'));
	});

	test('submits one hidden input per value, in item order', async () => {
		mount({ multiple: true, name: 'produce', items: grouped, defaultValue: ['apple'] });
		await open();
		await fireEvent.click(option('Leek'));
		await fireEvent.click(option('Banana'));

		expect(new FormData(form()).getAll('produce')).toEqual(['apple', 'banana', 'leek']);
	});

	test('disabled options cannot be toggled', async () => {
		mount({ multiple: true });
		await open();
		await fireEvent.click(option('Durian'));
		expect(value()).toEqual([]);
	});

	test('a read-only multiple Select keeps its selection', async () => {
		mount({ multiple: true, readOnly: true, defaultValue: ['apple'] });
		await open();
		await fireEvent.click(option('Banana'));
		await fireEvent.click(option('Apple'));
		expect(value()).toEqual(['apple']);
	});

	test('required blocks a native submit while nothing is selected', async () => {
		mount({ multiple: true, required: true, name: 'produce' });
		expect(form().checkValidity()).toBe(false);
		await open();
		await fireEvent.click(option('Banana'));
		await waitFor(() => expect(form().checkValidity()).toBe(true));
	});

	test('clearing empties the selection', async () => {
		const onValueChange = vi.fn();
		mount({ multiple: true, clearable: true, defaultValue: ['apple', 'banana'], onValueChange });
		await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
		expect(value()).toEqual([]);
		expect(onValueChange).toHaveBeenCalledWith([]);
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test('typing moves the highlight; a closed multiple Select does not pick by typing', async () => {
		mount({ multiple: true });
		trigger().focus();
		await key('b');
		expect(value()).toEqual([]);
		expect(expanded()).toBe('false');
		await open();
		await key('c');
		expect(highlighted()).toBe('Cherry');
	});

	test('the value follows the parent', async () => {
		mount({ multiple: true, externalValue: ['cherry'] });
		await fireEvent.click(screen.getByRole('button', { name: 'External change' }));
		expect(trigger()).toHaveTextContent('Cherry');
	});
});
