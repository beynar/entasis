import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import type { FormInputs } from './form.js';
import type { FormState } from './form.state.svelte.js';
import FormValidationHarness from './FormValidationHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => vi.restoreAllMocks());

const mount = (inputs: FormInputs, props: Record<string, unknown> = {}) => {
	let form: FormState | undefined;
	const view = render(FormValidationHarness, {
		props: {
			inputs,
			onForm: (next: FormState) => {
				form = next;
			},
			...props
		}
	});
	return { ...view, form: () => form! };
};

const box = (name: string) => screen.getByRole('textbox', { name });
const type = (name: string, value: string) => fireEvent.input(box(name), { target: { value } });
const errorOf = (name: string) => {
	const control = box(name);
	const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
	return ids
		.map((id) => document.getElementById(id))
		.find((node) => node?.getAttribute('role') === 'alert')
		?.textContent?.trim();
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
const actions = [{ children: 'Submit', onAction: (form: FormState) => form.submit() }];

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const rules = {
	a: { type: 'text', label: 'A', required: true },
	b: {
		type: 'text',
		label: 'B',
		onValidate: (value: string) => (value === 'bad' ? 'Bad value' : null)
	}
} satisfies FormInputs;

describe('FD-3 · validation mode', () => {
	test('submit mode waits for a submit attempt, then re-validates every edit', async () => {
		mount(rules, { actions });
		await type('B', 'bad');
		await tick();
		expect(errorOf('B')).toBeUndefined();

		await type('B', 'ok');
		await submit();
		await waitFor(() => expect(errorOf('A')).toBe('This field is required'));
		expect(errorOf('B')).toBeUndefined();

		// B was valid at the submit; editing it into an invalid value now shows the error.
		await type('B', 'bad');
		expect(errorOf('B')).toBe('Bad value');
		await type('B', 'fine');
		expect(errorOf('B')).toBeUndefined();
	});

	test('blur mode validates when focus leaves the field, and re-validates while it shows an error', async () => {
		mount(rules, { validationMode: 'blur' });
		box('B').focus();
		await type('B', 'bad');
		await tick();
		expect(errorOf('B')).toBeUndefined();

		box('B').blur();
		await waitFor(() => expect(errorOf('B')).toBe('Bad value'));
		await type('B', 'good');
		expect(errorOf('B')).toBeUndefined();
	});

	test('blur validates the value the control settled on', async () => {
		mount(
			{
				b: {
					type: 'text',
					label: 'B',
					onValidate: (value: string) => (value === 'bad' ? 'Bad value' : null)
				}
			},
			{ validationMode: 'blur' }
		);
		const input = box('B');
		// A control that trims as it blurs: the blur handler runs after Field saw focus leave.
		input.addEventListener('blur', () => fireEvent.input(input, { target: { value: 'ok' } }));
		input.focus();
		await type('B', 'bad ');
		input.blur();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(errorOf('B')).toBeUndefined();
	});

	test('change mode validates every change; mounting validates nothing', async () => {
		mount(rules, { validationMode: 'change' });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		await type('B', 'bad');
		expect(errorOf('B')).toBe('Bad value');
		await type('A', 'x');
		await type('A', '');
		expect(errorOf('A')).toBe('This field is required');
	});

	test("a field's own validationMode wins over the form's", async () => {
		mount(
			{
				a: { ...rules.a, validationMode: 'change' },
				b: rules.b
			},
			{ validationMode: 'submit' }
		);
		await type('B', 'bad');
		expect(errorOf('B')).toBeUndefined();
		await type('A', 'x');
		await type('A', '');
		expect(errorOf('A')).toBe('This field is required');
	});

	test('validationDebounce delays the validation an edit triggers, once for a burst', async () => {
		const onValidate = vi.fn((value: string) => (value === 'bad' ? 'Bad value' : null));
		mount(
			{ b: { type: 'text', label: 'B', onValidate } },
			{ validationMode: 'change', validationDebounce: 40 }
		);
		await type('B', 'b');
		await type('B', 'ba');
		await type('B', 'bad');
		expect(onValidate).not.toHaveBeenCalled();
		await waitFor(() => expect(errorOf('B')).toBe('Bad value'));
		expect(onValidate).toHaveBeenCalledOnce();
	});

	test('a submit validates at once, whatever the debounce', async () => {
		mount({ a: rules.a }, { validationMode: 'change', validationDebounce: 5000, actions });
		await submit();
		await waitFor(() => expect(errorOf('A')).toBe('This field is required'));
	});
});

describe('FD-6 · server errors', () => {
	const serverInputs = {
		email: { type: 'text', label: 'Email' },
		name: { type: 'text', label: 'Name' }
	} satisfies FormInputs;

	test('the errors prop shows under the field, and editing the field clears it', async () => {
		mount(serverInputs, { errors: { email: 'Already taken' } });
		expect(errorOf('Email')).toBe('Already taken');
		expect(box('Email')).toHaveAttribute('aria-invalid', 'true');
		expect(box('Name')).not.toHaveAttribute('aria-invalid');
		await type('Email', 'ada@example.com');
		expect(errorOf('Email')).toBeUndefined();
		expect(box('Email')).not.toHaveAttribute('aria-invalid');
	});

	test('submitting unchanged keeps the error visible but still calls onSubmit', async () => {
		const onSubmit = vi.fn();
		mount(serverInputs, { errors: { email: ['Already taken'] }, onSubmit, actions });
		await type('Email', 'a@b.co');
		await type('Email', '');
		await type('Email', 'a@b.co');
		// A cleared error is gone; set one again and submit without editing.
		const { form } = mount(serverInputs, { onSubmit, actions });
		form().setErrors({ email: 'Taken' });
		await tick();
		await fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[1]);
		await waitFor(() => expect(onSubmit).toHaveBeenCalled());
		expect(screen.getAllByText('Taken')).toHaveLength(1);
	});

	test('setErrors replaces earlier errors and an empty record clears them', async () => {
		const { form } = mount(serverInputs);
		form().setErrors({ email: 'Taken' });
		await tick();
		expect(errorOf('Email')).toBe('Taken');
		form().setErrors({ name: ['Too short', 'Reserved'] });
		await tick();
		expect(errorOf('Email')).toBeUndefined();
		expect(screen.getByText('Too short')).toBeInTheDocument();
		expect(screen.getByText('Reserved')).toBeInTheDocument();
		form().setErrors({});
		await tick();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('validation does not wipe a server error', async () => {
		const { form } = mount({ email: { type: 'text', label: 'Email', required: false } });
		form().setErrors({ email: 'Taken' });
		await tick();
		expect(form().validate({ reveal: false })).toEqual({ email: null });
		await tick();
		expect(errorOf('Email')).toBe('Taken');
	});

	test('two fields edited in the same tick both clear', async () => {
		const { form } = mount(serverInputs);
		form().setErrors({ email: 'Taken', name: 'Reserved' });
		await tick();
		void type('Email', 'a');
		void type('Name', 'b');
		await tick();
		expect(errorOf('Email')).toBeUndefined();
		expect(errorOf('Name')).toBeUndefined();
	});

	test('setErrors reveals the first errored field in render order', async () => {
		const { form } = mount(serverInputs);
		form().setErrors({ name: 'Reserved', email: 'Taken' });
		await tick();
		expect(box('Email')).toHaveFocus();
	});

	test('errors set inside onSubmit are revealed once the submit is done', async () => {
		const mounted: { form?: () => FormState } = {};
		const onSubmit = vi.fn(() => mounted.form!().setErrors({ email: 'Taken' }));
		mounted.form = mount(serverInputs, { onSubmit, actions, disabled: false }).form;
		await submit();
		await waitFor(() => expect(errorOf('Email')).toBe('Taken'));
		await waitFor(() => expect(box('Email')).toHaveFocus());
	});

	test('changing the errors prop updates built-in and type: field entries', async () => {
		const view = mount(serverInputs, { customField: true, errors: {} });
		await view.rerender({ errors: { email: 'Taken', custom: 'Nope' } });
		expect(errorOf('Email')).toBe('Taken');
		expect(errorOf('Custom')).toBe('Nope');
		await view.rerender({ errors: { custom: 'Still nope' } });
		expect(errorOf('Email')).toBeUndefined();
		expect(errorOf('Custom')).toBe('Still nope');
	});
});

describe('FD-7 · disabled fields are left out of the submitted value', () => {
	const inputs = {
		name: { type: 'text', label: 'Name', defaultValue: 'Ada' },
		code: { type: 'text', label: 'Code', defaultValue: 'X1', disabled: true, required: true },
		locked: {
			type: 'group',
			label: 'Locked',
			disabled: true,
			inputs: { note: { type: 'text', label: 'Note', required: true } }
		}
	} satisfies FormInputs;

	test('disabled entries and disabled groups skip validation and are omitted from onSubmit', async () => {
		const onSubmit = vi.fn();
		mount(inputs, { onSubmit, actions });
		await submit();
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Ada' });
		expect(Object.keys(onSubmit.mock.calls[0][0])).toEqual(['name']);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('a disabled Form submits no value at all, and enabling it brings the fields back', async () => {
		const onSubmit = vi.fn();
		const view = mount({ name: inputs.name }, { onSubmit, actions, disabled: true });
		await submit();
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({}));
		await view.rerender({ disabled: false });
		await submit();
		await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith({ name: 'Ada' }));
	});

	test('the live value still holds the disabled field', async () => {
		const { form } = mount(inputs);
		await tick();
		expect(form().value).toMatchObject({ name: 'Ada', code: 'X1' });
	});
});

describe('FD-5 · FD-4b · reset, dirty and touched', () => {
	const resettable = {
		name: { type: 'text', label: 'Name', defaultValue: 'Ada' },
		email: { type: 'email', label: 'Email' },
		extra: {
			type: 'text',
			label: 'Extra',
			visible: (value: Record<string, unknown>) => value.name === 'Show'
		}
	} satisfies FormInputs;

	test('form.dirty and form.touched follow the fields', async () => {
		const { form } = mount(resettable);
		await tick();
		expect(form().dirty).toBe(false);
		expect(form().touched).toBe(false);
		box('Name').focus();
		await type('Name', 'Grace');
		expect(form().dirty).toBe(true);
		box('Name').blur();
		await tick();
		expect(form().touched).toBe(true);
		await type('Name', 'Ada');
		expect(form().dirty).toBe(false);
	});

	test('reset restores defaults and clears errors, touched, dirty and the submit count', async () => {
		const onValueChange = vi.fn();
		const onFieldChange = vi.fn();
		const { form } = mount(
			{
				...resettable,
				name: { ...resettable.name, onValueChange: onFieldChange }
			},
			{ onValueChange, actions }
		);
		await tick();
		box('Name').focus();
		await type('Name', 'Grace');
		await type('Email', 'not-an-email');
		box('Email').blur();
		await submit();
		await waitFor(() => expect(errorOf('Email')).toBeDefined());
		expect(form().submitCount).toBe(1);
		onValueChange.mockClear();
		onFieldChange.mockClear();

		form().reset();
		await tick();
		expect(box('Name')).toHaveValue('Ada');
		expect(box('Email')).toHaveValue('');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(form().dirty).toBe(false);
		expect(form().touched).toBe(false);
		expect(form().submitCount).toBe(0);
		// One form callback for the visible change, none from the fields.
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange.mock.calls[0][0]).toMatchObject({ name: 'Ada' });
		expect(onFieldChange).not.toHaveBeenCalled();
	});

	test('reset with a value re-baselines, so only later edits are dirty', async () => {
		const { form } = mount(resettable);
		await tick();
		form().reset({ name: 'Grace' } as never);
		await tick();
		expect(box('Name')).toHaveValue('Grace');
		expect(form().dirty).toBe(false);
		await type('Name', 'Hopper');
		expect(form().dirty).toBe(true);
		form().reset();
		await tick();
		expect(box('Name')).toHaveValue('Grace');
		expect(form().dirty).toBe(false);
	});

	test('reset re-evaluates conditional visibility', async () => {
		const { form } = mount(resettable);
		await type('Name', 'Show');
		expect(screen.getByRole('textbox', { name: 'Extra' })).toBeInTheDocument();
		form().reset();
		await tick();
		expect(screen.queryByRole('textbox', { name: 'Extra' })).not.toBeInTheDocument();
	});

	test('reset in change mode does not show errors for the restored empty value', async () => {
		const { form } = mount({ a: rules.a }, { validationMode: 'change' });
		await type('A', 'x');
		form().reset();
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});

describe('FD-12 · validateField and quiet validation', () => {
	test('validateField validates one field, without moving focus', async () => {
		const { form } = mount({
			a: rules.a,
			b: { ...rules.b, required: true }
		});
		expect(form().validateField('a')).toBe(false);
		await tick();
		expect(errorOf('A')).toBe('This field is required');
		expect(errorOf('B')).toBeUndefined();
		expect(document.body).toHaveFocus();
		await type('A', 'x');
		expect(form().validateField('a')).toBe(true);
		expect(form().validateField('nope')).toBe(false);
	});

	test('validate({ reveal: false }) leaves focus alone and does not count as a submit attempt', async () => {
		const { form } = mount(rules);
		await type('A', 'x');
		await type('A', '');
		expect(form().validate({ reveal: false })).toBe(false);
		await tick();
		expect(errorOf('A')).toBe('This field is required');
		expect(form().submitCount).toBe(0);
		expect(box('A')).not.toHaveFocus();
		expect(form().validate()).toBe(false);
		expect(form().submitCount).toBe(1);
		await tick();
		expect(box('A')).toHaveFocus();
	});
});

describe('FD-11 · async validators', () => {
	test('the field is neutral while pending, then shows the result', async () => {
		const pending = deferred<string | null>();
		mount(
			{ b: { type: 'text', label: 'B', onValidate: () => pending.promise } },
			{ validationMode: 'change' }
		);
		await type('B', 'x');
		const root = box('B').closest('[data-label-position]') as HTMLElement;
		expect(root).toHaveAttribute('data-validating');
		expect(root).not.toHaveAttribute('data-invalid');
		expect(box('B')).not.toHaveAttribute('aria-invalid');
		pending.resolve('Taken');
		await waitFor(() => expect(errorOf('B')).toBe('Taken'));
		expect(root).toHaveAttribute('data-invalid');
		expect(root).not.toHaveAttribute('data-validating');
	});

	test('a slow result for an older value never overwrites a newer one', async () => {
		const first = deferred<string | null>();
		const second = deferred<string | null>();
		const results = [first, second];
		mount(
			{ b: { type: 'text', label: 'B', onValidate: () => results.shift()!.promise } },
			{ validationMode: 'change' }
		);
		await type('B', 'one');
		await type('B', 'two');
		second.resolve(null);
		await tick();
		first.resolve('Taken');
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(errorOf('B')).toBeUndefined();
		expect(box('B').closest('[data-label-position]')).not.toHaveAttribute('data-validating');
	});

	test('submit waits for the pending validator, then submits', async () => {
		const onSubmit = vi.fn();
		const pending = deferred<string | null>();
		const { form } = mount(
			{ b: { type: 'text', label: 'B', onValidate: () => pending.promise } },
			{ onSubmit, actions }
		);
		await type('B', 'ada');
		await submit();
		await tick();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(form().loading).toBe(true);
		pending.resolve(null);
		await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ b: 'ada' }));
		await waitFor(() => expect(form().loading).toBe(false));
	});

	test('a pending validator that fails stops the submit and shows its error', async () => {
		const onSubmit = vi.fn();
		const pending = deferred<string | null>();
		const { form } = mount(
			{ b: { type: 'text', label: 'B', onValidate: () => pending.promise } },
			{ onSubmit, actions }
		);
		await type('B', 'grace');
		await submit();
		await tick();
		pending.resolve('Taken');
		await waitFor(() => expect(errorOf('B')).toBe('Taken'));
		expect(onSubmit).not.toHaveBeenCalled();
		expect(form().loading).toBe(false);
		expect(box('B')).toHaveFocus();
	});

	test('a validator that rejects marks the field invalid and blocks the submit', async () => {
		const onSubmit = vi.fn();
		mount(
			{ b: { type: 'text', label: 'B', onValidate: () => Promise.reject(new Error('offline')) } },
			{ onSubmit, actions }
		);
		await type('B', 'ada');
		await submit();
		await waitFor(() => expect(errorOf('B')).toBe('Enter a valid value'));
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('a result arriving after the field unmounted writes nothing', async () => {
		const pending = deferred<string | null>();
		const { form, unmount } = mount(
			{ b: { type: 'text', label: 'B', onValidate: () => pending.promise } },
			{ validationMode: 'change' }
		);
		await type('B', 'x');
		const field = form().fields.get('b')!;
		expect(field.validating).toBe(true);
		unmount();
		pending.resolve('Taken');
		await new Promise((resolve) => setTimeout(resolve, 5));
		expect(field.errors).toEqual([]);
		expect(field.validating).toBe(false);
	});

	test('a form that disables itself while loading still honours a failing validator', async () => {
		const onSubmit = vi.fn();
		const pending = deferred<string | null>();
		const { form } = mount(
			{ b: { type: 'text', label: 'B', onValidate: () => pending.promise } },
			{ onSubmit, actions, disableWhileLoading: true }
		);
		await type('B', 'ada');
		const outcome = form().submit();
		await tick();
		expect(form().loading).toBe(true);
		expect(box('B')).toBeDisabled();
		pending.resolve('Taken');
		await expect(outcome).resolves.toBe(false);
		expect(onSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(errorOf('B')).toBe('Taken'));
		await waitFor(() => expect(box('B')).toHaveFocus());
	});

	test('a pending result is dropped when an edit starts no new validation', async () => {
		const first = deferred<string | null>();
		const { form } = mount(
			{ b: { type: 'text', label: 'B', onValidate: () => first.promise } },
			{ validationMode: 'blur' }
		);
		box('B').focus();
		await type('B', 'ada');
		box('B').blur();
		await waitFor(() => expect(form().fields.get('b')!.validating).toBe(true));
		await type('B', 'adam');
		expect(form().fields.get('b')!.validating).toBe(false);
		first.resolve('Taken');
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(errorOf('B')).toBeUndefined();
		expect(box('B')).toHaveValue('adam');
	});

	test('validateField reads a field with a pending async validator as not valid yet', async () => {
		const pending = deferred<string | null>();
		const { form } = mount({
			b: { type: 'text', label: 'B', onValidate: () => pending.promise }
		});
		await type('B', 'ada');
		expect(form().validateField('b')).toBe(false);
		pending.resolve(null);
	});

	test('validateAsync waits and returns the validated value', async () => {
		const pending = deferred<string | null>();
		const { form } = mount({
			b: { type: 'text', label: 'B', onValidate: () => pending.promise }
		});
		await type('B', 'ada');
		const result = form().validateAsync({ reveal: false });
		pending.resolve(null);
		await expect(result).resolves.toEqual({ b: 'ada' });
	});
});

describe('FD-TEST · the first invalid field in render order', () => {
	test('focus lands on the first invalid field in render order with groups, columns and a late field', async () => {
		const { form } = mount({
			toggle: { type: 'switch', label: 'Show first' },
			first: {
				type: 'text',
				label: 'First',
				required: true,
				visible: (value: Record<string, unknown>) => value.toggle === true
			},
			team: {
				type: 'group',
				label: 'Team',
				columns: 2,
				inputs: {
					lead: { type: 'text', label: 'Lead', required: true },
					deputy: { type: 'text', label: 'Deputy', required: true }
				}
			},
			hidden: { type: 'text', label: 'Hidden', required: true, visible: false },
			last: { type: 'text', label: 'Last', required: true }
		});
		await tick();
		expect(form().validate()).toBe(false);
		await tick();
		// The hidden field never blocks, and the group's first field leads.
		expect(box('Lead')).toHaveFocus();
		expect(screen.queryByRole('textbox', { name: 'Hidden' })).not.toBeInTheDocument();

		// `first` registers after the others, yet renders first: it takes focus.
		await fireEvent.click(screen.getByRole('switch', { name: 'Show first' }));
		await tick();
		expect(form().validate()).toBe(false);
		await tick();
		expect(box('First')).toHaveFocus();
	});
});

describe('FD-11 · async validators and the first invalid field', () => {
	const pair = (pending: Promise<string | null>) =>
		({
			username: { type: 'text', label: 'Username', onValidate: () => pending },
			email: { type: 'email', label: 'Email', required: true }
		}) satisfies FormInputs;

	test('a sync error after a pending async field waits for it, so the earlier field takes focus', async () => {
		const pending = deferred<string | null>();
		const onSubmit = vi.fn();
		const { form } = mount(pair(pending.promise), { onSubmit, actions });
		await type('Username', 'ada');
		await type('Email', 'bad@');
		await submit();
		await tick();
		expect(form().loading).toBe(true);
		expect(box('Email')).not.toHaveFocus();
		pending.resolve('Taken');
		await waitFor(() => expect(errorOf('Username')).toBe('Taken'));
		await waitFor(() => expect(box('Username')).toHaveFocus());
		expect(form().loading).toBe(false);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('the sync error takes focus when the earlier async field turns out valid', async () => {
		const pending = deferred<string | null>();
		const { form } = mount(pair(pending.promise), { actions });
		await type('Username', 'ada');
		await type('Email', 'bad@');
		await submit();
		pending.resolve(null);
		await waitFor(() => expect(box('Email')).toHaveFocus());
		expect(form().loading).toBe(false);
	});

	test('a sync error before the pending field fails at once', async () => {
		const pending = deferred<string | null>();
		const inputs = {
			email: { type: 'email', label: 'Email', required: true },
			username: { type: 'text', label: 'Username', onValidate: () => pending.promise }
		} satisfies FormInputs;
		const { form } = mount(inputs, { actions });
		await type('Username', 'ada');
		await type('Email', 'bad@');
		await submit();
		await tick();
		expect(box('Email')).toHaveFocus();
		expect(form().loading).toBe(false);
	});
});

describe('FD-9 · error transition', () => {
	const keyframesOf = (spy: { mock: { calls: unknown[][] } }) =>
		spy.mock.calls.map(([keyframes]) => keyframes as Keyframe[]);

	test('an error fades and grows in', async () => {
		const animate = vi.spyOn(Element.prototype, 'animate');
		const { form } = mount({ a: rules.a });
		form().validate();
		await tick();
		expect(keyframesOf(animate).some((frames) => frames[0]?.opacity === 0)).toBe(true);
	});

	test('reduced motion plays no transition', async () => {
		const animate = vi.spyOn(Element.prototype, 'animate');
		const { form } = mount({ a: rules.a }, { reduceMotion: true });
		form().validate();
		await tick();
		expect(errorOf('A')).toBe('This field is required');
		expect(keyframesOf(animate).some((frames) => frames[0]?.opacity === 0)).toBe(false);
	});
});
