import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import SelectHarness from './SelectHarness.test.svelte';

const items = [
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

const scrollIntoView = Element.prototype.scrollIntoView;
const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')!;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
	Object.defineProperty(Element.prototype, 'scrollHeight', scrollHeight);
});

/**
 * The nodes a listbox owns in the accessibility tree, following axe's aria-required-children:
 * hidden subtrees are skipped, an element with no role (or a presentational one), no tabindex and
 * no name is transparent, and a group is entered so its options are listed too.
 */
const ownedRoles = (listbox: Element) => {
	const roles: (string | null)[] = [];
	const visit = (element: Element) => {
		for (const child of Array.from(element.children)) {
			if (child.getAttribute('aria-hidden') === 'true' || child.hasAttribute('hidden')) continue;
			const role = child.getAttribute('role');
			const transparent =
				(!role || role === 'presentation' || role === 'none') &&
				!child.hasAttribute('tabindex') &&
				!child.hasAttribute('aria-label') &&
				!child.hasAttribute('aria-labelledby');
			if (transparent) {
				visit(child);
				continue;
			}
			roles.push(role);
			if (role === 'group') visit(child);
		}
	};
	visit(listbox);
	return roles;
};

const open = async () => {
	await fireEvent.click(screen.getByRole('combobox', { name: 'Produce' }));
	return screen.findByRole('listbox');
};

describe('Select listbox structure', () => {
	test('a11y:select.popup-wrapper the listbox is not announced inside an unnamed dialog', async () => {
		render(SelectHarness, { props: { label: 'Produce', items } });
		const listbox = await open();

		expect(listbox.closest('dialog')).toBeNull();
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('a11y:select.listbox-children owns only groups and options', async () => {
		render(SelectHarness, { props: { label: 'Produce', items } });
		const listbox = await open();

		expect(ownedRoles(listbox)).toEqual(['group', 'option', 'option', 'group', 'option', 'option']);
		// The divider between the two groups is decorative.
		expect(listbox.querySelector('[role="separator"]')).toBeNull();
		expect(listbox.querySelectorAll('[role="presentation"]').length).toBeGreaterThan(0);
	});

	test('a11y:select.listbox-children bare options are listed straight under the listbox', async () => {
		render(SelectHarness, {
			props: {
				label: 'Produce',
				items: [
					{ value: 'apple', label: 'Apple' },
					{ value: 'banana', label: 'Banana' }
				]
			}
		});
		const listbox = await open();

		// No unlabelled group wraps a flat list.
		expect(ownedRoles(listbox)).toEqual(['option', 'option']);
		expect(listbox.querySelector('[role="group"]')).toBeNull();
	});

	test('the listbox is the scroll viewport: no extra scroll group, tab stop or scrollbar', async () => {
		Object.defineProperty(Element.prototype, 'scrollHeight', {
			configurable: true,
			get: () => 400
		});
		render(SelectHarness, { props: { label: 'Produce', items } });
		const listbox = await open();

		// type="auto" renders the scrollbar once the overflow is measured.
		await waitFor(() =>
			expect(document.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull()
		);
		expect(listbox).toHaveAttribute('data-scroll-area-viewport');
		expect(listbox).toHaveAttribute('tabindex', '-1');
		expect(listbox).toHaveAttribute('aria-label', 'Options');
		expect(ownedRoles(listbox)).toEqual(['group', 'option', 'option', 'group', 'option', 'option']);
		expect(screen.queryByRole('group', { name: 'Scrollable content' })).toBeNull();
		expect(screen.queryByRole('scrollbar')).toBeNull();
		// The scrollbar is a pointer-only affordance, outside the listbox and hidden from the tree.
		const scrollbar = document.querySelector('[data-slot="scroll-area-scrollbar"]')!;
		expect(scrollbar).toHaveAttribute('aria-hidden', 'true');
		expect(listbox.contains(scrollbar)).toBe(false);
	});
});

describe('Select native form value', () => {
	const formData = () => new FormData(screen.getByTestId('form') as HTMLFormElement);

	test('submits the selected value through its hidden input', () => {
		render(SelectHarness, {
			props: { label: 'Produce', items, name: 'produce', defaultValue: 'leek' }
		});

		expect(formData().get('produce')).toBe('leek');
	});

	test('leaves a disabled Select out of the form data', () => {
		render(SelectHarness, {
			props: { label: 'Produce', items, name: 'produce', defaultValue: 'leek', disabled: true }
		});

		expect(formData().has('produce')).toBe(false);
		expect(document.querySelector('input[type="hidden"][name="produce"]')).toBeDisabled();
	});
});
