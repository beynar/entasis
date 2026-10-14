import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import ComboboxHarness from './ComboboxHarness.test.svelte';
import type { ComboboxItems } from './combobox.props.js';

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
afterEach(() => {
	vi.useRealTimers();
});

const fruits = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'cherry', label: 'Cherry' },
	{ value: 'eclair', label: 'Éclair' }
];

const mount = (props: Record<string, unknown> = {}) =>
	render(ComboboxHarness, { props: { items: fruits, ...props } });
const input = () => screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
const form = () => screen.getByTestId('form') as HTMLFormElement;
const value = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null');
const optionLabels = () =>
	screen.queryAllByRole('option').map((option) => option.textContent?.trim());
const type = async (text: string) => {
	input().focus();
	await fireEvent.input(input(), { target: { value: text } });
};
const key = (name: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(input(), { key: name, ...init });

describe('Combobox native form submission', () => {
	test('submits the selected value, never the search text', async () => {
		mount({ name: 'fruit' });
		await type('ban');
		await fireEvent.click(await screen.findByRole('option', { name: /Banana/ }));
		expect(new FormData(form()).get('fruit')).toBe('banana');
		// The search box carries no name of its own.
		expect(input()).not.toHaveAttribute('name');
		await type('che');
		expect(new FormData(form()).getAll('fruit')).toEqual(['banana']);
	});

	test('a disabled combobox and one without a name submit nothing', () => {
		const { unmount } = mount({ name: 'fruit', defaultValue: 'apple', disabled: true });
		expect([...new FormData(form()).keys()]).toEqual([]);
		unmount();
		mount({ defaultValue: 'apple' });
		expect([...new FormData(form()).keys()]).toEqual([]);
	});
});

describe('Combobox open model', () => {
	test('Escape closes the list and keeps focus; a second Escape clears the text', async () => {
		mount();
		await type('an');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		await key('Escape');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		expect(document.activeElement).toBe(input());
		expect(input().value).toBe('an');
		await key('Escape');
		expect(input().value).toBe('');
		expect(document.activeElement).toBe(input());
	});

	test('ArrowDown opens the closed list with every option', async () => {
		mount();
		input().focus();
		expect(input()).toHaveAttribute('aria-expanded', 'false');
		await key('ArrowDown');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Banana', 'Cherry', 'Éclair']));
		expect(input()).toHaveAttribute('aria-expanded', 'true');
		expect(document.activeElement).toBe(input());
	});

	test('openOnFocus lists every option on focus; showAllOnFocus is its alias', async () => {
		const { unmount } = mount({ openOnFocus: true });
		input().focus();
		await waitFor(() => expect(optionLabels()).toHaveLength(4));
		unmount();
		mount({ showAllOnFocus: true });
		input().focus();
		await waitFor(() => expect(optionLabels()).toHaveLength(4));
	});

	test('choosing an option keeps focus on the input and closes the list', async () => {
		mount();
		await type('an');
		await fireEvent.click(await screen.findByRole('option', { name: /Banana/ }));
		expect(value()).toBe('banana');
		expect(document.activeElement).toBe(input());
		expect(input().value).toBe('');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('Clear empties the selection and keeps focus in the input', async () => {
		mount({ defaultValue: 'apple' });
		expect(value()).toBe('apple');
		await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
		expect(value()).toBeNull();
		expect(document.activeElement).toBe(input());
	});

	test('a press on the focused input toggles the list', async () => {
		mount({ openOnFocus: true });
		input().focus();
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		await fireEvent.pointerDown(input());
		await fireEvent.click(input());
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		await fireEvent.pointerDown(input());
		await fireEvent.click(input());
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
	});

	test('onOpenChange runs before the change and can cancel it', async () => {
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open) details.cancel();
		});
		mount({ onOpenChange });
		await type('an');
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'input-change' })
		);
		await key('Escape');
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
		expect(input()).toHaveAttribute('aria-expanded', 'true');
	});

	test('focus leaving the field closes the list', async () => {
		mount({ openOnFocus: true });
		input().focus();
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'true'));
		input().blur();
		await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
		expect(screen.getByTestId('open')).toHaveTextContent('false');
	});

	test('a11y:combobox.listbox-children owns options and groups only', async () => {
		const grouped: ComboboxItems = [
			{ label: 'Berries', items: [{ value: 'straw', label: 'Strawberry' }] },
			{ label: 'Stone', items: [{ value: 'peach', label: 'Peach' }] },
			{ value: 'kiwi', label: 'Kiwi' }
		];
		mount({ items: grouped, openOnFocus: true });
		input().focus();
		const listbox = await screen.findByRole('listbox');
		const roles = new Set<string>();
		const visit = (element: Element) => {
			for (const child of Array.from(element.children)) {
				const role = child.getAttribute('role');
				if (role === 'option' || role === 'group') roles.add(role);
				else if (role && role !== 'presentation') roles.add(`other:${role}`);
				if (role === 'group' || !role || role === 'presentation') visit(child);
			}
		};
		visit(listbox);
		expect([...roles].sort()).toEqual(['group', 'option']);
		expect(
			within(listbox)
				.getAllByRole('group')
				.map((group) => group.getAttribute('aria-label'))
		).toEqual(['Berries', 'Stone']);
	});

	test('a11y:combobox.status-outside-listbox keeps the empty message beside the listbox', async () => {
		mount();
		await type('zzzz');
		const message = await screen.findByText('No options found');
		expect(message.closest('[role="listbox"]')).toBeNull();
		expect(input()).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Combobox highlight', () => {
	test('clearing the text highlights the selected option again', async () => {
		mount({ defaultValue: 'cherry', openOnFocus: true });
		input().focus();
		await waitFor(() => expect(input().getAttribute('aria-activedescendant')).toBeTruthy());
		const active = () => document.getElementById(input().getAttribute('aria-activedescendant')!);
		expect(active()).toHaveTextContent('Cherry');
		await fireEvent.input(input(), { target: { value: 'a' } });
		await waitFor(() => expect(active()).toHaveTextContent('Apple'));
		await fireEvent.input(input(), { target: { value: '' } });
		await waitFor(() => expect(active()).toHaveTextContent('Cherry'));
	});

	test('onHighlightChange reports the value, the reason and the event', async () => {
		const onHighlightChange = vi.fn();
		mount({ onHighlightChange, openOnFocus: true });
		input().focus();
		await waitFor(() =>
			expect(onHighlightChange).toHaveBeenCalledWith(
				expect.objectContaining({ value: 'apple', reason: 'list' })
			)
		);
		await key('ArrowDown');
		const keyboard = onHighlightChange.mock.calls.at(-1)![0];
		expect(keyboard).toMatchObject({ value: 'banana', reason: 'keyboard' });
		expect(keyboard.event).toBeInstanceOf(KeyboardEvent);
		const cherry = await screen.findByRole('option', { name: /Cherry/ });
		await fireEvent.pointerMove(cherry, { clientX: 4, clientY: 4 });
		const pointer = onHighlightChange.mock.calls.at(-1)![0];
		expect(pointer).toMatchObject({ value: 'cherry', reason: 'pointer' });
		expect(pointer.event).toBeInstanceOf(Event);
	});

	test('disabled options are dimmed and skipped by the keyboard', async () => {
		mount({
			items: [
				{ value: 'a', label: 'Alpha' },
				{ value: 'b', label: 'Beta', disabled: true },
				{ value: 'c', label: 'Gamma' }
			],
			openOnFocus: true
		});
		input().focus();
		await screen.findByRole('listbox');
		const active = () => document.getElementById(input().getAttribute('aria-activedescendant')!);
		await waitFor(() => expect(active()).toHaveTextContent('Alpha'));
		await key('ArrowDown');
		await waitFor(() => expect(active()).toHaveTextContent('Gamma'));
		expect(screen.getByRole('option', { name: /Beta/ })).toHaveAttribute('aria-disabled', 'true');
		await fireEvent.click(screen.getByRole('option', { name: /Beta/ }));
		expect(value()).toBeNull();
	});

	test('loop "input" returns to no highlight past the last option', async () => {
		mount({ openOnFocus: true, loop: 'input' });
		input().focus();
		await screen.findByRole('listbox');
		await key('ArrowUp');
		await waitFor(() => expect(input().getAttribute('aria-activedescendant')).toBeFalsy());
	});
});

describe('Combobox filtering', () => {
	test('ignores case and accents, in the active locale', async () => {
		mount();
		await type('ECLAIR');
		await waitFor(() => expect(optionLabels()).toEqual(['Éclair']));
	});

	test('a custom filter replaces the match, and limit caps the list', async () => {
		mount({ filter: (option: { value: string }, query: string) => option.value.startsWith(query) });
		await type('b');
		await waitFor(() => expect(optionLabels()).toEqual(['Banana']));
	});

	test('limit stops matching once reached', async () => {
		const filter = vi.fn(() => true);
		mount({ limit: 2, filter });
		await type('a');
		await waitFor(() => expect(optionLabels()).toEqual(['Apple', 'Banana']));
		expect(filter).toHaveBeenCalledTimes(2);
	});
});

describe('Combobox rows', () => {
	test('values that sanitize to the same text keep distinct ids', async () => {
		mount({
			items: [
				{ value: 'a.b', label: 'Dot' },
				{ value: 'a_b', label: 'Underscore' }
			],
			openOnFocus: true
		});
		input().focus();
		await screen.findByRole('listbox');
		const active = () => document.getElementById(input().getAttribute('aria-activedescendant')!);
		await waitFor(() => expect(active()).toHaveTextContent('Dot'));
		await key('ArrowDown');
		await waitFor(() => expect(active()).toHaveTextContent('Underscore'));
		const ids = screen.getAllByRole('option').map((option) => option.id);
		expect(new Set(ids).size).toBe(2);
	});

	test('an item snippet renders every row', async () => {
		mount({ customItem: true, openOnFocus: true });
		input().focus();
		await screen.findByRole('listbox');
		expect(screen.getAllByTestId('custom-row').map((row) => row.textContent)).toEqual([
			'APPLE',
			'BANANA',
			'CHERRY',
			'ÉCLAIR'
		]);
		await fireEvent.click(screen.getByRole('option', { name: 'BANANA' }));
		expect(value()).toBe('banana');
	});

	test('matching follows the I18n locale: in Turkish, i is not the dotless ı', async () => {
		const items = [
			{ value: 'ist', label: 'İstanbul' },
			{ value: 'ilg', label: 'Ilgaz' }
		];
		const { unmount } = mount({ items, i18n: { locale: 'tr' } });
		await type('i');
		await waitFor(() => expect(optionLabels()).toEqual(['İstanbul']));
		unmount();
		mount({ items, i18n: { locale: 'en' } });
		await type('i');
		await waitFor(() => expect(optionLabels()).toEqual(['İstanbul', 'Ilgaz']));
	});
});

describe('Combobox async items', () => {
	const deferred = <T>() => {
		let resolve!: (value: T) => void;
		let reject!: (reason: Error) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	};

	test('a response that is not the latest is ignored, and the older request is aborted', async () => {
		const requests: {
			query?: string;
			signal: AbortSignal;
			ready: ReturnType<typeof deferred<ComboboxItems>>;
		}[] = [];
		const items = (query: string | undefined, { signal }: { signal: AbortSignal }) => {
			const ready = deferred<ComboboxItems>();
			requests.push({ query, signal, ready });
			return ready.promise;
		};
		mount({ items });
		await type('a');
		await waitFor(() => expect(requests).toHaveLength(1));
		await fireEvent.input(input(), { target: { value: 'ap' } });
		await waitFor(() => expect(requests).toHaveLength(2));
		expect(requests[0].signal.aborted).toBe(true);
		expect(requests[1].signal.aborted).toBe(false);
		requests[1].ready.resolve([{ value: 'apple', label: 'Apple' }]);
		await waitFor(() => expect(optionLabels()).toEqual(['Apple']));
		// The older response arrives late and must not replace the newer list.
		requests[0].ready.resolve([{ value: 'banana', label: 'Banana' }]);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(optionLabels()).toEqual(['Apple']);
		expect(screen.getByTestId('loading')).toHaveTextContent('false');
	});

	test('results stay visible while the next search loads', async () => {
		const pending: ReturnType<typeof deferred<ComboboxItems>>[] = [];
		const items = () => {
			const ready = deferred<ComboboxItems>();
			pending.push(ready);
			return ready.promise;
		};
		mount({ items });
		await type('a');
		await waitFor(() => expect(pending).toHaveLength(1));
		pending[0].resolve([{ value: 'apple', label: 'Apple' }]);
		await waitFor(() => expect(optionLabels()).toEqual(['Apple']));
		await fireEvent.input(input(), { target: { value: 'ap' } });
		await waitFor(() => expect(pending).toHaveLength(2));
		// Loading: the old rows remain, flagged busy, with a status row beside the listbox.
		expect(optionLabels()).toEqual(['Apple']);
		expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByText('Loading...').closest('[role="listbox"]')).toBeNull();
		pending[1].resolve([{ value: 'apple', label: 'Apple' }]);
		await waitFor(() => expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy'));
	});

	test('an error is shown beside the listbox', async () => {
		mount({
			items: () => Promise.reject(new Error('Boom'))
		});
		await type('a');
		const message = await screen.findByText('Boom');
		expect(message.closest('[role="listbox"]')).toBeNull();
		expect(input()).toHaveAttribute('aria-invalid', 'true');
	});

	test('aria-invalid follows the live error: it clears once the text is emptied and the list closes', async () => {
		mount({ items: () => Promise.reject(new Error('Boom')) });
		await type('a');
		await screen.findByText('Boom');
		expect(input()).toHaveAttribute('aria-invalid', 'true');
		await fireEvent.input(input(), { target: { value: '' } });
		await waitFor(() => expect(screen.queryByText('Boom')).toBeNull());
		await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'false'));
	});

	test('openOnFocus does not run the items function before the field is focused', async () => {
		const items = vi.fn(async () => fruits);
		mount({ items, openOnFocus: true });
		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(items).not.toHaveBeenCalled();
		expect(screen.getByTestId('loading')).toHaveTextContent('false');
		input().focus();
		await waitFor(() => expect(items).toHaveBeenCalledTimes(1));
		expect(items).toHaveBeenCalledWith('', expect.objectContaining({ signal: expect.anything() }));
	});

	test('an external value change updates the label', async () => {
		const getValueOption = vi.fn((optionValue: string) => ({
			value: optionValue,
			label: optionValue === 'pear' ? 'Pear' : 'Plum'
		}));
		mount({ items: async () => [], defaultValue: 'pear', externalValue: 'plum', getValueOption });
		await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Pear'));
		await fireEvent.click(screen.getByRole('button', { name: 'External change' }));
		await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Plum'));
		expect(getValueOption).toHaveBeenLastCalledWith('plum');
	});
});

describe('Combobox live region', () => {
	test('a11y:combobox.live-region exists before the first search and announces result counts', async () => {
		mount();
		const region = document.querySelector('[role="status"][aria-live="polite"]');
		expect(region).not.toBeNull();
		expect(region).toHaveTextContent('');
		await type('an');
		await waitFor(() => expect(region).toHaveTextContent('1 result available'), { timeout: 2000 });
		await type('zzz');
		await waitFor(() => expect(region).toHaveTextContent('No options found'), { timeout: 2000 });
	});
});

describe('Combobox read-only', () => {
	test('a11y:combobox.readonly opens and browses, but keeps the value', async () => {
		const onValueChange = vi.fn();
		mount({ readOnly: true, defaultValue: 'apple', onValueChange });
		input().focus();
		expect(input()).toHaveAttribute('readonly');
		expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
		await key('ArrowDown');
		await waitFor(() => expect(optionLabels()).toHaveLength(4));
		await key('ArrowDown');
		await key('Enter');
		await fireEvent.click(screen.getByRole('option', { name: /Cherry/ }));
		expect(value()).toBe('apple');
		expect(onValueChange).not.toHaveBeenCalled();
		// aria-readonly belongs to the combobox only, never to the popup.
		expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-readonly');
	});
});
