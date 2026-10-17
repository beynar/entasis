import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { en } from '$lib/i18n/en.js';
import { fr } from '$lib/i18n/fr.js';
import { ja } from '$lib/i18n/ja.js';
import Harness from './AIThreadTocHarness.test.svelte';
import { getAIThreadTocLabel } from './aiThreadToc.js';
import type { AIThreadTocEntry } from './aiThreadToc.props.js';

const pins = () =>
	Array.from(document.querySelectorAll<HTMLElement>('[data-slot="ai-thread-toc-pin"]'));

describe('AIThreadToc', () => {
	test('draws no rail or visible-range bar by default', () => {
		render(Harness);
		expect(document.querySelector('[data-slot="ai-thread-toc-rail"]')).toBeNull();
		expect(document.querySelector('[data-slot="ai-thread-toc-viewport"]')).toBeNull();
	});

	test('showRange paints the rail and the visible-range bar', () => {
		render(Harness, { props: { showRange: true } });
		expect(document.querySelector('[data-slot="ai-thread-toc-rail"]')?.className).toContain(
			'bg-neutral/10'
		);
		expect(document.querySelector('[data-slot="ai-thread-toc-viewport"]')?.className).toContain(
			'bg-neutral/25'
		);
	});

	test('the active pin is longer and more opaque than pins merely in view', () => {
		render(Harness, { activeIndex: 1 });
		const indicators = pins().map((pin) =>
			pin.querySelector<HTMLElement>('[data-slot="ai-thread-toc-pin-indicator"]')
		);
		const active = indicators[1] as HTMLElement;
		const inView = indicators[2] as HTMLElement;
		expect(pins()[2]).toHaveAttribute('data-visible', 'true');
		expect(pins()[1]).toHaveAttribute('data-active', 'true');
		// The length follows the pin's `data-active`, not a class of its own.
		expect(active.className).toContain('group-data-[active=true]:w-4');
		expect(active.className).toBe(inView.className);
		const opacity = (node: HTMLElement) =>
			Number(node.style.getPropertyValue('--ai-thread-toc-opacity'));
		expect(opacity(active)).toBeGreaterThan(opacity(inView));
		expect(opacity(inView)).toBeGreaterThan(opacity(indicators[3] as HTMLElement));
	});

	test('a11y:ai-thread-toc.roving-tab-stop is one tab stop with arrow keys between pins', async () => {
		const onScrollToIndex = vi.fn();
		render(Harness, { activeIndex: 1, onScrollToIndex });
		expect(pins().map((pin) => pin.tabIndex)).toEqual([0, -1, -1, -1]);
		pins()[1]?.focus();
		await fireEvent.keyDown(pins()[1] as HTMLElement, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(pins()[2]);
		expect(pins().map((pin) => pin.tabIndex)).toEqual([-1, -1, 0, -1]);
		await fireEvent.keyDown(pins()[2] as HTMLElement, { key: 'Home' });
		expect(document.activeElement).toBe(pins()[0]);
		await fireEvent.keyDown(pins()[0] as HTMLElement, { key: 'End' });
		expect(document.activeElement).toBe(pins()[3]);
		await fireEvent.click(pins()[3] as HTMLElement);
		expect(onScrollToIndex).toHaveBeenCalledWith(6);
	});

	test('a scroll that moves the active turn writes no class or tabindex on the pins', async () => {
		const { rerender } = render(Harness, { count: 8, activeIndex: 1 });
		const changed = new Set<string>();
		const observer = new MutationObserver((records) => {
			for (const record of records) if (record.attributeName) changed.add(record.attributeName);
		});
		const area = document.querySelector('[data-slot="ai-thread-toc-pin-area"]') as HTMLElement;
		observer.observe(area, { attributes: true, subtree: true });
		for (const activeIndex of [2, 3, 4, 5, 4, 3]) await rerender({ activeIndex });
		observer.disconnect();
		expect(changed.has('data-active')).toBe(true);
		expect(changed.has('class')).toBe(false);
		expect(changed.has('tabindex')).toBe(false);
	});

	test('a touch tap previews a pin and a second tap navigates', async () => {
		const onScrollToIndex = vi.fn();
		render(Harness, { onScrollToIndex });
		const pin = pins()[2] as HTMLElement;
		await fireEvent.pointerDown(pin, { pointerType: 'touch' });
		await fireEvent.click(pin);
		expect(onScrollToIndex).not.toHaveBeenCalled();
		expect(await screen.findByText('Turn 3 of 4')).toBeInTheDocument();
		await fireEvent.pointerDown(pin, { pointerType: 'touch' });
		await fireEvent.click(pin);
		expect(onScrollToIndex).toHaveBeenCalledExactlyOnceWith(4);
	});

	test('pin names are localized, file count included', () => {
		const entry: AIThreadTocEntry = {
			key: 'turn-0',
			index: 0,
			messageIndex: 0,
			message: { role: 'user', content: 'Plan the launch' },
			role: 'user',
			title: 'Plan the launch',
			excerpt: 'Here is a plan',
			fileCount: 2,
			files: [{ name: 'a.pdf' }, { name: 'b.pdf' }],
			attachments: [],
			offset: 0,
			size: 100
		};
		expect(getAIThreadTocLabel(entry, en)).toBe(
			'Scroll to Plan the launch - Here is a plan - 2 files - a.pdf, b.pdf'
		);
		expect(getAIThreadTocLabel(entry, fr)).toBe(
			'Aller à Plan the launch - Here is a plan - 2 fichiers - a.pdf, b.pdf'
		);
		expect(getAIThreadTocLabel({ ...entry, fileCount: 1, files: [{ name: 'a.pdf' }] }, ja)).toBe(
			'Plan the launch へ移動 - Here is a plan - 1 個のファイル - a.pdf'
		);
		render(Harness);
		expect(pins()[0]).toHaveAttribute('aria-label', 'Scroll to Question 1 - Answer 1');
	});
});
