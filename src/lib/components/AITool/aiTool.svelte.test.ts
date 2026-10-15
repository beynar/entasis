import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, within } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AITool from './AITool.svelte';
import { getAIToolStatusFromState } from './index.js';
import { getAIToolSummary, getAIToolTitle, resolveAIToolStatus } from './toolRendering.js';

afterEach(() => {
	vi.useRealTimers();
});

function rowFor(name: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(name) });
}

describe('AITool statuses', () => {
	test('maps every AI SDK tool part state onto a status', () => {
		expect(getAIToolStatusFromState('input-streaming')).toBe('streaming');
		expect(getAIToolStatusFromState('input-available')).toBe('running');
		expect(getAIToolStatusFromState('approval-requested')).toBe('approval-requested');
		expect(getAIToolStatusFromState('approval-responded')).toBe('approval-responded');
		expect(getAIToolStatusFromState('output-available')).toBe('success');
		expect(getAIToolStatusFromState('output-error')).toBe('error');
		expect(getAIToolStatusFromState('output-denied')).toBe('output-denied');
		expect(getAIToolStatusFromState('something-new')).toBeUndefined();
	});

	test('approval requests and denials are settled, labelled, and never spin', () => {
		const { container } = renderInTheme(AITool, {
			tools: [
				{ id: 'deploy', name: 'deploy', status: 'approval-requested' },
				{ id: 'drop', name: 'dropTable', status: 'output-denied' },
				{ id: 'wipe', name: 'wipe', status: 'approval-responded', approval: { approved: false } }
			],
			defaultValue: ['deploy']
		});
		const calls = container.querySelectorAll('[data-slot="ai-tool-call-trigger-content"]');
		expect(calls).toHaveLength(3);
		expect(calls[0]).toHaveAttribute('data-tone', 'awaiting');
		expect(calls[0]).toHaveTextContent('Awaiting approval');
		expect(calls[1]).toHaveAttribute('data-tone', 'denied');
		expect(calls[1]).toHaveTextContent('Denied');
		expect(calls[2]).toHaveAttribute('data-tone', 'denied');
		expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
		// The group mark and the call mark both carry the status as their accessible name.
		expect(screen.getAllByRole('img', { name: 'Awaiting approval' })).toHaveLength(2);
	});

	test('a declined approval resolves to denied, an approved one keeps running', () => {
		expect(
			resolveAIToolStatus({ status: 'approval-responded', approval: { approved: false } })
		).toBe('output-denied');
		expect(
			resolveAIToolStatus({ status: 'approval-responded', approval: { approved: true } })
		).toBe('approval-responded');
	});

	test('status reads by glyph and word, and the spinner takes the status colour', () => {
		const { container } = renderInTheme(AITool, {
			tools: [
				{ id: 'a', name: 'search', status: 'running' },
				{ id: 'b', name: 'read', output: 'ok' },
				{ id: 'c', name: 'write', error: 'Disk full' }
			],
			defaultValue: ['a']
		});
		const spinner = container.querySelector('[data-slot="spinner"]');
		expect(spinner).toHaveAttribute('data-color', 'info');
		expect(screen.getByRole('img', { name: 'Done' }).querySelector('svg')).not.toBeNull();
		for (const mark of screen.getAllByRole('img', { name: 'Failed' })) {
			expect(mark.querySelector('svg')).not.toBeNull();
		}
		expect(rowFor('Write')).toHaveTextContent('Failed');
		// The group header carries the most urgent status as a word too.
		expect(container.querySelector('[data-slot="ai-tool-group-status"]')).toHaveTextContent(
			'Failed'
		);
	});
});

describe('AITool header anatomy', () => {
	test('humanizes raw tool names unless a distinct title is given', () => {
		expect(getAIToolTitle({ name: 'searchDocs' }, 'Tool')).toBe('Search docs');
		expect(getAIToolTitle({ name: 'analyze_release' }, 'Tool')).toBe('Analyze release');
		expect(getAIToolTitle({ name: 'mcp__github__list_issues' }, 'Tool')).toBe('List issues');
		expect(getAIToolTitle({ name: 'getURL', title: 'getURL' }, 'Tool')).toBe('Get URL');
		expect(getAIToolTitle({ name: 'read', title: 'Read launch plan' }, 'Tool')).toBe(
			'Read launch plan'
		);
		expect(getAIToolTitle({}, 'Tool call')).toBe('Tool call');
	});

	test('shows a quoted one-line input summary that a call can override or hide', () => {
		expect(getAIToolSummary({ input: { query: 'launch  risk' } })).toBe('"launch risk"');
		expect(getAIToolSummary({ input: { page: 3 } })).toBe('3');
		expect(getAIToolSummary({ input: { query: 'x' }, summary: '' })).toBeUndefined();
		renderInTheme(AITool, { tool: { name: 'searchDocs', input: { query: 'launch risk' } } });
		expect(screen.getByText('"launch risk"')).toHaveAttribute('data-slot', 'ai-tool-call-summary');
		expect(screen.getByText('Search docs')).toHaveAttribute('data-slot', 'ai-tool-call-title');
	});

	test('summarizes a group by its tools and keeps the summary overridable', async () => {
		const tools = [
			{ id: 'one', name: 'searchDocs', output: 1 },
			{ id: 'two', name: 'searchDocs', output: 2 }
		];
		const { container, rerender } = renderInTheme(AITool, { tools });
		expect(container.querySelector('[data-slot="ai-tool-group-title"]')).toHaveTextContent(
			'Search docs · 2 calls'
		);
		await rerender({
			tools: [...tools, { id: 'three', name: 'readFile', output: 3 }],
			labels: { group: (count: number) => `${count} steps` }
		});
		expect(container.querySelector('[data-slot="ai-tool-group-title"]')).toHaveTextContent(
			'3 steps'
		);
	});

	test('one call and a group share the container-bound surface of their variant', () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'search', output: 'ok' },
			variant: 'card'
		});
		const root = container.querySelector('[data-slot="ai-tool"]');
		expect(root?.className).toContain('w-full');
		expect(root?.className).toContain('max-w-[32rem]');
		expect(root?.className).not.toContain('100vw');
		expect(root?.className).toContain('rounded-lg');
		// A lone call no longer gets the Accordion outline frame on top of its variant.
		expect(container.querySelector('[data-variant="outline"]')).toBeNull();
	});

	test('soft tints stay visible on dark surfaces', () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'search', output: 'ok' },
			variant: 'soft'
		});
		expect(container.querySelector('[data-slot="ai-tool"]')?.className).toContain(
			'dark:bg-success/10'
		);
	});

	test('shows a final duration and a live elapsed time while running', async () => {
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
		vi.setSystemTime(new Date('2026-10-15T10:00:00Z'));
		const { container, rerender } = renderInTheme(AITool, {
			tool: { id: 'job', name: 'build', status: 'running', startedAt: Date.now() - 6_000 }
		});
		const duration = () =>
			container.querySelector('[data-slot="ai-tool-call-duration"]')?.textContent;
		expect(duration()).toBe('6s');
		vi.advanceTimersByTime(2_000);
		flushSync();
		expect(duration()).toBe('8s');
		await rerender({ tool: { id: 'job', name: 'build', output: 'ok', duration: 72_000 } });
		expect(duration()).toBe('1m 12s');
		expect(rowFor('Build')).not.toHaveTextContent('Running');
	});
});

describe('AITool values', () => {
	test('renders a primitive error as one sentence without a value key', () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'deploy', error: new Error('Deployment was rejected') },
			defaultValue: ['0']
		});
		const error = container.querySelector('[data-slot="ai-tool-error"]');
		expect(error).not.toBeNull();
		expect(
			within(error as HTMLElement)
				.getByText('Deployment was rejected')
				.tagName.toLowerCase()
		).toBe('p');
		expect(error).not.toHaveTextContent('value');
		expect(error?.querySelector('[data-slot="ai-tool-value-tree"]')).toBeNull();
		expect(container.querySelector('[data-slot="ai-tool-value-label"]')).toHaveTextContent('Error');
	});

	test('labels sections with words and shows wrapped, copyable JSON', () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'search', input: { query: 'launch risk' }, output: { matches: 3 } },
			defaultValue: ['0']
		});
		const labels = [...container.querySelectorAll('[data-slot="ai-tool-value-label"]')];
		expect(labels.map((label) => label.textContent?.trim())).toEqual(['Input', 'Output']);
		const code = container.querySelectorAll('[data-slot="code"]');
		expect(code).toHaveLength(2);
		expect(code[0]).toHaveTextContent('"query": "launch risk"');
		expect(code[0]?.querySelector('pre')).toHaveAttribute('data-wrap');
		expect(
			within(code[0] as HTMLElement).getByRole('button', { name: 'Copy' })
		).toBeInTheDocument();
	});

	test('the tree view quotes strings and drops array index keys', () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'search', output: { ids: ['3', 3] } },
			valueView: 'tree',
			defaultValue: ['0']
		});
		const tree = container.querySelector('[data-slot="ai-tool-value-tree"]') as HTMLElement;
		const values = [...tree.querySelectorAll('[data-slot="ai-tool-value-tree-value"]')].map(
			(node) => node.textContent
		);
		expect(values).toEqual(['"3"', '3']);
		expect(tree).not.toHaveTextContent('[0]');
		expect(tree).toHaveTextContent('2 items');
		expect(tree.querySelector('[data-slot="ai-tool-value-tree-value"]')?.className).toContain(
			'whitespace-pre-wrap'
		);
	});

	test('collapses a long value behind Show all instead of a silent scroll cap', async () => {
		const { container } = renderInTheme(AITool, {
			tool: { name: 'list', output: Array.from({ length: 30 }, (_, index) => index) },
			defaultValue: ['0']
		});
		const value = container.querySelector('[data-slot="ai-tool-value-content"]');
		expect(value).toHaveAttribute('data-collapsed', 'true');
		const toggle = screen.getByRole('button', { name: 'Show all' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.click(toggle);
		expect(value).not.toHaveAttribute('data-collapsed');
		expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	});

	test('keeps circular values bounded in the JSON view', () => {
		const circular: Record<string, unknown> = { name: 'plan' };
		circular.self = circular;
		const { container } = renderInTheme(AITool, {
			tool: { name: 'read', output: circular },
			defaultValue: ['0']
		});
		expect(container.querySelector('[data-slot="code"]')).toHaveTextContent(
			'"self": "[Circular reference]"'
		);
	});
});
