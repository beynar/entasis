// AIComposer in real browsers (Chromium and WebKit): Enter or Send keeps the editor focused, the
// draft clears after a direct onSubmit, the footer fits a phone, the focus ring follows the
// editor only, Escape leaves a queued-message edit, and AIChat's composer sends on Enter.
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import type { AIComposerQueuedMessage } from './aiComposer.props.js';
import Harness from './AIComposerBrowserHarness.test.svelte';

type Props = NonNullable<Parameters<typeof Harness>[1]>;
const mount = (props: Props = {}) => render(Harness, { props });
const editor = () => document.querySelector<HTMLElement>('[role="textbox"][contenteditable]')!;
const composer = () => document.querySelector<HTMLFormElement>('[data-slot="ai-composer"]')!;
const button = (name: string | RegExp) =>
	page.getByRole('button', { name }).element() as HTMLButtonElement;
const rect = (node: Element) => node.getBoundingClientRect();
const editorFocused = () => editor().contains(document.activeElement);

function queued(markdown: string): AIComposerQueuedMessage {
	return {
		id: 'queued-1',
		createdAt: 1,
		markdown,
		modelInput: markdown,
		files: [],
		attachments: [],
		tokens: [],
		commandIds: [],
		fileIds: [],
		mentionIds: [],
		referenceIds: [],
		skillIds: []
	};
}

async function typeInEditor(text: string) {
	await userEvent.click(editor());
	await userEvent.keyboard(text);
}

describe('sending', () => {
	test('Enter sends, the draft clears and the editor keeps focus for the next message', async () => {
		const onSubmit = vi.fn();
		mount({ onSubmit });
		await typeInEditor('Draft a launch plan');
		await userEvent.keyboard('{Enter}');

		await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
		expect(onSubmit.mock.calls[0][0].markdown).toBe('Draft a launch plan');
		await expect.poll(() => editor().textContent).toBe('');
		await expect.poll(editorFocused).toBe(true);

		await userEvent.keyboard('second');
		await expect.poll(() => editor().textContent).toBe('second');
	});

	test('Shift+Enter inserts a newline instead of sending', async () => {
		const onSubmit = vi.fn();
		mount({ onSubmit });
		await typeInEditor('line one');
		await userEvent.keyboard('{Shift>}{Enter}{/Shift}line two');
		await nextFrame();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(editor().innerText).toMatch(/line one\s*\n\s*line two/);
	});

	test('a failing onSubmit keeps the draft, shows the error and returns focus', async () => {
		mount({ fail: true });
		await typeInEditor('Keep me');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => composer().textContent).toContain('The endpoint is unavailable.');
		expect(editor().textContent).toBe('Keep me');
		await expect.poll(editorFocused).toBe(true);
	});

	test('clicking Send keeps focus in the editor (WebKit does not focus a clicked button)', async () => {
		const onSubmit = vi.fn();
		mount({ onSubmit });
		await typeInEditor('Hello');
		await userEvent.click(button('Send message'));
		await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
		await expect.poll(() => editor().textContent).toBe('');
		await expect.poll(editorFocused).toBe(true);
	});

	test('the submit handle sends the given text and focuses the editor', async () => {
		const onSubmit = vi.fn();
		mount({ onSubmit });
		await userEvent.click(button('Submit suggestion'));
		await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
		expect(onSubmit.mock.calls[0][0].markdown).toBe('From a suggestion');
		await expect.poll(() => editor().textContent).toBe('');
		await expect.poll(editorFocused).toBe(true);
	});
});

describe('suggestions and tokens', () => {
	const firstOption = () => document.querySelector<HTMLElement>('[role="option"]');
	const token = (kind: string) => document.querySelector<HTMLElement>(`[data-ai-token="${kind}"]`);

	test('the / and @ menus show a second line and each token kind has its own tint', async () => {
		mount();
		await typeInEditor('/');
		await expect.poll(() => firstOption()?.textContent).toContain('Summarize selected context.');
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' @');
		await expect.poll(() => firstOption()?.textContent).toContain('docs/brief.md');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => token('reference')).not.toBeNull();
		expect(getComputedStyle(token('command')!).backgroundColor).not.toBe(
			getComputedStyle(token('reference')!).backgroundColor
		);
	});
});

describe('focus ring', () => {
	test('rings the composer for the editor, not for a footer button', async () => {
		mount();
		const resting = getComputedStyle(composer()).boxShadow;
		button('Attach files').focus();
		await nextFrame();
		expect(getComputedStyle(composer()).boxShadow).toBe(resting);
		editor().focus();
		await nextFrame();
		expect(getComputedStyle(composer()).boxShadow).not.toBe(resting);
	});
});

describe('busy footer', () => {
	test('a stop button in the send position, plus a queue action once there is a draft', async () => {
		mount({ busy: true });
		const stop = button('Stop response');
		expect(stop.dataset.slot).toBe('ai-composer-stop');
		expect(document.querySelector('[data-slot="ai-composer-queue-action"]')).toBeNull();

		await typeInEditor('Next question');
		await expect
			.poll(() => document.querySelector('[data-slot="ai-composer-queue-action"]'))
			.not.toBeNull();
		const queueAction = button('Queue message');
		expect(rect(queueAction).right).toBeLessThanOrEqual(rect(stop).left);
		// Stop is a solid control, not the soft grey square it used to be.
		expect(getComputedStyle(stop).backgroundColor).not.toBe(
			getComputedStyle(composer()).backgroundColor
		);
	});

	test('the Queue button unmounts once it queues the draft, and focus returns to the editor', async () => {
		mount({ busy: true });
		await typeInEditor('Next question');
		await userEvent.click(button('Queue message'));
		await expect
			.poll(() => document.querySelector('[data-slot="ai-composer-queue-item"]')?.textContent)
			.toContain('Next question');
		expect(document.querySelector('[data-slot="ai-composer-queue-action"]')).toBeNull();
		await expect.poll(editorFocused).toBe(true);
	});

	test('Escape leaves a queued-message edit and puts the message back', async () => {
		mount({ busy: true, queue: [queued('Queued follow-up')] });
		await userEvent.click(button(/^Edit queued message/));
		await expect
			.poll(() => document.querySelector('[data-slot="ai-composer-queue-editing"]'))
			.not.toBeNull();
		await expect.poll(editorFocused).toBe(true);
		await userEvent.keyboard('{Escape}');
		await expect
			.poll(() => document.querySelector('[data-slot="ai-composer-queue-editing"]'))
			.toBeNull();
		expect(document.querySelector('[data-slot="ai-composer-queue-item"]')?.textContent).toContain(
			'Queued follow-up'
		);
	});

	test('a long queued message truncates inside the composer', async () => {
		mount({ busy: true, width: 420, queue: [queued('A very long queued message '.repeat(12))] });
		const row = document.querySelector<HTMLElement>('[data-slot="ai-composer-queue-item"]')!;
		const trash = button(/^Cancel queued message/);
		expect(rect(trash).right).toBeLessThanOrEqual(rect(composer()).right);
		expect(rect(row).right).toBeLessThanOrEqual(rect(composer()).right);
	});
});

describe('phone width', () => {
	test('the footer fits: attach, a truncated model name and send never overlap', async () => {
		mount({ scenario: 'footer', width: 358 });
		const attach = button('Attach files');
		const trigger = document.querySelector<HTMLElement>('[data-slot="ai-model-selector-trigger"]')!;
		const send = button('Send message');
		expect(rect(attach).right).toBeLessThanOrEqual(rect(trigger).left);
		expect(rect(trigger).right).toBeLessThanOrEqual(rect(send).left);
		expect(rect(send).right).toBeLessThanOrEqual(rect(composer()).right);
		// Touch-sized controls and at least 16px editor text (no iOS focus zoom) on a narrow composer.
		expect(rect(send).height).toBe(36);
		expect(parseFloat(getComputedStyle(editor()).fontSize)).toBeGreaterThanOrEqual(16);
	});

	test('the mic grows to 36px with the other footer controls on a narrow composer', async () => {
		mount({ scenario: 'footer', width: 358, voiceInput: true });
		await expect.poll(() => rect(button('Start voice recording')).height).toBe(36);
		expect(rect(button('Send message')).height).toBe(36);
	});

	test('a wide composer keeps 28px controls and the smaller text step', async () => {
		mount({ scenario: 'footer', width: 720 });
		expect(rect(button('Send message')).height).toBe(28);
		expect(parseFloat(getComputedStyle(editor()).fontSize)).toBeLessThan(16);
	});

	test('the mic has an accessible name and no visible label above it', async () => {
		mount({ voiceInput: true });
		const voice = document.querySelector<HTMLElement>('[data-slot="ai-composer-voice-input"]')!;
		expect(voice.querySelector('label')).toBeNull();
		expect(button('Start voice recording')).toBeTruthy();
		// With a visible Field label the slot was 56px tall and the mic sat below the send baseline.
		const send = rect(button('Send message'));
		expect(rect(voice).height).toBeLessThan(40);
		expect(
			Math.abs(rect(voice).top + rect(voice).height / 2 - (send.top + send.height / 2))
		).toBeLessThanOrEqual(1);
	});
});

describe('inside AIChat', () => {
	test('Enter sends from the chat composer and focus stays in the editor', async () => {
		mount({ scenario: 'chat' });
		await typeInEditor('Hello chat');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => document.body.textContent).toContain('Hello chat');
		await expect.poll(() => editor().textContent).toBe('');
		await expect.poll(editorFocused).toBe(true);
	});

	test('the model picker sits next to send and no empty context ring shows', async () => {
		mount({ scenario: 'chat' });
		expect(document.querySelector('[data-slot="ai-context"]')).toBeNull();
		const trigger = document.querySelector<HTMLElement>('[data-slot="ai-model-selector-trigger"]')!;
		expect(rect(button('Attach files')).right).toBeLessThan(rect(trigger).left);
		expect(rect(trigger).right).toBeLessThanOrEqual(rect(button('Send message')).left);
	});

	test('a context limit shows the indicator with its percentage', async () => {
		mount({ scenario: 'chat', maxTokens: 200_000 });
		const context = document.querySelector<HTMLElement>('[data-slot="ai-context"]');
		expect(context?.textContent).toContain('0%');
	});
});
