import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import AutocompleteHarness from './AutocompleteHarness.test.svelte';
import type { AutocompleteItems } from './autocomplete.props.js';

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

const fruits = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Éclair'];

const mount = (props: Record<string, unknown> = {}) =>
	render(AutocompleteHarness, { props: { items: fruits, ...props } });
const input = () => screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
const form = () => screen.getByTestId('form') as HTMLFormElement;
const value = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null');
const optionLabels = () =>
	screen.queryAllByRole('option').map((option) => option.textContent?.trim());
// Types by setting the whole text, as the browser reports it, with the caret at the end.
const typeText = async (text: string, inputType = 'insertText') => {
	input().focus();
	input().value = text;
	input().setSelectionRange(text.length, text.length);
	await fireEvent(input(), new InputEvent('input', { bubbles: true, inputType }));
};
const key = (name: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(input(), { key: name, ...init });
const selection = () => [input().selectionStart, input().selectionEnd];
const active = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '');

describe('Autocomplete value', () => {
	test('the value is the typed text, and onValueChange reports each edit once', async () => {
		const onValueChange = vi.fn();
		mount({ onValueChange });
		expect(value()).toBeNull();
		await typeText('ban');
		expect(value()).toBe('ban');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ban');
		await typeText('bana');
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange).toHaveBeenLastCalledWith('bana');
	});

	test('defaultValue fills the input once; a parent value change shows without echoing', async () => {
		const onValueChange = vi.fn();
		mount({ defaultValue: 'Kiwi', externalValue: 'Plum', onValueChange });
		expect(input().value).toBe('Kiwi');
		await fireEvent.click(screen.getByRole('button', { name: 'External change' }));
		expect(input().value).toBe('Plum');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('free text is kept when focus leaves, whether or not it matches a suggestion', async () => {
		mount();
		await typeText('Banan');
		await waitFor(() => expect(optionLabels()).toEqual(['Banana']));
		input().blur();
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		expect(input().value).toBe('Banan');
		expect(value()).toBe('Banan');
		input().focus();
		await typeText('Dragon fruit');
		input().blur();
		expect(value()).toBe('Dragon fruit');
	});
});

describe('Autocomplete native form submission', () => {
	test('the input submits the text under its name', async () => {
		mount({ name: 'fruit' });
		await typeText('Banan');
		expect(new FormData(form()).get('fruit')).toBe('Banan');
		expect(input()).toHaveAttribute('name', 'fruit');
		await fireEvent.click(await screen.findByRole('option', { name: /Banana/ }));
		expect(new FormData(form()).getAll('fruit')).toEqual(['Banana']);
	});

	test('a disabled autocomplete and one without a name submit nothing', () => {
		const { unmount } = mount({ name: 'fruit', defaultValue: 'Apple', disabled: true });
		expect([...new FormData(form()).keys()]).toEqual([]);
		unmount();
		mount({ defaultValue: 'Apple' });
		expect([...new FormData(form()).keys()]).toEqual([]);
	});

	test('required blocks a native submit while empty', async () => {
		mount({ name: 'fruit', required: true });
		expect(input().required).toBe(true);
		expect(form().checkValidity()).toBe(false);
		await typeText('Kiwi');
		expect(form().checkValidity()).toBe(true);
	});

	test('a native reset returns the text it mounted with', async () => {
		mount({ name: 'fruit', defaultValue: 'Apple' });
		await typeText('Cherr');
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		await waitFor(() => expect(input().value).toBe('Apple'));
		expect(value()).toBe('Apple');
	});
});

describe('Autocomplete suggestions', () => {
	test('opens as you type and narrows static suggestions, ignoring case and accents', async () => {
		mount();
		expect(input()).toHaveAttribute('aria-expanded', 'false');
		await typeText('ECLAIR');
		await waitFor(() => expect(optionLabels()).toEqual(['Éclair']));
		expect(input()).toHaveAttribute('aria-expanded', 'true');
	});

	test('accepts options, strings and groups together', async () => {
		const items: AutocompleteItems = [
			'Plain',
			{ value: 'rich', label: 'Rich', description: 'With a description' },
			{ label: 'Group', items: ['Inside', { value: 'x', label: 'Object inside' }] }
		];
		mount({ items, openOnFocus: true });
		input().focus();
		await waitFor(() => expect(optionLabels()).toHaveLength(4));
		expect(within(screen.getByRole('listbox')).getByRole('group')).toHaveAttribute(
			'aria-label',
			'Group'
		);
	});

	test('openOnFocus lists every suggestion on focus', async () => {
		mount({ openOnFocus: true });
		input().focus();
		await waitFor(() => expect(optionLabels()).toEqual(fruits));
	});

	test('limit caps the list and a custom filter replaces the match', async () => {
		mount({
			limit: 2,
			filter: (option: { label: string }, query: string) => option.label.startsWith(query)
		});
		await typeText('A');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Apricot']));
		await typeText('Ap');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Apricot']));
		await typeText('pple');
		await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
	});

	test('shouldFilter off shows every suggestion for any text', async () => {
		mount({ shouldFilter: false });
		await typeText('zzz');
		await waitFor(() => expect(optionLabels()).toEqual(fruits));
	});

	test('choosing a suggestion fills the label, closes the list and reports onSelect', async () => {
		const onSelect = vi.fn();
		const onValueChange = vi.fn();
		mount({
			items: [{ value: 'b-1', label: 'Banana', data: { id: 7 } }],
			onSelect,
			onValueChange
		});
		await typeText('ban');
		await fireEvent.click(await screen.findByRole('option', { name: /Banana/ }));
		expect(value()).toBe('Banana');
		expect(input().value).toBe('Banana');
		expect(document.activeElement).toBe(input());
		expect(onValueChange).toHaveBeenLastCalledWith('Banana');
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				value: 'Banana',
				item: expect.objectContaining({ value: 'b-1', data: { id: 7 } })
			})
		);
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('a plain-text suggestion reaches onSelect as an option', async () => {
		const onSelect = vi.fn();
		mount({ onSelect });
		await typeText('Che');
		await fireEvent.click(await screen.findByRole('option', { name: /Cherry/ }));
		expect(onSelect.mock.calls[0][0].item).toEqual({ value: 'Cherry', label: 'Cherry' });
	});

	test('a11y:autocomplete.aria is a list-autocomplete combobox wired to its listbox', async () => {
		mount();
		expect(input()).toHaveAttribute('aria-autocomplete', 'list');
		expect(input()).toHaveAttribute('aria-haspopup', 'listbox');
		await typeText('a');
		const listbox = await screen.findByRole('listbox');
		expect(input()).toHaveAttribute('aria-controls', listbox.id);
	});

	test('a11y:autocomplete.aria-autocomplete follows the mode', () => {
		for (const mode of ['list', 'both', 'inline', 'none']) {
			const { unmount } = mount({ mode });
			expect(input()).toHaveAttribute('aria-autocomplete', mode);
			unmount();
		}
	});
});

describe('Autocomplete keyboard', () => {
	test('a11y:autocomplete.enter-keeps-text leaves Enter to the form when nothing is highlighted', async () => {
		mount();
		await typeText('Dragon');
		const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		input().dispatchEvent(enter);
		expect(enter.defaultPrevented).toBe(false);
		expect(value()).toBe('Dragon');
	});

	test('arrows highlight, Enter chooses the highlighted suggestion', async () => {
		mount();
		await typeText('a');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Apricot', 'Banana', 'Éclair']));
		// Without autoHighlight nothing is highlighted yet.
		expect(input().getAttribute('aria-activedescendant')).toBeFalsy();
		await key('ArrowDown');
		await waitFor(() => expect(active()).toHaveTextContent('Apple'));
		await key('ArrowDown');
		await waitFor(() => expect(active()).toHaveTextContent('Apricot'));
		await key('Enter');
		expect(value()).toBe('Apricot');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('autoHighlight highlights the first match, so Enter chooses it', async () => {
		mount({ autoHighlight: true });
		await typeText('ch');
		await waitFor(() => expect(active()).toHaveTextContent('Cherry'));
		await key('Enter');
		expect(value()).toBe('Cherry');
	});

	test('a11y:autocomplete.keyboard Escape closes the list and keeps the text; a second Escape clears it', async () => {
		mount();
		await typeText('an');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		await key('Escape');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		expect(input().value).toBe('an');
		expect(document.activeElement).toBe(input());
		await key('Escape');
		expect(input().value).toBe('');
		expect(value()).toBe('');
	});

	test('ArrowDown opens a closed list with every suggestion', async () => {
		mount();
		input().focus();
		await key('ArrowDown');
		await waitFor(() => expect(optionLabels()).toEqual(fruits));
	});

	test('Home and End stay on the caret instead of jumping through the list', async () => {
		mount({ openOnFocus: true });
		input().focus();
		await waitFor(() => expect(optionLabels()).toHaveLength(5));
		const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
		input().dispatchEvent(end);
		expect(end.defaultPrevented).toBe(false);
		expect(input().getAttribute('aria-activedescendant')).toBeFalsy();
	});

	test('onOpenChange runs before the change and can cancel it', async () => {
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open) details.cancel();
		});
		mount({ onOpenChange });
		await typeText('an');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'input-change' })
		);
		await key('Escape');
		expect(input()).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('Autocomplete modes', () => {
	test('list mode never rewrites the text while you browse', async () => {
		mount({ mode: 'list' });
		await typeText('a');
		await key('ArrowDown');
		await key('ArrowDown');
		expect(input().value).toBe('a');
		expect(value()).toBe('a');
	});

	test('a11y:autocomplete.inline-completion previews the highlighted suggestion and restores the typed text on Escape', async () => {
		mount({ mode: 'both' });
		await typeText('a');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Apricot', 'Banana', 'Éclair']));
		await key('ArrowDown');
		await waitFor(() => expect(input().value).toBe('apple'));
		// The part that was not typed is selected, so the next key replaces it.
		expect(selection()).toEqual([1, 5]);
		// The value is still what was typed: nothing is committed by previewing.
		expect(value()).toBe('a');
		await key('ArrowDown');
		await waitFor(() => expect(input().value).toBe('apricot'));
		await key('Escape');
		expect(input().value).toBe('a');
		expect(value()).toBe('a');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('both mode with autoHighlight completes as you type', async () => {
		mount({ mode: 'both', autoHighlight: true });
		await typeText('ap');
		await waitFor(() => expect(input().value).toBe('apple'));
		expect(selection()).toEqual([2, 5]);
		expect(value()).toBe('ap');
		// Typing the next letter replaces the selected completion.
		await typeText('apr');
		await waitFor(() => expect(input().value).toBe('apricot'));
		expect(selection()).toEqual([3, 7]);
	});

	test('a suggestion that does not continue the text is previewed only by keys', async () => {
		mount({ mode: 'both', autoHighlight: true, items: ['Mango', 'Orange'] });
		await typeText('ang');
		await waitFor(() => expect(active()).toHaveTextContent('Mango'));
		// Mango contains the text but does not start with it: not completed on its own.
		expect(input().value).toBe('ang');
		await key('ArrowDown');
		await waitFor(() => expect(input().value).toBe('Orange'));
	});

	test('deleting the completion does not bring it back', async () => {
		mount({ mode: 'both', autoHighlight: true });
		await typeText('ap');
		await waitFor(() => expect(input().value).toBe('apple'));
		// Backspace on the selected completion leaves the typed text.
		await key('Backspace');
		input().value = 'ap';
		input().setSelectionRange(2, 2);
		await fireEvent(
			input(),
			new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' })
		);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(input().value).toBe('ap');
		// Deleting a typed letter does not complete the shorter text either.
		await typeText('a', 'deleteContentBackward');
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(input().value).toBe('a');
		// Typing again completes.
		await typeText('ap');
		await waitFor(() => expect(input().value).toBe('apple'));
	});

	test('Enter chooses the previewed suggestion', async () => {
		mount({ mode: 'both', autoHighlight: true });
		await typeText('che');
		await waitFor(() => expect(input().value).toBe('cherry'));
		await key('Enter');
		expect(value()).toBe('Cherry');
		expect(input().value).toBe('Cherry');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('moving the caret accepts the completion as typed text', async () => {
		mount({ mode: 'both', autoHighlight: true });
		await typeText('ban');
		await waitFor(() => expect(input().value).toBe('banana'));
		await key('ArrowRight');
		expect(value()).toBe('banana');
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(input().value).toBe('banana');
	});

	test('blur puts the typed text back so a native submit sends what was typed', async () => {
		mount({ mode: 'both', autoHighlight: true, name: 'fruit' });
		await typeText('ban');
		await waitFor(() => expect(input().value).toBe('banana'));
		input().blur();
		await waitFor(() => expect(input().value).toBe('ban'));
		expect(new FormData(form()).get('fruit')).toBe('ban');
	});

	test('inline mode lists every suggestion and still previews the highlighted one', async () => {
		mount({ mode: 'inline', autoHighlight: true });
		await typeText('ch');
		await waitFor(() => expect(optionLabels()).toEqual(fruits));
		// The first suggestion is Apple, which does not continue the text, so nothing is previewed.
		expect(input().value).toBe('ch');
		await key('ArrowDown');
		await key('ArrowDown');
		await key('ArrowDown');
		await waitFor(() => expect(input().value).toBe('cherry'));
	});

	test('none mode lists every suggestion and never rewrites the text', async () => {
		mount({ mode: 'none', autoHighlight: true });
		await typeText('zzz');
		await waitFor(() => expect(optionLabels()).toEqual(fruits));
		await key('ArrowDown');
		await key('ArrowDown');
		expect(input().value).toBe('zzz');
	});

	test('a11y:autocomplete.readonly browses but never previews or changes', async () => {
		const onValueChange = vi.fn();
		mount({ mode: 'both', readOnly: true, defaultValue: 'Ap', onValueChange });
		input().focus();
		expect(input()).toHaveAttribute('readonly');
		await key('ArrowDown');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Apricot']));
		await key('ArrowDown');
		await key('Enter');
		await fireEvent.click(screen.getByRole('option', { name: /Apricot/ }));
		expect(input().value).toBe('Ap');
		expect(value()).toBe('Ap');
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('Autocomplete async suggestions', () => {
	const deferred = <T>() => {
		let resolve!: (value: T) => void;
		const promise = new Promise<T>((res) => {
			resolve = res;
		});
		return { promise, resolve };
	};

	test('calls the function with the text and a signal; a newer text aborts the older request', async () => {
		const requests: {
			query: string;
			signal: AbortSignal;
			ready: ReturnType<typeof deferred<string[]>>;
		}[] = [];
		const items = (query: string, { signal }: { signal: AbortSignal }) => {
			const ready = deferred<string[]>();
			requests.push({ query, signal, ready });
			return ready.promise;
		};
		mount({ items });
		await typeText('a');
		await waitFor(() => expect(requests).toHaveLength(1));
		expect(requests[0].query).toBe('a');
		await typeText('ap');
		await waitFor(() => expect(requests).toHaveLength(2));
		expect(requests[0].signal.aborted).toBe(true);
		expect(requests[1].signal.aborted).toBe(false);
		requests[1].ready.resolve(['Apple']);
		await waitFor(() => expect(optionLabels()).toEqual(['Apple']));
		// The older response arrives late and must not replace the newer list.
		requests[0].ready.resolve(['Banana']);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(optionLabels()).toEqual(['Apple']);
	});

	test('an async result is not narrowed again, and choosing one fills its label', async () => {
		mount({ items: async () => [{ value: 'id-9', label: 'Server suggestion' }] });
		await typeText('zzz');
		const option = await screen.findByRole('option', { name: /Server suggestion/ });
		await fireEvent.click(option);
		expect(value()).toBe('Server suggestion');
	});

	test('a rejected request shows its message beside the listbox', async () => {
		mount({ items: () => Promise.reject(new Error('Offline')) });
		await typeText('a');
		const message = await screen.findByText('Offline');
		expect(message.closest('[role="listbox"]')).toBeNull();
		expect(input()).toHaveAttribute('aria-invalid', 'true');
	});

	test('a11y:autocomplete.live-region persists and announces the result count', async () => {
		mount();
		const region = document.querySelector('[role="status"][aria-live="polite"]');
		expect(region).not.toBeNull();
		expect(region).toHaveTextContent('');
		await typeText('ap');
		await waitFor(() => expect(region).toHaveTextContent('2 results available'), {
			timeout: 2000
		});
		await typeText('zzz');
		await waitFor(() => expect(region).toHaveTextContent('No options found'), { timeout: 2000 });
	});

	test('emptyText and loadingText replace the catalog messages', async () => {
		mount({ emptyText: 'Nothing like that' });
		await typeText('zzz');
		expect(await screen.findByText('Nothing like that')).toBeInTheDocument();
	});
});
