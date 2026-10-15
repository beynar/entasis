import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { en } from '$lib/i18n/en.js';
import { fr } from '$lib/i18n/fr.js';
import type { FileRejection } from '../Form/File/fileAcceptance.js';
import Harness from './aiComposerLawHarness.test.svelte';
import { describeAcceptedTypes, describeRejections } from './aiComposerFileController.svelte.js';

const file = (name: string, type = 'text/plain') => new File(['x'], name, { type });
const context = { accept: ['image/*', '.pdf'], maxFiles: 3, maxFileSize: '1.0 MB', messages: en };

describe('file rejection notes', () => {
	test('name the file and what to attach instead', () => {
		const rejections: FileRejection[] = [{ file: file('notes.txt'), reason: 'type' }];
		expect(describeRejections(rejections, context)).toBe(
			"notes.txt isn't supported — use images or PDF"
		);
	});

	test('cover size, duplicates, the count limit and mixed reasons', () => {
		const big = file('deck.pdf', 'application/pdf');
		expect(describeRejections([{ file: big, reason: 'size' }], context)).toBe(
			'deck.pdf is too large — the limit is 1.0 MB'
		);
		expect(describeRejections([{ file: big, reason: 'duplicate' }], context)).toBe(
			'deck.pdf is already attached'
		);
		expect(describeRejections([{ file: big, reason: 'limit' }], context)).toBe(
			'You can attach up to 3 files'
		);
		expect(
			describeRejections(
				[
					{ file: file('a.txt'), reason: 'type' },
					{ file: file('b.txt'), reason: 'type' }
				],
				context
			)
		).toBe("2 files aren't supported — use images or PDF");
		expect(
			describeRejections(
				[
					{ file: file('a.txt'), reason: 'type' },
					{ file: big, reason: 'size' }
				],
				context
			)
		).toBe("2 files couldn't be attached");
	});

	test('accepted types read in the active locale', () => {
		expect(describeAcceptedTypes(['image/*', 'application/pdf', '.md'], en)).toBe(
			'images, PDF, or MD'
		);
		expect(describeAcceptedTypes(['image/*', '.pdf'], fr)).toBe('des images ou PDF');
	});

	test('the composer shows a dismissible note instead of a danger alert, then clears it', async () => {
		const onFileReject = vi.fn();
		const { container } = render(Harness, {
			fileDropzone: true,
			accept: ['image/*', '.pdf'],
			onFileReject
		});
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const note = () => container.querySelector('[data-slot="ai-composer-notice"]');
			const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
			Object.defineProperty(input, 'files', { value: [file('notes.txt')], configurable: true });
			await fireEvent.change(input);
			await tick();
			expect(onFileReject).toHaveBeenCalledOnce();
			expect(note()).toHaveAttribute('role', 'status');
			expect(note()).toHaveTextContent("notes.txt isn't supported — use images or PDF");
			expect(container.querySelector('[role="alert"]')).toBeNull();

			await vi.advanceTimersByTimeAsync(6000);
			await tick();
			expect(note()).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});
});
