// What `click_button` offers in real engines, where visibility and layout are real: Marquee's
// repeated copies stay out, names leave out what a screen reader skips, and an off zone is gone.
import { afterEach, beforeEach, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AgentReachHarness from './AgentReachHarness.test.svelte';

type Tool = {
	name: string;
	inputSchema: { properties: Record<string, { enum?: string[]; oneOf?: { title: string }[] }> };
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
afterEach(() => {
	delete (document as unknown as { modelContext?: unknown }).modelContext;
});

const offered = async (name = 'click_button') => {
	await expect.poll(() => tools.has(name)).toBe(true);
	// The shared list settles a moment after the page mounts.
	await new Promise((resolve) => setTimeout(resolve, 120));
	return tools.get(name) as Tool;
};

test('Marquee’s aria-hidden copies are not offered next to the real button', async () => {
	render(AgentReachHarness, { scenario: 'decorative' });
	const click = await offered();
	expect(click.inputSchema.properties.id.enum).toEqual(['open']);
	expect(tools.has('read_buttons')).toBe(false);
});

test('names are what a screen reader announces', async () => {
	render(AgentReachHarness, { scenario: 'names' });
	const click = await offered();
	expect(click.inputSchema.properties.id.oneOf?.map(({ title }) => title)).toEqual([
		'Save',
		'Archive the thread',
		'Close panel'
	]);
});

test('an off zone takes its buttons and its components’ tools', async () => {
	render(AgentReachHarness, { scenario: 'off' });
	const click = await offered();
	expect(click.inputSchema.properties.id.enum).toEqual(['outside']);
	expect(tools.has('select_tab')).toBe(false);
});
