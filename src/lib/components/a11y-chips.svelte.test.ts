// Verified feature chips: every docs page claim about ARIA, keyboard, or focus behaviour points
// at one of these tests by its stable id (`a11y:<component>.<law>`), checked by
// tooling/check-feature-chips.mjs. Keep each test small — one claim, one assertion group.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import A11yChipsHarness from './A11yChipsHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
const animate = Element.prototype.animate;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	// The global animate stub never reports completion, so a closing overlay with a real
	// transition would stay in the DOM forever. Finish every animation on the next tick instead.
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

/** Test name = stable id + claim; the id must stay a standalone quoted literal for the chip check. */
const law = (id: string, claim: string) => `${id} ${claim}`;
const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const pressOutside = () => fireEvent.pointerDown(document.body);
const mount = (scenario: Parameters<typeof A11yChipsHarness>[1]['scenario'], props = {}) =>
	render(A11yChipsHarness, { props: { scenario, ...props } });

describe('breadcrumbs', () => {
	test(law('a11y:breadcrumbs.nav-label', 'exposes a labelled navigation landmark'), () => {
		mount('breadcrumbs');
		expect(screen.getByRole('navigation')).toHaveAccessibleName('Breadcrumbs');
	});

	test(law('a11y:breadcrumbs.aria-current', 'marks the active crumb as the current page'), () => {
		mount('breadcrumbs');
		const active = screen.getByText('Electronics').closest('[aria-current]');
		expect(active).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
	});

	test(law('a11y:breadcrumbs.arrow-keys', 'moves focus between crumbs horizontally'), async () => {
		mount('breadcrumbs');
		const home = screen.getByRole('link', { name: 'Home' });
		const products = screen.getByRole('link', { name: 'Products' });
		home.focus();
		await fireEvent.keyDown(home, { key: 'ArrowRight' });
		await waitFor(() => expect(document.activeElement).toBe(products));
		await fireEvent.keyDown(products, { key: 'ArrowLeft' });
		await waitFor(() => expect(document.activeElement).toBe(home));
	});
});

describe('button', () => {
	test(
		law('a11y:button.role-and-label', 'renders a labelled button, or a link when href is set'),
		() => {
			mount('button');
			expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute('aria-label');
			const link = screen.getByRole('link', { name: 'Open docs' });
			expect(link.tagName).toBe('A');
			expect(link).toHaveAttribute('href', '/docs');
		}
	);
});

describe('carousel', () => {
	test(
		law('a11y:carousel.region', 'labels the region as a carousel with slide roledescriptions'),
		async () => {
			mount('carousel');
			const region = screen.getByRole('region');
			expect(region).toHaveAttribute('aria-roledescription', 'carousel');
			await waitFor(() =>
				expect(region.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(3)
			);
		}
	);

	test(law('a11y:carousel.navigation-labels', 'names the previous and next controls'), () => {
		mount('carousel');
		expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
	});

	test(law('a11y:carousel.dots', 'marks the active pagination dot as current'), async () => {
		mount('carousel');
		await waitFor(() =>
			expect(screen.getAllByRole('button', { name: /^Slide \d$/ })).toHaveLength(3)
		);
		const dots = screen.getAllByRole('button', { name: /^Slide \d$/ });
		expect(dots.filter((dot) => dot.getAttribute('aria-current') === 'true')).toHaveLength(1);
	});
});

describe('collapsible', () => {
	test(
		law('a11y:collapsible.aria-expanded', 'links the trigger to its content and reports the state'),
		async () => {
			mount('collapsible');
			const trigger = screen.getByRole('button', { name: /Show details/ });
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
			const controls = trigger.getAttribute('aria-controls');
			expect(controls).toBeTruthy();
			await fireEvent.click(trigger);
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
			expect(document.getElementById(controls!)).toHaveTextContent('Hidden details');
		}
	);
});

describe('color picker', () => {
	test(
		law('a11y:color-picker.slider-thumbs', 'exposes keyboard-driven slider thumbs'),
		async () => {
			mount('color-picker');
			const hue = screen.getByRole('slider', { name: 'Hue' });
			expect(hue).toHaveAttribute('aria-valuemin', '0');
			expect(hue).toHaveAttribute('aria-valuemax', '360');
			const before = Number(hue.getAttribute('aria-valuenow'));
			hue.focus();
			await fireEvent.keyDown(hue, { key: 'ArrowRight' });
			await waitFor(() =>
				expect(Number(hue.getAttribute('aria-valuenow'))).toBeGreaterThan(before)
			);
		}
	);
});

describe('combobox', () => {
	test(law('a11y:combobox.aria', 'exposes a list-autocomplete combobox'), () => {
		mount('combobox');
		const input = screen.getByRole('combobox', { name: 'Fruit' });
		expect(input).toHaveAttribute('aria-autocomplete', 'list');
		expect(input).toHaveAttribute('aria-expanded', 'false');
	});

	test(
		law(
			'a11y:combobox.keyboard',
			'closes with Escape, highlights with ArrowDown, selects with Enter'
		),
		async () => {
			mount('combobox');
			const input = screen.getByRole('combobox', { name: 'Fruit' });
			input.focus();
			await fireEvent.input(input, { target: { value: 'an' } });
			await screen.findByRole('listbox');
			await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
			await fireEvent.keyDown(input, { key: 'Escape' });
			await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
			await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
			input.focus();
			await fireEvent.input(input, { target: { value: 'an' } });
			await screen.findByRole('listbox');
			await fireEvent.keyDown(input, { key: 'ArrowDown' });
			await waitFor(() => {
				const active = input.getAttribute('aria-activedescendant');
				expect(active).toBeTruthy();
				expect(document.getElementById(active!)).toHaveTextContent('Banana');
			});
			await fireEvent.keyDown(input, { key: 'Enter' });
			await waitFor(() => expect(screen.getByTestId('combobox-value')).toHaveTextContent('banana'));
		}
	);
});

describe('command', () => {
	test(
		law('a11y:command.aria', 'wires the combobox input to its listbox and highlighted option'),
		async () => {
			mount('command');
			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('aria-autocomplete', 'list');
			const listbox = screen.getByRole('listbox');
			expect(input).toHaveAttribute('aria-controls', listbox.id);
			expect(within(listbox).getAllByRole('option')).toHaveLength(3);
			await fireEvent.keyDown(input, { key: 'ArrowDown' });
			await waitFor(() => {
				const active = input.getAttribute('aria-activedescendant');
				expect(active).toBeTruthy();
				expect(document.getElementById(active!)).toHaveAttribute('role', 'option');
			});
		}
	);
});

describe('confirmation', () => {
	test(
		law('a11y:confirmation.modal', 'ignores Escape and outside presses until a choice is made'),
		async () => {
			mount('confirmation');
			await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
			const dialog = await screen.findByRole('dialog');
			await escape();
			await pressOutside();
			expect(dialog).toBeInTheDocument();
			expect(screen.getByTestId('confirmed')).toHaveTextContent('pending');
			await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
			await waitFor(() => expect(screen.getByTestId('confirmed')).toHaveTextContent('false'));
		}
	);
});

describe('dialog', () => {
	test(
		law(
			'a11y:dialog.dismissal-toggleable',
			'outside press closes by default; both dismissals can be disabled'
		),
		async () => {
			const { unmount } = mount('dialog');
			await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
			await screen.findByRole('dialog');
			await pressOutside();
			await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
			unmount();

			mount('dialog', { dismissable: false });
			await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
			const dialog = await screen.findByRole('dialog');
			await escape();
			await pressOutside();
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(dialog).toBeInTheDocument();
		}
	);
});

describe('dialog', () => {
	test(
		law(
			'a11y:dialog.aria-modal-labelled',
			'exposes role=dialog with aria-modal named by its title'
		),
		async () => {
			mount('dialog');
			await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
			const dialog = await screen.findByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
			expect(dialog).toHaveAccessibleName('Chip dialog');
		}
	);
});

describe('popover', () => {
	test(
		law(
			'a11y:popover.dismissal-toggleable',
			'outside press closes by default; both dismissals can be disabled'
		),
		async () => {
			const { unmount } = mount('popover');
			const trigger = screen.getByRole('button', { name: 'Open popover' });
			await fireEvent.click(trigger);
			await screen.findByText('Popover body');
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
			await pressOutside();
			await waitFor(() => expect(screen.queryByText('Popover body')).toBeNull());
			unmount();

			mount('popover', { dismissable: false });
			await fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
			await screen.findByText('Popover body');
			await escape();
			await pressOutside();
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(screen.getByText('Popover body')).toBeInTheDocument();
		}
	);
});

describe('calendar', () => {
	test(
		law(
			'a11y:calendar.roving-focus',
			'keeps one tab stop in the grid and moves it with arrow keys'
		),
		async () => {
			mount('calendar');
			const grid = screen.getByRole('grid');
			const tabStops = () => grid.querySelectorAll('[data-date][tabindex="0"]');
			await waitFor(() => expect(tabStops()).toHaveLength(1));
			const start = tabStops()[0] as HTMLElement;
			const startDate = start.dataset.date;
			start.focus();
			await fireEvent.keyDown(start, { key: 'ArrowRight' });
			await waitFor(() => {
				expect(tabStops()).toHaveLength(1);
				expect((tabStops()[0] as HTMLElement).dataset.date).not.toBe(startDate);
				expect(document.activeElement).toBe(tabStops()[0]);
			});
		}
	);
});

describe('floating window', () => {
	test(law('a11y:floating-window.escape', 'closes the topmost open window'), async () => {
		mount('floating-window');
		const dialog = await screen.findByRole('dialog', { name: 'Notes' });
		expect(dialog).toHaveAttribute('aria-modal', 'false');
		await escape();
		await waitFor(() => expect(screen.getByTestId('window-open')).toHaveTextContent('false'));
	});
});

describe('form', () => {
	test(
		law(
			'a11y:form.first-invalid-focus',
			'blocks submission, marks errors, and focuses the first invalid field'
		),
		async () => {
			const onSubmit = vi.fn();
			mount('form', { onSubmit });
			const name = screen.getByRole('textbox', { name: 'Name' });
			await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
			await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
			expect(document.activeElement).toBe(name);
			expect(onSubmit).not.toHaveBeenCalled();
		}
	);
});

describe('hover card', () => {
	test(
		law('a11y:hover-card.focus-opens', 'opens the card when the trigger receives focus'),
		async () => {
			mount('hover-card');
			const trigger = screen.getByRole('button', { name: '@entasis' });
			await fireEvent.focusIn(trigger);
			await waitFor(() => expect(screen.getByText('Hover card body')).toBeInTheDocument());
		}
	);
});

describe('menu', () => {
	test(
		law('a11y:menu.arrow-keys', 'moves focus with arrow keys and loops at the ends'),
		async () => {
			mount('menu');
			const menu = screen.getByRole('menu');
			const items = within(menu).getAllByRole('menuitem');
			await waitFor(() => expect(document.activeElement).toBe(items[0]));
			await fireEvent.keyDown(menu, { key: 'ArrowDown' });
			await waitFor(() => expect(document.activeElement).toBe(items[1]));
			await fireEvent.keyDown(menu, { key: 'ArrowUp' });
			await fireEvent.keyDown(menu, { key: 'ArrowUp' });
			await waitFor(() => expect(document.activeElement).toBe(items[2]));
		}
	);
});

describe('menu bar', () => {
	test(law('a11y:menu-bar.arrow-keys', 'moves focus between menubar triggers'), async () => {
		mount('menu-bar');
		const bar = screen.getByRole('menubar');
		const [file, edit] = within(bar).getAllByRole('menuitem');
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowRight' });
		await waitFor(() => expect(document.activeElement).toBe(edit));
	});

	test(
		law('a11y:menu-bar.focus-switches-open-menu', 'focusing another trigger moves the open menu'),
		async () => {
			mount('menu-bar');
			const bar = screen.getByRole('menubar');
			const [file, edit] = within(bar).getAllByRole('menuitem');
			await fireEvent.click(file);
			await screen.findByText('New file');
			expect(file).toHaveAttribute('aria-expanded', 'true');
			edit.focus();
			await screen.findByText('Undo');
			await waitFor(() => expect(edit).toHaveAttribute('aria-expanded', 'true'));
			expect(file).toHaveAttribute('aria-expanded', 'false');
		}
	);
});

describe('menu option', () => {
	test(law('a11y:menu-option.aria-state', 'reflects disabled and selected state'), () => {
		mount('menu-option');
		expect(screen.getByText('Disabled option').closest('[aria-disabled]')).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect(screen.getByRole('option', { name: 'Selected option' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
	});

	test(law('a11y:menu-option.data-highlighted', 'marks the keyboard-focused item'), async () => {
		mount('menu');
		const menu = screen.getByRole('menu');
		const items = within(menu).getAllByRole('menuitem');
		await waitFor(() => expect(items[0]).toHaveAttribute('data-highlighted', 'true'));
		await fireEvent.keyDown(menu, { key: 'ArrowDown' });
		await waitFor(() => expect(items[1]).toHaveAttribute('data-highlighted', 'true'));
		expect(items[0]).not.toHaveAttribute('data-highlighted');
	});
});

describe('pagination', () => {
	test(
		law('a11y:pagination.aria-labels', 'labels every control and accepts localized labels'),
		() => {
			mount('pagination');
			expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Page 2, current page' })).toBeInTheDocument();
			const localized = screen.getByRole('navigation', { name: 'Pages (fr)' });
			expect(
				within(localized).getByRole('button', { name: 'Aller à la page 3' })
			).toBeInTheDocument();
		}
	);
});

describe('pin input', () => {
	test(
		law('a11y:pin-input.native-input', 'a single native input owns focus and paste'),
		async () => {
			mount('pin-input');
			const input = screen.getByRole('textbox', { name: 'Code' });
			expect(input.tagName).toBe('INPUT');
			input.focus();
			expect(document.activeElement).toBe(input);
			await fireEvent.paste(input, { clipboardData: { getData: () => '1234' } });
			await waitFor(() => expect(input).toHaveValue('1234'));
		}
	);
});

describe('popup menu', () => {
	test(
		law(
			'a11y:popup-menu.trigger-aria',
			'exposes the menu popup, its expanded state, and the panel'
		),
		async () => {
			mount('popup-menu');
			const trigger = screen.getByRole('button', { name: 'Open menu' });
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
			expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
			await fireEvent.click(trigger);
			await screen.findByRole('menu');
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
			const controls = trigger.getAttribute('aria-controls');
			expect(controls).toBeTruthy();
			expect(document.getElementById(controls as string)).not.toBeNull();
		}
	);

	test(
		law('a11y:popup-menu.escape', 'closes the menu and returns focus to the trigger'),
		async () => {
			mount('popup-menu');
			const trigger = screen.getByRole('button', { name: 'Open menu' });
			trigger.focus();
			await fireEvent.click(trigger);
			const menu = await screen.findByRole('menu');
			await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
			await escape();
			await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
			expect(document.activeElement).toBe(trigger);
		}
	);
});

describe('radios', () => {
	test(law('a11y:radios.option-labels', 'names every radio option inside a radiogroup'), () => {
		mount('radios');
		const group = screen.getByRole('radiogroup', { name: 'Plan' });
		const radios = within(group).getAllByRole('radio');
		expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(['Free', 'Pro']);
	});
});

describe('rating', () => {
	test(law('a11y:rating.slider-keyboard', 'exposes a slider that arrow keys adjust'), async () => {
		mount('rating');
		const slider = screen.getByRole('slider', { name: 'Overall rating' });
		expect(slider).toHaveAttribute('aria-valuenow', '2');
		slider.focus();
		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '3'));
		await fireEvent.keyDown(slider, { key: 'Home' });
		await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '0'));
	});
});

describe('resizable', () => {
	test(
		law('a11y:resizable.keyboard', 'exposes a separator handle that arrow keys resize'),
		async () => {
			mount('resizable');
			const handle = screen.getByRole('separator');
			expect(handle).toHaveAttribute('tabindex', '0');
			const before = Number(handle.getAttribute('aria-valuenow'));
			handle.focus();
			await fireEvent.keyDown(handle, { key: 'ArrowRight' });
			await waitFor(() =>
				expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(before)
			);
		}
	);
});

describe('scroll area', () => {
	test(
		law(
			'a11y:scroll-area.tabbable-on-overflow',
			'the viewport is a tab stop only when it overflows'
		),
		async () => {
			const { unmount } = mount('scroll-area');
			const viewport = () => screen.getByText('Scrollable content').closest('[tabindex]')!;
			expect(viewport()).toHaveAttribute('tabindex', '-1');
			unmount();
			// jsdom has no layout: report overflowing content for the second mount.
			const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')!;
			Object.defineProperty(Element.prototype, 'scrollHeight', {
				configurable: true,
				get: () => 400
			});
			try {
				mount('scroll-area');
				await waitFor(() => expect(viewport()).toHaveAttribute('tabindex', '0'));
			} finally {
				Object.defineProperty(Element.prototype, 'scrollHeight', descriptor);
			}
		}
	);
});

describe('select', () => {
	test(
		law('a11y:select.aria', 'exposes a combobox trigger that owns a listbox of options'),
		async () => {
			mount('select');
			const trigger = screen.getByRole('combobox', { name: 'Fruit' });
			expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
			await fireEvent.click(trigger);
			const listbox = await screen.findByRole('listbox');
			await waitFor(() => expect(trigger).toHaveAttribute('aria-controls', listbox.id));
			expect(within(listbox).getAllByRole('option')).toHaveLength(3);
		}
	);

	test(
		law('a11y:select.keyboard', 'opens with ArrowDown, selects with Enter, closes with Escape'),
		async () => {
			mount('select');
			const trigger = screen.getByRole('combobox', { name: 'Fruit' });
			trigger.focus();
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await screen.findByRole('listbox');
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			let highlighted = '';
			await waitFor(() => {
				const active = trigger.getAttribute('aria-activedescendant');
				expect(active).toBeTruthy();
				highlighted = document.getElementById(active!)!.textContent!.trim().toLowerCase();
			});
			await fireEvent.keyDown(trigger, { key: 'Enter' });
			await waitFor(() =>
				expect(screen.getByTestId('select-value')).toHaveTextContent(highlighted)
			);
			await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await screen.findByRole('listbox');
			await fireEvent.keyDown(trigger, { key: 'Escape' });
			await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
		}
	);

	test(
		law('a11y:select.virtual-focus', 'keeps DOM focus on the trigger while the highlight moves'),
		async () => {
			mount('select');
			const trigger = screen.getByRole('combobox', { name: 'Fruit' });
			trigger.focus();
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await screen.findByRole('listbox');
			await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
			await waitFor(() => {
				const active = trigger.getAttribute('aria-activedescendant');
				expect(active).toBeTruthy();
				expect(document.getElementById(active!)).toHaveAttribute('role', 'option');
			});
			expect(document.activeElement).toBe(trigger);
		}
	);
});

describe('separator', () => {
	test(
		law('a11y:separator.role', 'exposes role=separator with its orientation, none when decorative'),
		() => {
			mount('separator');
			const separator = screen.getByRole('separator');
			expect(separator).toHaveAttribute('aria-orientation', 'vertical');
			expect(screen.getByTestId('decorative').firstElementChild).toHaveAttribute('role', 'none');
		}
	);
});

describe('slider', () => {
	test(
		law('a11y:slider.thumbs', 'exposes each thumb as an ARIA slider with its value range'),
		() => {
			mount('slider');
			const thumb = screen.getByRole('slider');
			expect(thumb).toHaveAttribute('aria-valuenow', '30');
			expect(thumb).toHaveAttribute('aria-valuemin', '0');
			expect(thumb).toHaveAttribute('aria-valuemax', '100');
			expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
		}
	);
});

describe('switch', () => {
	test(law('a11y:switch.role', 'exposes role=switch with aria-checked'), async () => {
		mount('switch');
		const control = screen.getByRole('switch', { name: 'Notifications' });
		expect(control).toHaveAttribute('aria-checked', 'false');
		await fireEvent.click(control);
		await waitFor(() => expect(control).toHaveAttribute('aria-checked', 'true'));
	});

	test(law('a11y:switch.keyboard-toggle', 'toggles with Enter and Space'), async () => {
		mount('switch');
		const control = screen.getByRole('switch', { name: 'Notifications' });
		control.focus();
		await fireEvent.keyDown(control, { key: 'Enter' });
		await waitFor(() => expect(screen.getByTestId('switch-value')).toHaveTextContent('true'));
		await fireEvent.keyDown(control, { key: ' ' });
		await waitFor(() => expect(screen.getByTestId('switch-value')).toHaveTextContent('false'));
	});
});

describe('tabs', () => {
	test(
		law('a11y:tabs.aria-wiring', 'links each tab to its panel and marks the selected one'),
		async () => {
			mount('tabs');
			const [overview, settings] = screen.getAllByRole('tab');
			expect(overview).toHaveAttribute('aria-selected', 'true');
			const panelId = overview.getAttribute('aria-controls');
			expect(panelId).toBeTruthy();
			const panel = document.getElementById(panelId!);
			expect(panel).toHaveAttribute('role', 'tabpanel');
			expect(panel).toHaveAttribute('aria-labelledby', overview.id);
			await fireEvent.click(settings);
			await waitFor(() => expect(settings).toHaveAttribute('aria-selected', 'true'));
			expect(overview).toHaveAttribute('aria-selected', 'false');
		}
	);

	test(law('a11y:tabs.arrow-keys', 'moves focus and selection to the next tab'), async () => {
		mount('tabs');
		const [overview, settings] = screen.getAllByRole('tab');
		overview.focus();
		await fireEvent.keyDown(overview, { key: 'ArrowRight' });
		await waitFor(() => expect(document.activeElement).toBe(settings));
		await waitFor(() => expect(settings).toHaveAttribute('aria-selected', 'true'));
		expect(overview).toHaveAttribute('tabindex', '-1');
		expect(settings).toHaveAttribute('tabindex', '0');
	});
});

describe('toggle menu', () => {
	test(
		law('a11y:toggle-menu.roving-tabindex', 'keeps a single tab stop that arrow keys move'),
		async () => {
			mount('toggle-menu');
			const toolbar = screen.getByRole('toolbar', { name: 'Editor tools' });
			const buttons = within(toolbar).getAllByRole('button');
			const tabStops = () => buttons.filter((button) => button.getAttribute('tabindex') === '0');
			await waitFor(() => expect(tabStops()).toHaveLength(1));
			const first = tabStops()[0];
			first.focus();
			await fireEvent.keyDown(first, { key: 'ArrowRight' });
			await waitFor(() => expect(document.activeElement).not.toBe(first));
			expect(tabStops()).toHaveLength(1);
			expect(tabStops()[0]).toBe(document.activeElement);
		}
	);
});
