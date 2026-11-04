import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	holdWebMCPSurface,
	registerWebMCPTool,
	toToolName,
	webmcpSupported
} from './webmcp.registry.js';
import type { WebMCPTool } from './webmcp.types.js';

type Registered = { tool: { name: string } & Record<string, unknown>; signal?: AbortSignal };

const installContext = (host: 'document' | 'navigator' = 'document') => {
	const registered: Registered[] = [];
	const context = {
		registerTool: vi.fn((tool: Registered['tool'], options?: { signal?: AbortSignal }) => {
			registered.push({ tool, signal: options?.signal });
			return Promise.resolve();
		}),
		unregisterTool: host === 'navigator' ? vi.fn() : undefined
	};
	Object.defineProperty(host === 'document' ? document : navigator, 'modelContext', {
		value: context,
		configurable: true
	});
	return { context, registered };
};

const active = (registered: Registered[]) =>
	registered.filter(({ signal }) => !signal?.aborted).map(({ tool }) => tool.name);

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const tool = (name: string, description = 'Does a thing.'): WebMCPTool => ({
	name,
	description,
	execute: () => 'ok'
});

afterEach(() => {
	delete (document as unknown as { modelContext?: unknown }).modelContext;
	delete (navigator as unknown as { modelContext?: unknown }).modelContext;
});

describe('toToolName', () => {
	test('keeps only what a tool name may hold', () => {
		expect(toToolName('Créer un compte !')).toBe('creer_un_compte');
		expect(toToolName('  --  ')).toBeUndefined();
		expect(toToolName('تسجيل')).toBeUndefined();
		expect(toToolName(undefined)).toBeUndefined();
	});
});

describe('registerWebMCPTool', () => {
	test('does nothing without the browser API', async () => {
		expect(webmcpSupported()).toBe(false);
		const handle = registerWebMCPTool(tool('quiet'));
		await flush();
		expect(() => handle.remove()).not.toThrow();
	});

	test('gives every tool a unique name and frees it on removal', async () => {
		const { registered } = installContext();
		const first = registerWebMCPTool(tool('form'));
		const second = registerWebMCPTool(tool('form'));
		await flush();
		expect(active(registered)).toEqual(['form', 'form_2']);

		first.remove();
		second.remove();
		await flush();
		expect(active(registered)).toEqual([]);
	});

	test('registers again only when what the agent sees changes', async () => {
		const { context, registered } = installContext();
		const handle = registerWebMCPTool(tool('same'));
		await flush();
		handle.update({ ...tool('same'), execute: () => 'new handler' });
		await flush();
		expect(context.registerTool).toHaveBeenCalledTimes(1);

		const execute = registered[0].tool.execute as (input: unknown) => unknown;
		expect(execute({})).toBe('new handler');

		handle.update(tool('same', 'Does another thing.'));
		await flush();
		expect(context.registerTool).toHaveBeenCalledTimes(2);
		expect(active(registered)).toEqual(['same']);
		handle.remove();
	});

	test('a modal tool pauses the page tools until it leaves', async () => {
		const { registered } = installContext();
		const page = registerWebMCPTool(tool('page'));
		await flush();
		const modal = registerWebMCPTool(tool('page'), { modal: true });
		await flush();
		// The same name is free on another surface: only one surface is registered at a time.
		expect(active(registered)).toEqual(['page']);
		expect(registered.at(-1)?.signal?.aborted).toBe(false);

		modal.remove();
		await flush();
		expect(active(registered)).toEqual(['page']);
		page.remove();
	});

	test('only the topmost modal keeps its tools, even a modal without any', async () => {
		const { registered } = installContext();
		const page = registerWebMCPTool(tool('page'));
		const first = registerWebMCPTool(tool('first'), { modal: 'a' });
		const second = registerWebMCPTool(tool('second'), { modal: 'b' });
		await flush();
		// Nothing is open yet: a surface's tools wait for it.
		expect(active(registered)).toEqual(['page']);

		const releaseA = holdWebMCPSurface('a');
		await flush();
		expect(active(registered)).toEqual(['first']);

		const releaseB = holdWebMCPSurface('b');
		await flush();
		expect(active(registered)).toEqual(['second']);

		const releaseC = holdWebMCPSurface('c');
		await flush();
		expect(active(registered)).toEqual([]);

		releaseC();
		releaseB();
		await flush();
		expect(active(registered)).toEqual(['first']);

		releaseA();
		await flush();
		expect(active(registered)).toEqual(['page']);
		for (const handle of [page, first, second]) handle.remove();
	});

	test('a change of exposure registers again', async () => {
		const { context } = installContext();
		const shared = tool('shared');
		const handle = registerWebMCPTool(shared, { exposedTo: ['https://partner.example'] });
		await flush();
		handle.update(shared, { exposedTo: undefined });
		await flush();
		expect(context.registerTool).toHaveBeenCalledTimes(2);
		expect(context.registerTool.mock.lastCall?.[1]).not.toHaveProperty('exposedTo');
		handle.remove();
	});

	test('every name respects the browser rules', async () => {
		const { registered } = installContext();
		const long = 'a'.repeat(128);
		const handles = [long, long, 'with space'].map((name) => registerWebMCPTool(tool(name)));
		await flush();
		const names = active(registered);
		expect(names.every((name) => /^[A-Za-z0-9_.-]{1,128}$/.test(name))).toBe(true);
		expect(new Set(names).size).toBe(3);
		for (const handle of handles) handle.remove();
	});

	test('a registration the browser refuses does not count as done', async () => {
		const { context } = installContext();
		context.registerTool.mockImplementationOnce(() => Promise.reject(new Error('taken')));
		const handle = registerWebMCPTool(tool('refused'));
		await flush();
		await flush();
		await flush();
		handle.update(tool('refused'));
		await flush();
		expect(context.registerTool).toHaveBeenCalledTimes(2);
		handle.remove();
	});

	test('falls back on navigator and removes by name on older Chrome', async () => {
		const { context } = installContext('navigator');
		const handle = registerWebMCPTool(tool('legacy'));
		await flush();
		expect(context.registerTool).toHaveBeenCalledOnce();
		handle.remove();
		expect(context.unregisterTool).toHaveBeenCalledWith('legacy');
	});
});
