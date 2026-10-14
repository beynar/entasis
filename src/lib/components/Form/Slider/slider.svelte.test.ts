import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import Slider from './Slider.svelte';
import SliderHarness from './SliderHarness.test.svelte';

// jsdom implements no pointer capture, which every track press goes through.
const captured = new Set<number>();
const pointerCaptureStubs = {
	setPointerCapture: (id: number) => void captured.add(id),
	releasePointerCapture: (id: number) => void captured.delete(id),
	hasPointerCapture: (id: number) => captured.has(id)
};
const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	for (const [name, value] of Object.entries(pointerCaptureStubs)) {
		Object.defineProperty(Element.prototype, name, { configurable: true, writable: true, value });
	}
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	for (const name of Object.keys(pointerCaptureStubs)) {
		Reflect.deleteProperty(Element.prototype, name);
	}
	captured.clear();
	Element.prototype.scrollIntoView = scrollIntoView;
});

const TRACK_LEFT = 100;
const TRACK_WIDTH = 200;
/** jsdom has no layout: the track reports a 200px box starting 100px from the viewport edge. */
const layOutTrack = () => {
	const track = screen.getByRole('group');
	track.getBoundingClientRect = () => new DOMRect(TRACK_LEFT, 0, TRACK_WIDTH, 20);
	return track;
};
const pressTrack = async (track: HTMLElement, clientX: number) => {
	const init = { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX, clientY: 10 };
	await fireEvent(track, new PointerEvent('pointerdown', init));
	await fireEvent(track, new PointerEvent('pointerup', init));
};
const pointer = (type: string, clientX: number) =>
	new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX });
/** Presses `node`, moves the pointer to `toX`, and releases it there. */
const drag = async (node: HTMLElement, fromX: number, toX: number) => {
	await fireEvent(node, pointer('pointerdown', fromX));
	await fireEvent(node, pointer('pointermove', toX));
	await fireEvent(node, pointer('pointerup', toX));
};
const thumbPosition = (thumb: HTMLElement) =>
	thumb.closest('[data-slider-thumb-root]')?.getAttribute('style') ?? '';

describe('Slider one-element array values', () => {
	test('keeps the array shape on keyboard input', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { defaultValue: [25], onValueChange } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		expect(thumb).toHaveAttribute('aria-valuenow', '26');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([26]);
	});

	test('keeps the array shape on a track press', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { defaultValue: [25], onValueChange } });

		await pressTrack(layOutTrack(), TRACK_LEFT + TRACK_WIDTH * 0.5);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([50]);
	});

	test('a scalar value stays a number', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { defaultValue: 25, onValueChange } });

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(26);
	});

	test('a Form entry holds and submits the one-element array', async () => {
		const onFormSubmit = vi.fn();
		render(SliderHarness, {
			props: { formEntry: { type: 'slider-range', label: 'Level', value: [25] }, onFormSubmit }
		});
		const formValue = screen.getByTestId('form-value');
		await waitFor(() => expect(formValue).toHaveTextContent('{"level":[25]}'));

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		await waitFor(() => expect(formValue).toHaveTextContent('{"level":[26]}'));

		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
		await waitFor(() => expect(onFormSubmit).toHaveBeenCalledWith({ level: [26] }));
	});

	test('a range settles in a Form bound to $state', async () => {
		render(SliderHarness, {
			props: { formEntry: { type: 'slider-range', label: 'Level', value: [25, 75] } }
		});
		const formValue = screen.getByTestId('form-value');
		await waitFor(() => expect(formValue).toHaveTextContent('{"level":[25,75]}'));

		await fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'ArrowLeft' });
		await waitFor(() => expect(formValue).toHaveTextContent('{"level":[25,74]}'));
	});
});

describe('Slider array payloads', () => {
	test.each([
		['unbound', { defaultValue: [20, 60] }],
		['bound', { bound: [20, 60] }]
	])('a range payload is plain data the app owns (%s)', async (_, props) => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { ...props, onValueChange } });
		const [start, end] = screen.getAllByRole('slider');

		await fireEvent.keyDown(start, { key: 'ArrowRight' });
		const payload = onValueChange.mock.calls[0][0] as number[];
		expect(structuredClone(payload)).toEqual([21, 60]);

		// Changing the payload never writes into the slider.
		payload[1] = 90;
		await tick();
		expect(end).toHaveAttribute('aria-valuenow', '60');
	});

	test('a one-element payload is plain data', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { defaultValue: [25], onValueChange } });

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(structuredClone(onValueChange.mock.calls[0][0])).toEqual([26]);
	});
});

describe('Slider right-to-left layout', () => {
	test('positions thumbs and the range from the inline start', () => {
		render(SliderHarness, { props: { dir: 'rtl', mode: 'range', defaultValue: [20, 60] } });
		const [start, end] = screen.getAllByRole('slider');

		expect(thumbPosition(start)).toContain('inset-inline-start: clamp(8px, 20%');
		expect(thumbPosition(end)).toContain('inset-inline-start: clamp(8px, 60%');
		expect(thumbPosition(start)).not.toMatch(/(^|[;\s])left:/);
		const range = document.querySelector<HTMLElement>('[role="presentation"]');
		expect(range?.getAttribute('style')).toContain('inset-inline-start: 20%');
	});

	test('mirrors the whole field for an i18n direction the document does not carry', () => {
		render(SliderHarness, {
			props: { dir: 'rtl', defaultValue: 30, label: 'Brightness', description: 'Screen level' }
		});
		const root = screen.getByRole('group').closest('[dir]');
		expect(root).toHaveAttribute('dir', 'rtl');
		// The label and the description line up with the mirrored track.
		expect(root).toContainElement(screen.getByText('Brightness'));
		expect(root).toContainElement(screen.getByText('Screen level'));
		expect(document.documentElement).not.toHaveAttribute('dir', 'rtl');
	});

	test('the i18n direction wins over a field attribute, as it does for keys and pointer', () => {
		render(SliderHarness, {
			props: {
				dir: 'rtl',
				defaultValue: 30,
				label: 'Level',
				fieldAttrs: { dir: 'ltr', title: 'x' }
			}
		});
		const root = screen.getByText('Level').closest('[dir]');
		expect(root).toHaveAttribute('dir', 'rtl');
		expect(root).toHaveAttribute('title', 'x');
	});

	test('sets no direction without an i18n context', () => {
		render(Slider, { props: { defaultValue: 30, label: 'Plain' } });
		expect(screen.getByRole('group').closest('[dir]')).toBeNull();
	});

	test('ArrowLeft increases the value and moves the thumb toward the inline start', async () => {
		render(SliderHarness, { props: { dir: 'rtl', defaultValue: 30 } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
		expect(thumb).toHaveAttribute('aria-valuenow', '31');
		expect(thumbPosition(thumb)).toContain('inset-inline-start: clamp(8px, 31%');
	});

	test('reads the pointer from the right edge', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { dir: 'rtl', defaultValue: 50, onValueChange } });
		const track = layOutTrack();

		await pressTrack(track, TRACK_LEFT + TRACK_WIDTH);
		expect(onValueChange).toHaveBeenLastCalledWith(0);
		await pressTrack(track, TRACK_LEFT + TRACK_WIDTH * 0.25);
		expect(onValueChange).toHaveBeenLastCalledWith(75);
		await pressTrack(track, TRACK_LEFT);
		expect(onValueChange).toHaveBeenLastCalledWith(100);
	});

	test('places marks and contained ticks from the inline start', () => {
		render(SliderHarness, {
			props: {
				dir: 'rtl',
				variant: 'contained',
				defaultValue: 30,
				marks: [
					{ value: 0, label: 'Low' },
					{ value: 50, label: 'Mid' }
				]
			}
		});
		const mark = screen.getByText('Mid').parentElement;
		expect(mark?.getAttribute('style')).toBe('inset-inline-start: 50%;');
		const track = screen.getByRole('group');
		const ticks = track.querySelectorAll<HTMLElement>('span[style*="inset-inline-start"]');
		expect([...ticks].map((tick) => tick.getAttribute('style'))).toContain(
			'inset-inline-start: 10%;'
		);
		expect(document.querySelector('[style*="left:"]')).toBeNull();
	});

	test('a thumb drag reads the pointer from the right edge', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { dir: 'rtl', defaultValue: 50, onValueChange } });
		layOutTrack();

		await drag(screen.getByRole('slider'), TRACK_LEFT + TRACK_WIDTH / 2, TRACK_LEFT + 50);
		expect(onValueChange).toHaveBeenLastCalledWith(75);
	});

	test('dragging the selected range follows the mirrored track', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: { dir: 'rtl', mode: 'range', dragRange: true, defaultValue: [20, 60], onValueChange }
		});
		layOutTrack();
		const range = document.querySelector<HTMLElement>('[role="presentation"]')!;

		// 20px toward the physical left is 10% toward the maximum in RTL.
		await drag(range, TRACK_LEFT + 120, TRACK_LEFT + 100);
		expect(onValueChange).toHaveBeenLastCalledWith([30, 70]);
	});

	test('keeps reading the pointer from the left edge in LTR', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, { props: { dir: 'ltr', defaultValue: 50, onValueChange } });

		await pressTrack(layOutTrack(), TRACK_LEFT + TRACK_WIDTH * 0.25);
		expect(onValueChange).toHaveBeenLastCalledWith(25);
	});
});

describe('Slider read-only', () => {
	test('every thumb of a range exposes aria-readonly', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], readOnly: true } });

		const thumbs = screen.getAllByRole('slider');
		expect(thumbs).toHaveLength(2);
		for (const thumb of thumbs) expect(thumb).toHaveAttribute('aria-readonly', 'true');
	});

	test('thumbs carry no aria-readonly while the slider is editable', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60] } });

		for (const thumb of screen.getAllByRole('slider')) {
			expect(thumb).not.toHaveAttribute('aria-readonly');
		}
	});
});

const thumbRoot = (thumb: HTMLElement) => thumb.closest<HTMLElement>('[data-slider-thumb-root]')!;
const values = () =>
	screen.getAllByRole('slider').map((thumb) => Number((thumb as HTMLInputElement).value));
const selectedRange = () => document.querySelector<HTMLElement>('[role="presentation"]')!;

describe('Slider onValueCommit', () => {
	test('commits once per accepted key press, with the new value', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 20, onValueChange, onValueCommit } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		expect(onValueCommit).toHaveBeenCalledTimes(2);
		expect(onValueCommit).toHaveBeenNthCalledWith(1, 21);
		expect(onValueCommit).toHaveBeenNthCalledWith(2, 22);
	});

	test('never commits a key that changes nothing', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 0, onValueCommit } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'Home' });
		await fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
		await fireEvent.keyDown(thumb, { key: 'ArrowDown' });
		expect(onValueCommit).not.toHaveBeenCalled();
	});

	test('a drag commits once, on release, with the final value', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 50, onValueChange, onValueCommit } });
		layOutTrack();
		const thumb = thumbRoot(screen.getByRole('slider'));

		await fireEvent(thumb, pointer('pointerdown', TRACK_LEFT + 100));
		await fireEvent(thumb, pointer('pointermove', TRACK_LEFT + 120));
		await fireEvent(thumb, pointer('pointermove', TRACK_LEFT + 140));
		await fireEvent(thumb, pointer('pointermove', TRACK_LEFT + 160));
		expect(onValueChange).toHaveBeenCalledTimes(3);
		expect(onValueCommit).not.toHaveBeenCalled();

		await fireEvent(thumb, pointer('pointerup', TRACK_LEFT + 160));
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(80);
	});

	test('a track tap commits the pressed value', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 50, onValueCommit } });

		await pressTrack(layOutTrack(), TRACK_LEFT + TRACK_WIDTH * 0.25);
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(25);
	});

	test('a press on the thumb that does not move it commits nothing', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 50, onValueCommit } });
		layOutTrack();

		await drag(thumbRoot(screen.getByRole('slider')), TRACK_LEFT + 100, TRACK_LEFT + 100);
		expect(onValueCommit).not.toHaveBeenCalled();
	});

	test('a cancelled drag commits the value it last showed', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 50, onValueCommit } });
		layOutTrack();
		const thumb = thumbRoot(screen.getByRole('slider'));

		await fireEvent(thumb, pointer('pointerdown', TRACK_LEFT + 100));
		await fireEvent(thumb, pointer('pointermove', TRACK_LEFT + 140));
		await fireEvent(thumb, pointer('pointercancel', TRACK_LEFT + 140));
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(70);
	});

	test('a range commits arrays, a drag of the selected range commits once', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: { mode: 'range', dragRange: true, defaultValue: [20, 60], onValueCommit }
		});
		layOutTrack();

		await fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'ArrowLeft' });
		expect(onValueCommit).toHaveBeenLastCalledWith([20, 59]);

		await drag(selectedRange(), TRACK_LEFT + 80, TRACK_LEFT + 100);
		expect(onValueCommit).toHaveBeenCalledTimes(2);
		expect(onValueCommit).toHaveBeenLastCalledWith([30, 69]);
	});

	test('a one-element array commits an array', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: [25], onValueCommit } });

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith([26]);
	});

	test('the committed array is plain data the app owns', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: [20, 60], onValueCommit } });
		const [start, end] = screen.getAllByRole('slider');

		await fireEvent.keyDown(start, { key: 'ArrowRight' });
		const committed = onValueCommit.mock.calls[0][0] as number[];
		committed[1] = 90;
		await tick();
		expect((end as HTMLInputElement).value).toBe('60');
	});

	test('a Form entry commits too', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: { formEntry: { type: 'slider-range', label: 'Level', value: [25], onValueCommit } }
		});

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'End' });
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith([100]);
	});
});

describe('Slider native range input', () => {
	test('renders one range input per thumb as the focus target', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], step: 5 } });

		const thumbs = screen.getAllByRole('slider') as HTMLInputElement[];
		expect(thumbs).toHaveLength(2);
		for (const thumb of thumbs) {
			expect(thumb.tagName).toBe('INPUT');
			expect(thumb.type).toBe('range');
			expect(thumb.step).toBe('5');
		}
		expect(thumbs.map((thumb) => thumb.value)).toEqual(['20', '60']);
		// Each input spans the room its thumb can move in.
		expect(thumbs.map((thumb) => [thumb.min, thumb.max])).toEqual([
			['0', '60'],
			['20', '100']
		]);
		expect(document.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
	});

	test('the range inputs are the only tab stops, one per thumb', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60] } });

		const tabbable = [...document.querySelectorAll('input, button, [tabindex]')].filter(
			(node) => node.getAttribute('tabindex') !== '-1'
		);
		expect(tabbable).toEqual(screen.getAllByRole('slider'));
	});

	test('an input event from assistive technology moves the thumb', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 40, onValueChange, onValueCommit } });
		const thumb = screen.getByRole('slider') as HTMLInputElement;

		thumb.value = '45';
		await fireEvent.input(thumb);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(45);
		expect(thumb).toHaveAttribute('aria-valuenow', '45');
		// The adjustment is one interaction: it commits on `change`, not on each `input`.
		expect(onValueCommit).not.toHaveBeenCalled();

		thumb.value = '47';
		await fireEvent.input(thumb);
		await fireEvent.change(thumb);
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(47);
	});

	test('an adjustment without a change event commits when focus leaves', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 40, onValueCommit } });
		const thumb = screen.getByRole('slider') as HTMLInputElement;
		thumb.focus();

		thumb.value = '44';
		await fireEvent.input(thumb);
		thumb.blur();
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(44);
	});

	test('an input event that changes nothing commits nothing', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, { props: { defaultValue: 40, onValueCommit } });
		const thumb = screen.getByRole('slider');

		await fireEvent.input(thumb);
		await fireEvent.change(thumb);
		expect(onValueCommit).not.toHaveBeenCalled();
	});

	test('an input event moves a range thumb within its neighbours', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: { mode: 'range', defaultValue: [20, 60], onValueChange }
		});
		const start = screen.getAllByRole('slider')[0] as HTMLInputElement;

		start.value = '60';
		await fireEvent.input(start);
		expect(onValueChange).toHaveBeenLastCalledWith([60, 60]);
		expect(values()).toEqual([60, 60]);
	});

	test('submits one value per thumb under the field name', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, {
			target: form,
			props: { mode: 'range', defaultValue: [20, 60], name: 'budget' }
		});

		expect(new FormData(form).getAll('budget')).toEqual(['20', '60']);
		form.remove();
	});

	test('a field without a name submits nothing', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, { target: form, props: { defaultValue: 30 } });

		expect([...new FormData(form).keys()]).toEqual([]);
		form.remove();
	});

	test('a disabled slider submits nothing', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, {
			target: form,
			props: { defaultValue: 30, name: 'level', disabled: true }
		});

		expect(new FormData(form).getAll('level')).toEqual([]);
		expect(screen.getByRole('slider')).toBeDisabled();
		form.remove();
	});

	test('the label is bound to the first thumb', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], label: 'Budget' } });

		const label = screen.getByText('Budget') as HTMLLabelElement;
		expect(label.control).toBe(screen.getAllByRole('slider')[0]);
	});

	test('keyboard focus lights the thumb focus ring through the wrapper', async () => {
		render(SliderHarness, { props: { defaultValue: 30 } });
		const thumb = screen.getByRole('slider');
		thumb.focus();
		expect(thumb).toHaveFocus();
		// A named group: an unnamed `group` ancestor in the app must not light every thumb.
		const visual = thumbRoot(thumb).querySelector('[data-slider-thumb-visual]')!;
		expect(visual.className).toContain('group-has-[:focus-visible]/slider-thumb:ring-2');
		expect(visual.className).not.toMatch(/(^|\s)group-has-\[:focus-visible\]:/);
		expect(thumbRoot(thumb).className).toContain('group/slider-thumb');
	});

	test('the label targets the first enabled thumb when the first one is disabled', () => {
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				label: 'Budget',
				thumbDisabled: [true, false]
			}
		});

		const label = screen.getByText('Budget') as HTMLLabelElement;
		const [first, second] = screen.getAllByRole('slider');
		expect(first).toBeDisabled();
		expect(label.control).toBe(second);
		expect(first.id).not.toBe(second.id);
	});
});

describe('Slider required', () => {
	test('every thumb announces a required value', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], required: true } });

		for (const thumb of screen.getAllByRole('slider')) {
			expect(thumb).toHaveAttribute('aria-required', 'true');
		}
	});

	test('thumbs announce nothing while the value is optional', () => {
		render(SliderHarness, { props: { defaultValue: 20 } });
		expect(screen.getByRole('slider')).not.toHaveAttribute('aria-required');
	});
});

describe('Slider group label', () => {
	test('a plain label names the track group', () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], label: 'Budget' } });
		expect(screen.getByRole('group', { name: /Budget/ })).toBeInTheDocument();
	});

	test('a snippet label names the track group', () => {
		const label = createRawSnippet(() => ({ render: () => '<span>Price band</span>' }));
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60], label } });
		expect(screen.getByRole('group', { name: /Price band/ })).toBeInTheDocument();
	});

	test('the contained layout labels the group with its inner label', () => {
		render(SliderHarness, {
			props: { variant: 'contained', mode: 'range', defaultValue: [20, 60], label: 'Glow' }
		});
		expect(screen.getByRole('group', { name: /Glow/ })).toBeInTheDocument();
	});

	test('a slider without a label leaves the group unnamed', () => {
		render(SliderHarness, { props: { defaultValue: 20 } });
		expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
	});
});

describe('Slider largeStep', () => {
	test('defaults to ten times the step', async () => {
		render(SliderHarness, { props: { defaultValue: 20, step: 2 } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'PageUp' });
		expect(thumb).toHaveAttribute('aria-valuenow', '40');
		await fireEvent.keyDown(thumb, { key: 'ArrowRight', shiftKey: true });
		expect(thumb).toHaveAttribute('aria-valuenow', '60');
	});

	test('PageUp, PageDown and Shift+Arrow move by largeStep', async () => {
		render(SliderHarness, { props: { defaultValue: 50, step: 1, largeStep: 5 } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'PageUp' });
		expect(thumb).toHaveAttribute('aria-valuenow', '55');
		await fireEvent.keyDown(thumb, { key: 'ArrowLeft', shiftKey: true });
		expect(thumb).toHaveAttribute('aria-valuenow', '50');
		await fireEvent.keyDown(thumb, { key: 'PageDown' });
		expect(thumb).toHaveAttribute('aria-valuenow', '45');
		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		expect(thumb).toHaveAttribute('aria-valuenow', '46');
	});

	test('the result snaps to the step grid', async () => {
		render(SliderHarness, { props: { defaultValue: 0, step: 5, largeStep: 12 } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'PageUp' });
		expect(thumb).toHaveAttribute('aria-valuenow', '10');
	});

	test('a largeStep that is not positive falls back to ten steps', async () => {
		render(SliderHarness, { props: { defaultValue: 0, largeStep: 0 } });
		const thumb = screen.getByRole('slider');

		await fireEvent.keyDown(thumb, { key: 'PageUp' });
		expect(thumb).toHaveAttribute('aria-valuenow', '10');
	});
});

describe('Slider thumb collisions', () => {
	const press = (thumb: HTMLElement, key: string) => fireEvent.keyDown(thumb, { key });

	test('none stops a thumb at its neighbour', async () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [40, 50] } });

		await press(screen.getAllByRole('slider')[0], 'End');
		expect(values()).toEqual([50, 50]);
	});

	test('none is the default and keeps the minimum distance', async () => {
		render(SliderHarness, {
			props: { mode: 'range', defaultValue: [40, 60], minStepsBetweenThumbs: 10 }
		});

		await press(screen.getAllByRole('slider')[0], 'End');
		expect(values()).toEqual([50, 60]);
	});

	test('push moves the neighbour along', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [40, 50],
				thumbCollisionBehavior: 'push',
				onValueChange
			}
		});

		await press(screen.getAllByRole('slider')[0], 'End');
		expect(values()).toEqual([100, 100]);
		expect(onValueChange).toHaveBeenLastCalledWith([100, 100]);
	});

	test('push keeps the minimum distance and pushes every thumb in the way', async () => {
		render(SliderHarness, {
			props: {
				defaultValue: [10, 20, 30],
				thumbCollisionBehavior: 'push',
				minStepsBetweenThumbs: 5
			}
		});

		await press(screen.getAllByRole('slider')[0], 'End');
		expect(values()).toEqual([90, 95, 100]);
		await press(screen.getAllByRole('slider')[2], 'Home');
		expect(values()).toEqual([0, 5, 10]);
	});

	test('push leaves thumbs that are out of the way alone', async () => {
		render(SliderHarness, {
			props: { defaultValue: [10, 50, 90], thumbCollisionBehavior: 'push' }
		});

		await press(screen.getAllByRole('slider')[0], 'PageUp');
		expect(values()).toEqual([20, 50, 90]);
	});

	test('push gives each thumb the room it needs as its aria bounds', () => {
		render(SliderHarness, {
			props: {
				defaultValue: [10, 50, 90],
				thumbCollisionBehavior: 'push',
				minStepsBetweenThumbs: 5
			}
		});

		const bounds = screen
			.getAllByRole('slider')
			.map((thumb) => [thumb.getAttribute('aria-valuemin'), thumb.getAttribute('aria-valuemax')]);
		expect(bounds).toEqual([
			['0', '90'],
			['5', '95'],
			['10', '100']
		]);
	});

	test('swap lets a thumb pass its neighbour, and focus follows it', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [40, 50],
				thumbCollisionBehavior: 'swap',
				onValueChange,
				onValueCommit
			}
		});
		const [start, end] = screen.getAllByRole('slider');
		start.focus();

		await press(start, 'End');
		expect(values()).toEqual([50, 100]);
		expect(onValueChange).toHaveBeenLastCalledWith([50, 100]);
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith([50, 100]);
		expect(end).toHaveFocus();
	});

	test('swap works downward too', async () => {
		render(SliderHarness, {
			props: { mode: 'range', defaultValue: [40, 50], thumbCollisionBehavior: 'swap' }
		});
		const [start, end] = screen.getAllByRole('slider');
		end.focus();

		await press(end, 'Home');
		expect(values()).toEqual([0, 40]);
		expect(start).toHaveFocus();
	});

	test('swap keeps the minimum distance to both neighbours', async () => {
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [40, 60],
				thumbCollisionBehavior: 'swap',
				minStepsBetweenThumbs: 5
			}
		});

		await press(screen.getAllByRole('slider')[0], 'End');
		expect(values()).toEqual([60, 100]);
		await press(screen.getAllByRole('slider')[1], 'Home');
		expect(values()).toEqual([0, 60]);
	});

	test('dragging a thumb past its neighbour swaps and the drag continues', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbCollisionBehavior: 'swap',
				onValueCommit
			}
		});
		layOutTrack();
		const [start, end] = screen.getAllByRole('slider');
		const root = thumbRoot(start);

		await fireEvent(root, pointer('pointerdown', TRACK_LEFT + 40));
		await fireEvent(root, pointer('pointermove', TRACK_LEFT + 160));
		expect(values()).toEqual([60, 80]);
		expect(end).toHaveFocus();
		// The same drag keeps steering the thumb that crossed over.
		await fireEvent(root, pointer('pointermove', TRACK_LEFT + 20));
		expect(values()).toEqual([10, 60]);
		expect(start).toHaveFocus();
		await fireEvent(root, pointer('pointerup', TRACK_LEFT + 20));
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith([10, 60]);
	});

	test('dragging past a neighbour with none stops at it', async () => {
		render(SliderHarness, { props: { mode: 'range', defaultValue: [20, 60] } });
		layOutTrack();

		await drag(thumbRoot(screen.getAllByRole('slider')[0]), TRACK_LEFT + 40, TRACK_LEFT + 180);
		expect(values()).toEqual([60, 60]);
	});

	test('dragging a thumb with push moves its neighbour', async () => {
		render(SliderHarness, {
			props: { mode: 'range', defaultValue: [20, 60], thumbCollisionBehavior: 'push' }
		});
		layOutTrack();

		await drag(thumbRoot(screen.getAllByRole('slider')[0]), TRACK_LEFT + 40, TRACK_LEFT + 180);
		expect(values()).toEqual([90, 90]);
	});
});

describe('Slider per-thumb disabled', () => {
	test('a disabled thumb cannot be focused or moved', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				onValueChange
			}
		});
		const [start, end] = screen.getAllByRole('slider');

		expect(start).toBeEnabled();
		expect(end).toBeDisabled();
		end.focus();
		expect(end).not.toHaveFocus();
		await fireEvent.keyDown(end, { key: 'ArrowRight' });
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.keyDown(start, { key: 'ArrowRight' });
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([21, 60]);
	});

	test('it blocks its neighbour in every collision mode', async () => {
		for (const thumbCollisionBehavior of ['none', 'push', 'swap'] as const) {
			const { unmount } = render(SliderHarness, {
				props: {
					defaultValue: [20, 50, 80],
					thumbDisabled: [false, true, false],
					thumbCollisionBehavior
				}
			});
			const [start, , end] = screen.getAllByRole('slider');

			await fireEvent.keyDown(start, { key: 'End' });
			expect(values()).toEqual([50, 50, 80]);
			await fireEvent.keyDown(end, { key: 'Home' });
			expect(values()).toEqual([50, 50, 50]);
			unmount();
		}
	});

	test('push never moves a disabled thumb', async () => {
		render(SliderHarness, {
			props: {
				defaultValue: [20, 30, 80],
				thumbDisabled: [false, true, false],
				thumbCollisionBehavior: 'push',
				minStepsBetweenThumbs: 5
			}
		});

		await fireEvent.keyDown(screen.getAllByRole('slider')[0], { key: 'End' });
		expect(values()).toEqual([25, 30, 80]);
	});

	test('a track press moves the closest thumb that is free', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				onValueChange
			}
		});

		// 70 is nearest to the disabled thumb; the free one takes the press, up to its limit.
		await pressTrack(layOutTrack(), TRACK_LEFT + TRACK_WIDTH * 0.7);
		expect(onValueChange).toHaveBeenLastCalledWith([60, 60]);
		expect(values()).toEqual([60, 60]);
	});

	test('pressing a disabled thumb does not move another one', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				onValueChange
			}
		});
		layOutTrack();

		await drag(thumbRoot(screen.getAllByRole('slider')[1]), TRACK_LEFT + 120, TRACK_LEFT + 160);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('range dragging is off while a thumb is disabled', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				dragRange: true,
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				onValueChange
			}
		});
		layOutTrack();

		// The press falls through to the track: the free thumb follows it, the range does not move.
		await drag(selectedRange(), TRACK_LEFT + 80, TRACK_LEFT + 100);
		expect(onValueChange).toHaveBeenCalled();
		for (const [value] of onValueChange.mock.calls) expect(value[1]).toBe(60);
		expect(values()).toEqual([50, 60]);
	});

	test('the field control id moves to the first enabled thumb', () => {
		render(SliderHarness, {
			props: { mode: 'range', defaultValue: [20, 60], thumbDisabled: [true, false] }
		});
		const [, second] = screen.getAllByRole('slider');
		expect(second.id).not.toContain('-thumb-');
		expect(screen.getAllByRole('slider')[0].id).toMatch(/-thumb-0$/);
	});

	test('a disabled thumb keeps its place in the submitted value', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, {
			target: form,
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				name: 'budget'
			}
		});

		expect(new FormData(form).getAll('budget')).toEqual(['20', '60']);
		form.remove();
	});

	test('a disabled slider submits nothing, whatever its thumbs say', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, {
			target: form,
			props: {
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [false, true],
				disabled: true,
				name: 'budget'
			}
		});

		expect(new FormData(form).getAll('budget')).toEqual([]);
		form.remove();
	});
});

describe('Slider read-only edits', () => {
	test('keys change nothing and commit nothing, and the thumb stays focusable', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: { defaultValue: 40, readOnly: true, onValueChange, onValueCommit }
		});
		const thumb = screen.getByRole('slider');

		thumb.focus();
		expect(thumb).toHaveFocus();
		expect(thumb).toHaveAttribute('aria-readonly', 'true');
		await fireEvent.keyDown(thumb, { key: 'ArrowRight' });
		await fireEvent.keyDown(thumb, { key: 'End' });
		expect(thumb).toHaveAttribute('aria-valuenow', '40');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onValueCommit).not.toHaveBeenCalled();
	});

	test('a track press and a drag change nothing', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: { defaultValue: 40, readOnly: true, onValueChange, onValueCommit }
		});
		const track = layOutTrack();

		await pressTrack(track, TRACK_LEFT + 150);
		await drag(thumbRoot(screen.getByRole('slider')), TRACK_LEFT + 80, TRACK_LEFT + 180);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onValueCommit).not.toHaveBeenCalled();
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '40');
	});

	test('an input event is refused and the input shows the held value again', async () => {
		render(SliderHarness, { props: { defaultValue: 40, readOnly: true } });
		const thumb = screen.getByRole('slider') as HTMLInputElement;

		thumb.value = '70';
		await fireEvent.input(thumb);
		expect(thumb.value).toBe('40');
	});

	test('a read-only slider still submits its value', () => {
		const form = document.body.appendChild(document.createElement('form'));
		render(SliderHarness, {
			target: form,
			props: { defaultValue: 40, readOnly: true, name: 'level' }
		});

		expect(new FormData(form).getAll('level')).toEqual(['40']);
		form.remove();
	});

	test('the track and thumbs carry data-readonly and a default cursor', () => {
		render(SliderHarness, { props: { defaultValue: 40, readOnly: true } });

		expect(screen.getByRole('group')).toHaveAttribute('data-readonly');
		expect(thumbRoot(screen.getByRole('slider'))).toHaveAttribute('data-readonly');
		expect(screen.getByRole('group').className).toContain('cursor-default');
	});

	test('a read-only range is not draggable and shows no grab cursor', async () => {
		const onValueChange = vi.fn();
		render(SliderHarness, {
			props: {
				mode: 'range',
				dragRange: true,
				readOnly: true,
				defaultValue: [20, 60],
				onValueChange
			}
		});

		expect(selectedRange().className).not.toContain('cursor-grab');
		layOutTrack();
		await drag(selectedRange(), TRACK_LEFT + 40, TRACK_LEFT + 80);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(values()).toEqual([20, 60]);
	});

	test('a read-only swap slider does not move focus', async () => {
		render(SliderHarness, {
			props: {
				mode: 'range',
				defaultValue: [40, 50],
				readOnly: true,
				thumbCollisionBehavior: 'swap'
			}
		});
		const [start] = screen.getAllByRole('slider');
		start.focus();

		await fireEvent.keyDown(start, { key: 'End' });
		expect(start).toHaveFocus();
		expect(values()).toEqual([40, 50]);
	});

	test('a Form that is read-only makes the slider read-only', async () => {
		const onValueCommit = vi.fn();
		render(SliderHarness, {
			props: {
				formEntry: {
					type: 'slider-range',
					label: 'Level',
					value: [25],
					readOnly: true,
					onValueCommit
				}
			}
		});

		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'End' });
		expect(onValueCommit).not.toHaveBeenCalled();
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25');
	});
});
