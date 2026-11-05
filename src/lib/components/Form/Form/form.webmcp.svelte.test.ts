import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { ask } from '../Ask/ask.js';
import FormToolHarness from './FormToolHarness.test.svelte';
import type { FormInputs } from './form.js';
import type { FormState } from './form.state.svelte.js';

type Tool = {
	name: string;
	title?: string;
	description: string;
	inputSchema: { properties: Record<string, Record<string, unknown>>; required?: string[] };
	annotations: { consequentialHint: boolean; untrustedContentHint: boolean };
	execute: (input: unknown, options: object) => Promise<Record<string, unknown>>;
};

type RegisterOptions = { signal: AbortSignal; exposedTo?: string[] };

let tools: Map<string, Tool>;
let exposure: Map<string, string[] | undefined>;

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});
beforeEach(() => {
	tools = new Map();
	exposure = new Map();
	Object.defineProperty(document, 'modelContext', {
		configurable: true,
		value: {
			registerTool: (tool: Tool, { signal, exposedTo }: RegisterOptions) => {
				tools.set(tool.name, tool);
				exposure.set(tool.name, exposedTo);
				signal.addEventListener('abort', () => tools.delete(tool.name));
				return Promise.resolve();
			}
		}
	});
});
afterEach(() => {
	delete (document as unknown as { modelContext?: unknown }).modelContext;
});

const inputs = {
	email: { type: 'email', label: 'Email', required: true },
	password: { type: 'password', label: 'Password' },
	plan: {
		type: 'select',
		label: 'Plan',
		items: [
			{ value: 'free', label: 'Free' },
			{ value: 'corp', label: 'Corporate', disabled: true }
		]
	},
	seats: {
		type: 'number',
		label: 'Seats',
		visible: (value: Record<string, unknown>) => value.plan === 'free'
	},
	locked: { type: 'text', label: 'Locked', disabled: true },
	shown: { type: 'text', label: 'Shown', readOnly: true, defaultValue: 'kept' },
	secret: { type: 'text', label: 'Secret', tool: false },
	avatar: { type: 'file', label: 'Avatar' },
	at: { type: 'time', label: 'At' }
} as const satisfies FormInputs;

const mount = async (props: Record<string, unknown> = {}, name = 'sign_up') => {
	render(FormToolHarness, { webmcp: true, title: 'Sign up', inputs, ...props });
	await waitFor(() => expect(tools.has(name)).toBe(true));
	return tools.get(name) as Tool;
};

describe('Form under <Theme webmcp>', () => {
	test('stays away from agents unless the Theme asks', async () => {
		render(FormToolHarness, { title: 'Sign up', inputs });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(tools.size).toBe(0);
	});

	test('tool={false} keeps a form from agents', async () => {
		render(FormToolHarness, { webmcp: true, title: 'Sign up', inputs, tool: false });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(tools.size).toBe(0);
	});

	test('needs nothing but the props the form already has', async () => {
		const tool = await mount({ description: 'Opens an account.', onSubmit: () => {} });
		expect(tool.title).toBe('Sign up');
		expect(tool.description).toContain('Sign up. Opens an account.');
		expect(tool.description).toContain('Avatar');
		expect(tool.annotations.consequentialHint).toBe(true);
		expect(tool.inputSchema.required).toEqual(['email']);
		expect(Object.keys(tool.inputSchema.properties)).toEqual(['email', 'password', 'plan', 'at']);
		expect(tool.inputSchema.properties.email.description).toBe('Email');
	});

	test('a form without a title is still a tool', async () => {
		const tool = await mount({ title: undefined }, 'form');
		expect(tool.description).toContain('Form with these fields: Email, Password');
	});

	test('fills, validates and submits as a user would, and never answers with a value', async () => {
		const onSubmit = vi.fn();
		const tool = await mount({ onSubmit });
		const result = await tool.execute(
			{ email: 'ada@example.com', password: 'correct horse', plan: 'free', seats: 3, at: '09:30' },
			{}
		);
		expect(result).toEqual({
			status: 'submitted',
			filled: ['email', 'password', 'plan', 'at', 'seats']
		});
		expect(onSubmit.mock.calls[0][0]).toMatchObject({ password: 'correct horse', seats: 3 });
		expect(JSON.stringify(result)).not.toContain('correct horse');
		expect(screen.getByLabelText('At')).toHaveValue('09:30');
	});

	test('answers with the catalog messages and submits nothing', async () => {
		const onSubmit = vi.fn();
		const tool = await mount({ onSubmit });
		const result = await tool.execute({ email: 'nope' }, {});
		expect(result).toMatchObject({ status: 'invalid', filled: ['email'] });
		expect(result.errors).toEqual({ email: ['Enter a valid email address'] });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('an agent reaches nothing a person could not', async () => {
		const onSubmit = vi.fn();
		const tool = await mount({ onSubmit });
		const blocked = await tool.execute(
			{ email: 'a@b.co', locked: 'x', shown: 'x', secret: 'x', avatar: 'x', unknown: 'x' },
			{}
		);
		expect(blocked.ignored).toEqual(['locked', 'shown', 'secret', 'avatar', 'unknown']);
		expect(onSubmit.mock.calls[0][0]).toMatchObject({ shown: 'kept', secret: null });

		onSubmit.mockClear();
		const refused = await tool.execute({ plan: 'corp' }, {});
		expect(refused.status).toBe('invalid');
		expect(refused.errors).toEqual({ plan: ['Enter a valid value'] });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('a handler that throws does not reach the model', async () => {
		const tool = await mount({
			onSubmit: () => {
				throw new Error('card 4242 refused');
			}
		});
		const result = await tool.execute({ email: 'a@b.co' }, {});
		expect(result.status).toBe('failed');
		expect(JSON.stringify(result)).not.toContain('4242');
	});

	test('without onSubmit the tool says it only filled the form in', async () => {
		const tool = await mount();
		expect(tool.annotations.consequentialHint).toBe(false);
		expect(await tool.execute({ email: 'a@b.co' }, {})).toMatchObject({ status: 'filled' });
	});

	test('an error never carries a password, nor names a field kept from agents', async () => {
		const tool = await mount({
			onSubmit: () => {},
			inputs: {
				password: {
					type: 'password',
					label: 'Password',
					onValidate: (value: string) => [`Rejected: ${value}`]
				},
				hidden: { type: 'text', label: 'Hidden', required: true, tool: false }
			}
		});
		const result = await tool.execute({ password: 'correct horse' }, {});
		expect(JSON.stringify(result)).not.toContain('correct horse');
		expect(result.errors).toEqual({ password: ['Enter a valid value'] });
		expect(result.message).toContain('user');
		expect(tool.annotations.untrustedContentHint).toBe(true);
	});

	test('a second call waits its turn instead of writing over the first', async () => {
		const onSubmit = vi.fn();
		const tool = await mount({ onSubmit });
		const [first, second] = await Promise.all([
			tool.execute({ email: 'first@example.com' }, {}),
			tool.execute({ email: 'second@example.com' }, {})
		]);
		expect(first.status).toBe('submitted');
		expect(second.status).toBe('busy');
		expect(onSubmit).toHaveBeenCalledOnce();
		expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'first@example.com' });
	});

	test('cancelling during async validation submits nothing', async () => {
		const onSubmit = vi.fn();
		const tool = await mount({
			onSubmit,
			inputs: {
				email: {
					type: 'email',
					label: 'Email',
					onValidate: () => new Promise((resolve) => setTimeout(() => resolve(false), 20))
				}
			}
		});
		const controller = new AbortController();
		const running = tool.execute({ email: 'a@b.co' }, { signal: controller.signal });
		await new Promise((resolve) => setTimeout(resolve, 5));
		controller.abort();
		expect((await running).status).toBe('cancelled');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('errors the handler set do not hide that it ran', async () => {
		let form: FormState<FormInputs> | undefined;
		const tool = await mount({
			onForm: (state: FormState<FormInputs>) => (form = state),
			onSubmit: () => form?.setErrors({ email: 'Already taken' })
		});
		const result = await tool.execute({ email: 'a@b.co' }, {});
		expect(result.status).toBe('submitted');
		expect(result.errors).toEqual({ email: ['Already taken'] });
	});

	test('follows the form: a disabled form is no tool', async () => {
		const { rerender } = render(FormToolHarness, { webmcp: true, title: 'Sign up', inputs });
		await waitFor(() => expect(tools.has('sign_up')).toBe(true));
		await rerender({ webmcp: true, title: 'Sign up', inputs, disabled: true });
		await waitFor(() => expect(tools.size).toBe(0));
	});
});

describe('exposure to other origins', () => {
	test('narrowing it reaches the browser', async () => {
		const { rerender } = render(FormToolHarness, {
			webmcp: true,
			title: 'Sign up',
			inputs,
			tool: { exposedTo: ['https://partner.example'] }
		});
		await waitFor(() => expect(exposure.get('sign_up')).toEqual(['https://partner.example']));
		await rerender({ webmcp: true, title: 'Sign up', inputs, tool: {} });
		await waitFor(() => expect(exposure.get('sign_up')).toBeUndefined());
	});
});

describe('ask() under <Theme webmcp>', () => {
	const dialog = {
		title: 'Rename',
		inputs: { name: { type: 'text', label: 'Name', required: true } },
		confirm: 'Save',
		cancel: 'Keep'
	} as const;

	test('the open dialog replaces the page tools, and answers its promise', async () => {
		await mount({ onSubmit: () => {} });
		const outcome = ask(dialog);
		await waitFor(() => expect(tools.has('answer_dialog')).toBe(true));
		await waitFor(() =>
			expect([...tools.keys()].sort()).toEqual(['answer_dialog', 'cancel_dialog'])
		);
		expect(tools.get('answer_dialog')?.description).toContain('"Save"');

		const tool = tools.get('answer_dialog') as Tool;
		expect(await tool.execute({ name: 'Apollo' }, {})).toMatchObject({ status: 'submitted' });
		await expect(outcome).resolves.toEqual({ submitted: true, value: { name: 'Apollo' } });
		await waitFor(() => expect([...tools.keys()]).toEqual(['sign_up']));
	});

	test('cancel_dialog dismisses it as the Cancel button does', async () => {
		await mount();
		const outcome = ask(dialog);
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));
		await (tools.get('cancel_dialog') as Tool).execute({}, {});
		await expect(outcome).resolves.toMatchObject({ submitted: false });
	});

	test('stacked dialogs: only the top one answers', async () => {
		await mount();
		const lower = ask(dialog);
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));
		const upper = ask({ ...dialog, title: 'Second' });
		const lowerTool = tools.get('cancel_dialog') as Tool;
		// The lower dialog's tool steps aside: the name now belongs to the top dialog.
		await waitFor(() => expect(tools.get('cancel_dialog')).not.toBe(lowerTool));
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));
		await (tools.get('cancel_dialog') as Tool).execute({}, {});
		await expect(upper).resolves.toMatchObject({ submitted: false });
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));
		await (tools.get('cancel_dialog') as Tool).execute({}, {});
		await lower;
	});

	test('a disabled button has no tool', async () => {
		await mount();
		const outcome = ask({
			...dialog,
			confirm: { text: 'Save', disabled: true },
			cancel: { text: 'Keep', disabled: true }
		});
		const save = await screen.findByRole('button', { name: 'Save' });
		// Past the delay that lets buttons offer themselves: the close button must not.
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.size).toBe(0);
		expect(save).toBeDisabled();
		screen.getByRole('button', { name: 'Close' }).click();
		await outcome;
	});

	test('tool: false still pauses the page, which is out of reach', async () => {
		await mount();
		const outcome = ask({ ...dialog, tool: false });
		await waitFor(() => expect(tools.has('sign_up')).toBe(false));
		screen.getByRole('button', { name: 'Keep' }).click();
		await outcome;
		await waitFor(() => expect(tools.has('sign_up')).toBe(true));
	});

	test('turning the Theme option off takes the dialog tools away', async () => {
		const { rerender } = render(FormToolHarness, { webmcp: true, title: 'Sign up', inputs });
		await waitFor(() => expect(tools.has('sign_up')).toBe(true));
		const outcome = ask(dialog);
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));
		await rerender({ webmcp: false, title: 'Sign up', inputs });
		await waitFor(() => expect(tools.size).toBe(0));
		screen.getByRole('button', { name: 'Keep' }).click();
		await outcome;
	});

	test('tool: false keeps the dialog from agents', async () => {
		await mount();
		const outcome = ask({ ...dialog, tool: false });
		await screen.findByRole('dialog');
		expect(tools.has('answer_dialog')).toBe(false);
		expect(tools.has('cancel_dialog')).toBe(false);
		screen.getByRole('button', { name: 'Keep' }).click();
		await outcome;
	});
});
