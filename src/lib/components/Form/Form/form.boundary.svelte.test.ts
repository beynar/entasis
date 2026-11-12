import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import ComposedInput from './ComposedInput.test.svelte';
import ComposedInputHarness from './ComposedInputHarness.test.svelte';
import { registerFormInputs } from './form.registry.js';
import type { FormState } from './form.state.svelte.js';

declare module './form.js' {
	interface FormInputRegistry {
		'test-composed': { value: string; props: Record<never, never> };
	}
}

let unregister: () => void;
const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	unregister = registerFormInputs({ 'test-composed': { component: ComposedInput } });
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	unregister();
});

const mount = async () => {
	let form: FormState<{ when: { type: 'test-composed'; label: 'When' } }> | undefined;
	render(ComposedInputHarness, { props: { onForm: (next) => (form = next) } });
	await vi.waitFor(() => expect(form).toBeDefined());
	return form!;
};

describe('inputs a registered input composes', () => {
	test('are not fields of the form: only the registered entry is', async () => {
		const form = await mount();
		expect([...form.fields.keys()]).toEqual(['when']);
		expect(form.value).toEqual({ when: 'start' });
	});

	test('a reset to a new value leaves the form clean', async () => {
		const form = await mount();
		await fireEvent.input(screen.getByTestId('composed-inner'), { target: { value: 'edited' } });
		await vi.waitFor(() => expect(form.value).toEqual({ when: 'edited' }));
		expect(form.dirty).toBe(true);

		form.reset({ when: 'saved' });
		await vi.waitFor(() => expect(form.value).toEqual({ when: 'saved' }));
		expect(form.dirty).toBe(false);
	});
});

test('FormBoundary keeps the inputs inside out of the form around it', async () => {
	const form = await mount();
	form.reset({ when: 'start' });
	await vi.waitFor(() => expect(form.dirty).toBe(false));
	await fireEvent.input(screen.getByTestId('outside'), { target: { value: 'typed' } });
	expect([...form.fields.keys()]).toEqual(['when']);
	expect(form.value).toEqual({ when: 'start' });
	expect(form.dirty).toBe(false);
});
