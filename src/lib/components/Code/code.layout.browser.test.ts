// Code in a real browser: in a height-bound flex column (a Dialog body) it scrolls inside, under
// its kept header, instead of clipping its last lines; and `wrap` and `tabSize` hold against an
// app stylesheet that styles every `pre.th-code` (edytor's `code.css` does, unlayered).
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeLayoutHarness from './CodeLayoutHarness.test.svelte';

const lines = Array.from({ length: 120 }, (_, index) => `const line${index + 1} = ${index + 1};`);
const longLine =
	'const message = "a long line of code that runs far past the edge of a narrow side panel";';

const root = () => document.querySelector<HTMLElement>('[data-slot="code"]')!;
const viewport = () => root().querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
const pre = () => root().querySelector<HTMLElement>('pre')!;
const rect = (element: Element) => element.getBoundingClientRect();

let editorStylesheet: HTMLStyleElement;
beforeAll(() => {
	editorStylesheet = document.createElement('style');
	editorStylesheet.textContent =
		'pre.th-code { overflow-x: auto; white-space: pre; word-break: normal; tab-size: 8; }';
	document.head.append(editorStylesheet);
});
afterAll(() => editorStylesheet.remove());

describe('Code in a height-bound flex column', () => {
	test('it scrolls inside, under its header, and every line can be reached', async () => {
		render(CodeLayoutHarness, { code: lines.join('\n'), showLineNumbers: true });
		const panel = document.querySelector('[data-testid="panel"]')!;

		expect(rect(root()).bottom).toBeLessThanOrEqual(rect(panel).bottom + 0.5);
		expect(viewport().scrollHeight).toBeGreaterThan(viewport().clientHeight);
		// The viewport ends inside the root: nothing is clipped below the scroll region.
		expect(rect(viewport()).bottom).toBeLessThanOrEqual(rect(root()).bottom + 0.5);

		const header = root().firstElementChild as HTMLElement;
		const headerTop = rect(header).top;
		viewport().scrollTop = viewport().scrollHeight;
		await new Promise(requestAnimationFrame);
		expect(rect(header).top).toBe(headerTop);
		const last = [...root().querySelectorAll('.th-line')].at(-1)!;
		expect(rect(last).bottom).toBeLessThanOrEqual(rect(viewport()).bottom + 0.5);
		expect(rect(last).top).toBeGreaterThanOrEqual(rect(viewport()).top);
	});

	test('with shrink-0 it keeps its full height instead, for the column to scroll', () => {
		render(CodeLayoutHarness, { code: lines.join('\n'), class: 'shrink-0' });
		expect(rect(root()).height).toBeGreaterThan(300);
		expect(viewport().scrollHeight).toBeLessThanOrEqual(viewport().clientHeight + 1);
	});

	test('maxHeight still caps the block and scrolls inside it', () => {
		render(CodeLayoutHarness, { code: lines.join('\n'), maxHeight: 120 });
		expect(rect(viewport()).height).toBeLessThanOrEqual(120.5);
		expect(viewport().scrollHeight).toBeGreaterThan(viewport().clientHeight);
	});

	test('a short Code keeps its own height', () => {
		render(CodeLayoutHarness, { code: lines.slice(0, 3).join('\n') });
		expect(viewport().scrollHeight).toBeLessThanOrEqual(viewport().clientHeight + 1);
		expect(rect(root()).height).toBeLessThan(300);
	});
});

describe('Code against an app stylesheet on pre.th-code', () => {
	test('wrap soft-wraps long lines', () => {
		render(CodeLayoutHarness, { code: longLine, wrap: true });
		expect(getComputedStyle(pre()).whiteSpace).toBe('pre-wrap');
		expect(viewport().scrollWidth).toBeLessThanOrEqual(viewport().clientWidth + 1);
		expect(rect(pre()).right).toBeLessThanOrEqual(rect(root()).right + 0.5);
	});

	test('wrap soft-wraps with line numbers too', () => {
		render(CodeLayoutHarness, { code: longLine, wrap: true, showLineNumbers: true });
		expect(getComputedStyle(pre()).whiteSpace).toBe('pre-wrap');
		expect(viewport().scrollWidth).toBeLessThanOrEqual(viewport().clientWidth + 1);
	});

	test('without wrap a long line scrolls sideways in the scroll area', () => {
		render(CodeLayoutHarness, { code: longLine });
		expect(getComputedStyle(pre()).whiteSpace).toBe('pre');
		expect(viewport().scrollWidth).toBeGreaterThan(viewport().clientWidth);
	});

	test('tabSize wins over the app stylesheet', () => {
		render(CodeLayoutHarness, { code: '\tindented', tabSize: 4 });
		expect(getComputedStyle(pre()).tabSize).toBe('4');
	});
});
