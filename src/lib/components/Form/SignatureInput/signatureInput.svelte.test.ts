// The pad as a field: its control, its state, its keys and buttons, a value from outside, and
// its place in Form and native forms. jsdom has no canvas, so these export SVG; the PNG export
// and real pointer drawing are covered in the browser (`signatureInput.browser.test.ts`).
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import Form from '../Form/Form.svelte';
import type { FormState } from '../Form/form.state.svelte.js';
import SignatureInputHarness from './SignatureInputHarness.test.svelte';

const pad = () => document.querySelector<HTMLElement>('[data-slot="signature-pad"]')!;
const saved = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>')}`;

/** One stroke from (x1, y1) to (x2, y2), sampled every 10px, like a pointer would. */
const draw = async (from: [number, number], to: [number, number], pointerId = 1) => {
	const steps = 5;
	await fireEvent.pointerDown(pad(), {
		pointerId,
		pointerType: 'mouse',
		button: 0,
		clientX: from[0],
		clientY: from[1]
	});
	for (let step = 1; step <= steps; step++) {
		await fireEvent.pointerMove(pad(), {
			pointerId,
			pointerType: 'mouse',
			clientX: from[0] + ((to[0] - from[0]) * step) / steps,
			clientY: from[1] + ((to[1] - from[1]) * step) / steps
		});
	}
	await fireEvent.pointerUp(pad(), { pointerId, pointerType: 'mouse' });
};

describe('SignatureInput', () => {
	test('the pad is the labelled, focusable control, described by its state', () => {
		renderInTheme(SignatureInputHarness, { label: 'Signature du mandant' });
		expect(screen.getByRole('img', { name: 'Signature du mandant' })).toBe(pad());
		expect(pad()).toHaveAttribute('tabindex', '0');
		expect(pad()).toHaveAccessibleDescription(
			'No signature yet. Draw it with a mouse, a finger or a pen.'
		);
		expect(document.querySelector('[data-slot="signature-placeholder"]')).toHaveTextContent(
			'Sign here'
		);
	});

	test('without a label the pad is still named', () => {
		renderInTheme(SignatureInputHarness, {});
		expect(screen.getByRole('img', { name: 'Signature' })).toBe(pad());
	});

	test('a finished stroke sets the value once, to an image cropped to the ink', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { label: 'Signature', onValueChange });
		await draw([10, 10], [60, 30]);

		expect(onValueChange).toHaveBeenCalledOnce();
		const value = onValueChange.mock.calls[0]![0] as string;
		expect(value).toMatch(/^data:image\/svg\+xml/);
		expect(decodeURIComponent(value)).toContain('stroke="#000000"');
		expect(pad()).toHaveAttribute('data-filled', 'true');
		expect(pad()).toHaveAccessibleDescription('Signed.');
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(1);
		expect(document.querySelector('[data-slot="signature-placeholder"]')).toBeNull();
	});

	test('inkColor and strokeWidth reach the exported image', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { onValueChange, inkColor: '#1d4ed8', strokeWidth: 4 });
		await draw([10, 10], [60, 30]);
		const svg = decodeURIComponent(onValueChange.mock.calls[0]![0] as string);
		expect(svg).toContain('stroke="#1d4ed8"');
		expect(svg).toContain('stroke-width="4"');
	});

	test('undo removes the last stroke, clear empties the pad', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { label: 'Signature', onValueChange });
		await draw([10, 10], [60, 30]);
		await draw([10, 40], [60, 60], 2);
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(2);

		await fireEvent.click(screen.getByRole('button', { name: 'Undo last stroke' }));
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(1);
		expect(onValueChange).toHaveBeenCalledTimes(3);

		await fireEvent.click(screen.getByRole('button', { name: 'Clear signature' }));
		expect(onValueChange).toHaveBeenLastCalledWith(null);
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(0);
		expect(screen.queryByRole('button', { name: 'Clear signature' })).toBeNull();
		expect(pad()).toHaveFocus();
	});

	test('on the pad, Ctrl+Z undoes and Delete clears', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { onValueChange });
		await draw([10, 10], [60, 30]);
		await draw([10, 40], [60, 60], 2);
		pad().focus();

		await fireEvent.keyDown(pad(), { key: 'z', ctrlKey: true });
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(1);
		await fireEvent.keyDown(pad(), { key: 'Delete' });
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	test('the buttons follow the pad, after it in Tab order', async () => {
		renderInTheme(SignatureInputHarness, {});
		await draw([10, 10], [60, 30]);
		const undo = screen.getByRole('button', { name: 'Undo last stroke' });
		expect(pad().compareDocumentPosition(undo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(pad()).not.toContainElement(undo);
	});

	test('a value from outside shows as an image, and drawing replaces it', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { defaultValue: saved, onValueChange });
		const image = document.querySelector<HTMLImageElement>('[data-slot="signature-image"]')!;
		expect(image).toHaveAttribute('src', saved);
		expect(image).toHaveAttribute('alt', '');
		expect(screen.queryByRole('button', { name: 'Undo last stroke' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Clear signature' })).toBeInTheDocument();

		await draw([10, 10], [60, 30]);
		expect(document.querySelector('[data-slot="signature-image"]')).toBeNull();
		expect(onValueChange.mock.calls[0]![0]).not.toBe(saved);
	});

	test('read-only shows the value but takes no ink and offers no buttons', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { value: saved, readOnly: true, onValueChange });
		expect(document.querySelector('[data-slot="signature-image"]')).not.toBeNull();
		expect(pad()).toHaveAttribute('tabindex', '0');
		await draw([10, 10], [60, 30]);
		await fireEvent.keyDown(pad(), { key: 'Delete' });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('button')).toBeNull();
	});

	test('disabled takes no ink and leaves the tab order', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SignatureInputHarness, { disabled: true, onValueChange });
		expect(pad()).toHaveAttribute('tabindex', '-1');
		expect(pad()).toHaveAttribute('aria-disabled', 'true');
		await draw([10, 10], [60, 30]);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a native form submits the image under its name', async () => {
		renderInTheme(SignatureInputHarness, {});
		const form = screen.getByTestId('form') as HTMLFormElement;
		expect(new FormData(form).get('signature')).toBeNull();
		await draw([10, 10], [60, 30]);
		expect(String(new FormData(form).get('signature'))).toMatch(/^data:image\/svg\+xml/);
	});

	test('in a Form, a required signature blocks submit until signed', async () => {
		const onSubmit = vi.fn();
		renderInTheme(Form, {
			inputs: {
				signature: { type: 'signature', label: 'Signature', required: true, format: 'svg' }
			},
			actions: [{ children: 'Submit', onAction: (form: FormState) => form.submit() }],
			onSubmit
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toBeInTheDocument();
		expect(pad()).toHaveAttribute('aria-invalid', 'true');

		await draw([10, 10], [60, 30]);
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(onSubmit.mock.calls[0]![0].signature).toMatch(/^data:image\/svg\+xml/);
	});
});
