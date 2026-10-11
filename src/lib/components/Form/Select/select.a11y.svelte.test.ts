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
	test('a11y:select.listbox-children owns only groups and options', async () => {
		render(SelectHarness, { props: { label: 'Produce', items } });
		const listbox = await open();

		expect(ownedRoles(listbox)).toEqual(['group', 'option', 'option', 'group', 'option', 'option']);
		// The divider between the two groups is decorative.
		expect(listbox.querySelector('[role="separator"]')).toBeNull();
		expect(listbox.querySelectorAll('[role="presentation"]').length).toBeGreaterThan(0);
	});

	test('adds no scroll group, tab stop or scrollbar to an overflowing list', async () => {
		Object.defineProperty(Element.prototype, 'scrollHeight', {
			configurable: true,
			get: () => 400
		});
		render(SelectHarness, { props: { label: 'Produce', items } });
		const listbox = await open();

		// type="auto" renders the scrollbar once the overflow is measured.
		await waitFor(() =>
			expect(listbox.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull()
		);
		expect(ownedRoles(listbox)).toEqual(['group', 'option', 'option', 'group', 'option', 'option']);
		const viewport = listbox.querySelector('[data-scroll-area-viewport]')!;
		expect(viewport).not.toHaveAttribute('tabindex');
		expect(viewport).not.toHaveAttribute('aria-label');
		expect(screen.queryByRole('scrollbar')).toBeNull();
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
