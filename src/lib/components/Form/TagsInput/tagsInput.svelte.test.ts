import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import ComboboxHarness from '../Combobox/ComboboxHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
const animate = Element.prototype.animate;
const getAnimations = Element.prototype.getAnimations;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	// Svelte's flip animation asks the element for running animations.
	Element.prototype.getAnimations = () => [];
	// Exit transitions (a removed tag, a closing list) finish on the next tick.
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
	Element.prototype.getAnimations = getAnimations;
});

const techs = [
	{ value: 'js', label: 'JavaScript' },
	{ value: 'ts', label: 'TypeScript' },
	{ value: 'svelte', label: 'Svelte' }
];

const mount = (props: Record<string, unknown> = {}) =>
	render(ComboboxHarness, { props: { kind: 'tags', items: techs, ...props } });
const input = () => screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
const plainInput = () => screen.getByRole('textbox', { name: 'Fruit' }) as HTMLInputElement;
const value = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null');
const form = () => screen.getByTestId('form') as HTMLFormElement;
const removeButtons = () => screen.queryAllByRole('button', { name: /^Remove / });
const optionLabels = () =>
	screen.queryAllByRole('option').map((option) => option.textContent?.trim());
const type = async (control: HTMLInputElement, text: string) => {
	control.focus();
	await fireEvent.input(control, { target: { value: text } });
};

describe('TagsInput native form submission', () => {
	test('submits one value per tag under the name, never the search text', async () => {
		mount({ name: 'stack', defaultValue: ['js', 'ts'] });
		expect(new FormData(form()).getAll('stack')).toEqual(['js', 'ts']);
		expect(input()).not.toHaveAttribute('name');
		await type(input(), 'sve');
		expect(new FormData(form()).getAll('stack')).toEqual(['js', 'ts']);
	});

	test('free-text tags submit too, and a disabled field submits nothing', async () => {
		const { unmount } = mount({ items: undefined, name: 'tags', defaultValue: ['a', 'b'] });
		expect(new FormData(form()).getAll('tags')).toEqual(['a', 'b']);
		unmount();
		mount({ items: undefined, name: 'tags', defaultValue: ['a', 'b'], disabled: true });
		expect([...new FormData(form()).keys()]).toEqual([]);
	});
});

describe('TagsInput highlight', () => {
	test('Enter adds the typed custom tag instead of the first match', async () => {
		mount({ customTags: true });
		await type(input(), 'Java');
		await waitFor(() => expect(optionLabels()).toEqual(['JavaScript']));
		// Nothing is highlighted on its own, so Enter belongs to the typed text.
		expect(input().getAttribute('aria-activedescendant')).toBeFalsy();
		await fireEvent.keyDown(input(), { key: 'Enter' });
		expect(value()).toEqual(['Java']);
	});

	test('an option the user highlighted by hand still wins over the typed text', async () => {
		mount({ customTags: true });
		await type(input(), 'Java');
		await screen.findByRole('option', { name: /JavaScript/ });
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		await fireEvent.keyDown(input(), { key: 'Enter' });
		expect(value()).toEqual(['js']);
	});

	test('without customTags the first match is highlighted and Enter adds it', async () => {
		mount();
		await type(input(), 'Java');
		await waitFor(() => expect(input().getAttribute('aria-activedescendant')).toBeTruthy());
		await fireEvent.keyDown(input(), { key: 'Enter' });
		expect(value()).toEqual(['js']);
	});

	test('chosen tags leave the list, and keepSearchOnSelect keeps the text', async () => {
		mount({ keepSearchOnSelect: true });
		await type(input(), 'script');
		await waitFor(() => expect(optionLabels()).toEqual(['JavaScript', 'TypeScript']));
		await fireEvent.click(screen.getByRole('option', { name: /JavaScript/ }));
		expect(value()).toEqual(['js']);
		expect(input().value).toBe('script');
		await waitFor(() => expect(optionLabels()).toEqual(['TypeScript']));
		await fireEvent.click(screen.getByRole('option', { name: /TypeScript/ }));
		expect(value()).toEqual(['js', 'ts']);
		expect(input().value).toBe('script');
		expect(document.activeElement).toBe(input());
	});

	test('the text clears after a choice by default', async () => {
		mount();
		await type(input(), 'script');
		await fireEvent.click(await screen.findByRole('option', { name: /JavaScript/ }));
		expect(input().value).toBe('');
		expect(screen.getByTestId('search')).toHaveTextContent('');
	});
});

describe('TagsInput open model', () => {
	test('Escape closes the list and keeps focus; a second Escape clears the text', async () => {
		mount();
		await type(input(), 'script');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		await fireEvent.keyDown(input(), { key: 'Escape' });
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		expect(document.activeElement).toBe(input());
		await fireEvent.keyDown(input(), { key: 'Escape' });
		expect(input().value).toBe('');
		expect(document.activeElement).toBe(input());
	});

	test('free-text mode has no list: Escape clears the draft and Enter adds a tag', async () => {
		mount({ items: undefined });
		await type(plainInput(), 'draft');
		await fireEvent.keyDown(plainInput(), { key: 'Escape' });
		expect(plainInput().value).toBe('');
		expect(document.activeElement).toBe(plainInput());
		await type(plainInput(), 'new');
		await fireEvent.keyDown(plainInput(), { key: 'Enter' });
		expect(value()).toEqual(['new']);
	});

	test('ArrowDown opens the list with the tags that are not chosen yet', async () => {
		mount({ defaultValue: ['js'] });
		input().focus();
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		await waitFor(() => expect(optionLabels()).toEqual(['TypeScript', 'Svelte']));
	});
});

describe('TagsInput tags toolbar', () => {
	test('a11y:tags-input.toolbar removable tags form a labelled toolbar with a single tab stop', async () => {
		mount({ defaultValue: ['js', 'ts', 'svelte'] });
		const toolbar = screen.getByRole('toolbar', { name: 'Tags' });
		const buttons = within(toolbar).getAllByRole('button');
		expect(buttons).toHaveLength(3);
		await waitFor(() =>
			expect(buttons.filter((button) => button.getAttribute('tabindex') === '0')).toHaveLength(1)
		);
		expect(buttons.filter((button) => button.getAttribute('tabindex') === '-1')).toHaveLength(2);
	});

	test('a11y:tags-input.chip-keys ArrowLeft at the start of the text focuses the last tag; arrows move between tags', async () => {
		mount({ defaultValue: ['js', 'ts', 'svelte'] });
		input().focus();
		input().setSelectionRange(0, 0);
		await fireEvent.keyDown(input(), { key: 'ArrowLeft' });
		const [js, ts, svelte] = removeButtons();
		expect(document.activeElement).toBe(svelte);
		await fireEvent.keyDown(svelte, { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(ts);
		await fireEvent.keyDown(ts, { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(js);
		await fireEvent.keyDown(js, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(ts);
		await fireEvent.keyDown(ts, { key: 'ArrowRight' });
		await fireEvent.keyDown(svelte, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(input());
	});

	test('a11y:tags-input.chip-keys-rtl the arrows are mirrored in right-to-left text', async () => {
		mount({ defaultValue: ['js', 'ts', 'svelte'], rtl: true });
		input().focus();
		input().setSelectionRange(0, 0);
		// ArrowLeft points away from the tags in right-to-left text, so it stays in the input.
		await fireEvent.keyDown(input(), { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(input());
		await fireEvent.keyDown(input(), { key: 'ArrowRight' });
		const [js, ts, svelte] = removeButtons();
		expect(document.activeElement).toBe(svelte);
		await fireEvent.keyDown(svelte, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(ts);
		await fireEvent.keyDown(ts, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(js);
		await fireEvent.keyDown(js, { key: 'ArrowLeft' });
		await fireEvent.keyDown(ts, { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(svelte);
		await fireEvent.keyDown(svelte, { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(input());
	});

	test('ArrowLeft with text before the caret stays in the input', async () => {
		mount({ defaultValue: ['js'] });
		await type(input(), 'ab');
		input().setSelectionRange(2, 2);
		await fireEvent.keyDown(input(), { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(input());
	});

	test('a11y:tags-input.remove-keys Backspace and Delete remove the focused tag and move focus to its neighbour', async () => {
		mount({ defaultValue: ['js', 'ts', 'svelte'] });
		const [, ts] = removeButtons();
		ts.focus();
		await fireEvent.keyDown(ts, { key: 'Backspace' });
		expect(value()).toEqual(['js', 'svelte']);
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Svelte' }))
		);
		await fireEvent.keyDown(document.activeElement!, { key: 'Delete' });
		expect(value()).toEqual(['js']);
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove JavaScript' }))
		);
		await fireEvent.keyDown(document.activeElement!, { key: 'Delete' });
		expect(value()).toEqual([]);
		await waitFor(() => expect(document.activeElement).toBe(input()));
	});

	test('a11y:tags-input.remove-click activating a focused remove button (Enter, Space) keeps focus in the field', async () => {
		mount({ defaultValue: ['js', 'ts', 'svelte'] });
		const [, ts] = removeButtons();
		ts.focus();
		// Enter and Space on a button arrive as a click on the focused button.
		await fireEvent.click(ts);
		expect(value()).toEqual(['js', 'svelte']);
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Svelte' }))
		);
		await fireEvent.click(document.activeElement!);
		await fireEvent.click(screen.getByRole('button', { name: 'Remove JavaScript' }));
		expect(value()).toEqual([]);
		await waitFor(() => expect(document.activeElement).toBe(input()));
	});

	test('a mouse click on a remove button does not take focus', async () => {
		mount({ defaultValue: ['js', 'ts'] });
		input().focus();
		await fireEvent.click(removeButtons()[0]);
		expect(value()).toEqual(['ts']);
		expect(document.activeElement).toBe(input());
	});

	test('Backspace in an empty input removes the last tag', async () => {
		mount({ defaultValue: ['js', 'ts'] });
		input().focus();
		await fireEvent.keyDown(input(), { key: 'Backspace' });
		expect(value()).toEqual(['js']);
	});

	test.each([{ disabled: true }, { readOnly: true }])(
		'a11y:tags-input.no-dead-buttons no remove buttons exist when %o, and the tags are a plain list',
		async (state) => {
			mount({ defaultValue: ['js', 'ts'], ...state });
			expect(removeButtons()).toHaveLength(0);
			expect(screen.queryByRole('toolbar')).toBeNull();
			const list = screen.getByRole('list', { name: 'Tags' });
			expect(within(list).getAllByRole('listitem')).toHaveLength(2);
			expect(list).toHaveTextContent('JavaScript');
		}
	);
});

describe('TagsInput read-only', () => {
	test('a11y:tags-input.readonly opens and browses, but cannot add or remove tags', async () => {
		const onValueChange = vi.fn();
		mount({ readOnly: true, defaultValue: ['js'], onValueChange, customTags: true });
		input().focus();
		expect(input()).toHaveAttribute('readonly');
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		await waitFor(() => expect(optionLabels()).toEqual(['TypeScript', 'Svelte']));
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		await fireEvent.keyDown(input(), { key: 'Enter' });
		await fireEvent.click(screen.getByRole('option', { name: /Svelte/ }));
		await fireEvent.keyDown(input(), { key: 'Backspace' });
		expect(value()).toEqual(['js']);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-readonly');
	});
});

describe('TagsInput grouped options', () => {
	test('renders labelled groups and skips disabled options', async () => {
		mount({
			items: [
				{
					label: 'Languages',
					items: [
						{ value: 'js', label: 'JavaScript' },
						{ value: 'ts', label: 'TypeScript', disabled: true }
					]
				},
				{ label: 'Frameworks', items: [{ value: 'svelte', label: 'Svelte' }] }
			],
			openOnFocus: true
		});
		input().focus();
		const listbox = await screen.findByRole('listbox');
		expect(
			within(listbox)
				.getAllByRole('group')
				.map((group) => group.getAttribute('aria-label'))
		).toEqual(['Languages', 'Frameworks']);
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		const active = () => document.getElementById(input().getAttribute('aria-activedescendant')!);
		await waitFor(() => expect(active()).toHaveTextContent('Svelte'));
		expect(screen.getByRole('option', { name: /TypeScript/ })).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	});
});

describe('TagsInput items wiring', () => {
	test('an async items function is aborted when stale, and chosen tags are excluded', async () => {
		const requests: { query?: string; signal: AbortSignal; resolve: () => void }[] = [];
		const items = (query: string | undefined, { signal }: { signal: AbortSignal }) =>
			new Promise<typeof techs>((resolve) => {
				requests.push({
					query,
					signal,
					resolve: () => resolve(techs.filter((tech) => tech.label.includes(query ?? '')))
				});
			});
		mount({ items, defaultValue: ['js'] });
		await type(input(), 'S');
		await waitFor(() => expect(requests).toHaveLength(1));
		await fireEvent.input(input(), { target: { value: 'Sv' } });
		await waitFor(() => expect(requests).toHaveLength(2));
		expect(requests[0].signal.aborted).toBe(true);
		requests[1].resolve();
		await waitFor(() => expect(optionLabels()).toEqual(['Svelte']));
		// The chosen tag never comes back as an option.
		await fireEvent.input(input(), { target: { value: 'J' } });
		await waitFor(() => expect(requests).toHaveLength(3));
		requests[2].resolve();
		await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
	});

	test('async tags keep their label after the options leave the list', async () => {
		mount({
			items: async () => techs,
			getValueOption: (tagValue: string) => techs.find((tech) => tech.value === tagValue)
		});
		await type(input(), 'type');
		await waitFor(() => expect(optionLabels()).toContain('TypeScript'));
		await fireEvent.click(screen.getByRole('option', { name: 'TypeScript' }));
		await waitFor(() => expect(value()).toEqual(['ts']));
		expect(screen.getByRole('button', { name: 'Remove TypeScript' })).toBeInTheDocument();
	});

	test('onHighlightChange reports the value, the reason and the event', async () => {
		const onHighlightChange = vi.fn();
		mount({ onHighlightChange });
		input().focus();
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		await waitFor(() =>
			expect(onHighlightChange).toHaveBeenCalledWith(
				expect.objectContaining({ value: 'js', reason: 'list' })
			)
		);
		await fireEvent.keyDown(input(), { key: 'ArrowDown' });
		const payload = onHighlightChange.mock.calls.at(-1)![0];
		expect(payload).toMatchObject({ value: 'ts', reason: 'keyboard' });
		expect(payload.event).toBeInstanceOf(KeyboardEvent);
	});

	test('a controlled open prop opens the list and reports requested changes', async () => {
		const onOpenChange = vi.fn();
		mount({ open: true, onOpenChange });
		await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
		expect(screen.getByTestId('open')).toHaveTextContent('true');
		expect(input()).toHaveAttribute('aria-expanded', 'true');
	});
});
