// What an agent reaches and how it is told no: decorative subtrees, accessible names, the
// `data-webmcp-off` zone, refusals that say what to do, and the agent as the source of a change.
import '@testing-library/jest-dom/vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';
import AgentReachHarness from './AgentReachHarness.test.svelte';
import { isAgentAction } from './webmcp.agent.js';

type Tool = {
	name: string;
	description: string;
	inputSchema: {
		properties: Record<string, { enum?: string[]; oneOf?: { const: string; title: string }[] }>;
	};
	execute: (input: Record<string, unknown>, options: object) => Promise<Record<string, unknown>>;
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
	Element.prototype.scrollIntoView ??= vi.fn();
	Element.prototype.getAnimations ??= () => [];
});
afterEach(async () => {
	cleanup();
	// The shared tools refresh a moment after a component leaves.
	await new Promise((resolve) => setTimeout(resolve, 80));
	vi.restoreAllMocks();
	delete (document as unknown as { modelContext?: unknown }).modelContext;
});

const tool = async (name: string): Promise<Tool> => {
	await waitFor(() => expect(tools.has(name)).toBe(true));
	return tools.get(name) as Tool;
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

const titles = (found: Tool) => found.inputSchema.properties.id.oneOf?.map(({ title }) => title);

describe('aria-hidden and accessible names', () => {
	test('a button in an aria-hidden subtree is not offered, so its visible twin is no homonym', async () => {
		render(AgentReachHarness, { scenario: 'decorative' });
		const click = await tool('click_button');
		await settle();
		expect(click.inputSchema.properties.id.enum).toEqual(['open']);
		expect(titles(click)).toEqual(['Open']);
		expect(tools.has('read_buttons')).toBe(false);
	});

	test('names come from aria-labelledby, then aria-label, then the announced text', async () => {
		render(AgentReachHarness, { scenario: 'names' });
		const click = await tool('click_button');
		await settle();
		expect(titles(click)).toEqual(['Save', 'Archive the thread', 'Close panel']);
	});
});

describe('data-webmcp-off', () => {
	test('takes a subtree from agents: its buttons and its components’ tools', async () => {
		render(AgentReachHarness, { scenario: 'off' });
		const click = await tool('click_button');
		await settle();
		expect(click.inputSchema.properties.id.enum).toEqual(['outside']);
		expect(tools.has('select_tab')).toBe(false);
	});

	test('data-webmcp-off={false} leaves the subtree to agents', async () => {
		render(AgentReachHarness, { scenario: 'off', off: false });
		await tool('select_tab');
		await waitFor(() =>
			expect(tools.get('click_button')?.inputSchema.properties.id.enum).toContain('inside')
		);
	});

	test('the text of a zone is not context for the buttons around it', async () => {
		render(AgentReachHarness, { scenario: 'off-context' });
		const read = await tool('read_buttons');
		const { options } = (await read.execute({}, {})) as unknown as {
			options: { context: string }[];
		};
		expect(options.map(({ context }) => context)).toEqual(['Row one', 'Row two']);
	});

	test('a Form placed in a zone has no tool', async () => {
		render(AgentReachHarness, { scenario: 'off-form' });
		await tool('profile');
		await settle();
		expect(tools.has('vault')).toBe(false);
	});
});

describe('refusals say what is there and what to do', () => {
	test('a stale id says the list changed and gives the current ids', async () => {
		render(AgentReachHarness, { scenario: 'names' });
		const click = await tool('click_button');
		const result = await click.execute({ id: 'gone' }, {});
		expect(result).toMatchObject({
			status: 'unavailable',
			id: 'gone',
			current: ['save', 'archive_the_thread', 'close_panel']
		});
		expect(result.message).toMatch(/the list changed/);
	});

	test('a list past its limit says how many it leaves out and how to reach them', async () => {
		render(AgentReachHarness, { scenario: 'many', count: 103 });
		const click = await tool('click_button');
		await waitFor(() => expect(click.inputSchema.properties.id.enum).toHaveLength(100));
		const latest = await tool('click_button');
		expect(latest.description).toMatch(/3 more are on the page but not listed/);
		expect(latest.description).toMatch(/a search, a filter/);
	});
});

describe('the agent as the source of a change', () => {
	test('an overlay a tool opens reports interaction "agent", and can cancel it', async () => {
		const seen: OpenChangeDetails[] = [];
		const onOpenChange = vi.fn((open: boolean, details: OpenChangeDetails) => {
			seen.push(details);
			details.cancel();
		});
		const { getByText } = render(AgentReachHarness, { scenario: 'popover', onOpenChange });
		const click = await tool('click_button');
		expect(await click.execute({ id: 'details' }, {})).toMatchObject({ status: 'pressed' });
		expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
		expect(seen[0]).toMatchObject({ reason: 'trigger-press', interaction: 'agent' });
		// Cancelled like any other change: nothing opened.
		expect(getByText('Details').closest('button')).toHaveAttribute('aria-expanded', 'false');
	});

	test('a value a form tool writes runs its callbacks as the agent’s', async () => {
		const sources: boolean[] = [];
		render(AgentReachHarness, {
			scenario: 'off-form',
			onValueChange: () => sources.push(isAgentAction())
		});
		await (await tool('profile')).execute({ email: 'ada@example.com', note: 'hi' }, {});
		expect(sources.length).toBeGreaterThan(0);
		expect(sources.every(Boolean)).toBe(true);
		expect(isAgentAction()).toBe(false);
	});
});
