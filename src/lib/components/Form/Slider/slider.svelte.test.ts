import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
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
const thumbPosition = (thumb: HTMLElement) => thumb.getAttribute('style') ?? '';

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
