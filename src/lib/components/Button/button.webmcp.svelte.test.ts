import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ask } from '../Form/Ask/ask.js';
import ButtonToolHarness from './ButtonToolHarness.test.svelte';
import FieldButtonHarness from './FieldButtonHarness.test.svelte';

type Tool = {
	name: string;
	annotations: { consequentialHint: boolean };
	inputSchema: {
		properties: { id: { enum: string[]; oneOf: { const: string; title: string }[] } };
	};
	execute: (input: { id: string }, options: object) => Promise<Record<string, unknown>>;
};

let tools: Map<string, Tool>;

beforeEach(() => {
	tools = new Map();
	Object.defineProperty(document, 'modelContext', {
		configurable: true,
		value: {
			registerTool: (tool: Tool, { signal }: { signal: AbortSignal }) => {
				tools.set(tool.name, tool);
				signal.addEventListener('abort', () => {
					if (tools.get(tool.name) === tool) tools.delete(tool.name);
				});
				return Promise.resolve();
			}
		}
	});
});
afterEach(async () => {
	// The tools outlive a test by the refresh delay; the next test has its own context.
	cleanup();
	await new Promise((resolve) => setTimeout(resolve, 80));
	delete (document as unknown as { modelContext?: unknown }).modelContext;
});

const ids = (name: string) => tools.get(name)?.inputSchema.properties.id.enum;

describe('Button under <Theme webmcp>', () => {
	test('stays away from agents unless the Theme asks', async () => {
		render(ButtonToolHarness, { buttons: [{ text: 'Save' }] });
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.size).toBe(0);
	});

	test('offers what a person could press, named from its text', async () => {
		render(ButtonToolHarness, {
			webmcp: true,
			buttons: [
				{ text: 'Enregistrer le brouillon' },
				{ text: 'Off', disabled: true },
				{ text: 'Busy', loading: true },
				{ text: 'Private', tool: false },
				{ text: 'Away', href: 'https://example.com/' }
			]
		});
		await waitFor(() => expect(ids('click_button')).toEqual(['enregistrer_le_brouillon']));
		expect(tools.get('click_button')?.annotations.consequentialHint).toBe(false);
	});

	test('a danger button has its own tool, which the browser may confirm', async () => {
		render(ButtonToolHarness, {
			webmcp: true,
			buttons: [
				{ text: 'Delete', color: 'danger' },
				{ text: 'Publish', tool: { consequential: true } },
				{ text: 'Harmless', color: 'danger', tool: { consequential: false } }
			]
		});
		await waitFor(() => expect(ids('click_danger_button')).toEqual(['delete', 'publish']));
		expect(ids('click_button')).toEqual(['harmless']);
		expect(tools.get('click_danger_button')?.annotations.consequentialHint).toBe(true);
	});

	test('two buttons with one text stay apart, and a press reaches the handler', async () => {
		const first = vi.fn();
		const second = vi.fn();
		render(ButtonToolHarness, {
			webmcp: true,
			buttons: [
				{ text: 'Save', onclick: first, label: 'Save' },
				{ text: 'Save too', onclick: second, label: 'Save' }
			]
		});
		await waitFor(() => expect(ids('click_button')).toEqual(['save', 'save_2']));
		await tools.get('click_button')?.execute({ id: 'save_2' }, {});
		expect(second).toHaveBeenCalledOnce();
		expect(first).not.toHaveBeenCalled();
	});

	test("a button inside a field control is the form tool's business", async () => {
		render(FieldButtonHarness);
		await waitFor(() => expect(ids('click_button')).toEqual(['outside']));
	});

	test('the page buttons come back when a modal closes', async () => {
		const save = { text: 'Save' };
		const { rerender } = render(ButtonToolHarness, { webmcp: true, ask: true, buttons: [save] });
		await waitFor(() => expect(ids('click_button')).toEqual(['save']));

		const outcome = ask({ title: 'Sure?', inputs: {}, confirm: 'Yes', cancel: 'No' });
		await waitFor(() => expect(tools.has('cancel_dialog')).toBe(true));

		// The list is rebuilt while the page is inert behind the modal.
		const page = screen.getByTestId('page');
		page.setAttribute('inert', '');
		await rerender({ webmcp: true, ask: true, buttons: [save, { text: 'More' }] });
		await new Promise((resolve) => setTimeout(resolve, 80));
		page.removeAttribute('inert');

		await tools.get('cancel_dialog')?.execute({ id: '' }, {});
		await outcome;
		await waitFor(() => expect(ids('click_button')).toEqual(['save', 'more']));
	});

	test('a button disabled since the list was built cannot be pressed', async () => {
		const onclick = vi.fn();
		const buttons = [{ text: 'Save', onclick }];
		const { rerender } = render(ButtonToolHarness, { webmcp: true, buttons });
		await waitFor(() => expect(tools.has('click_button')).toBe(true));
		const tool = tools.get('click_button') as Tool;
		await rerender({ webmcp: true, buttons: [{ text: 'Save', onclick, disabled: true }] });
		expect((await tool.execute({ id: 'save' }, {})).status).toBe('unavailable');
		expect(onclick).not.toHaveBeenCalled();
		await waitFor(() => expect(tools.has('click_button')).toBe(false));
	});
});
