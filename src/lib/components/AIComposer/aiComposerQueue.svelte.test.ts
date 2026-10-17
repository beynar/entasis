import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import type { AIComposerAttachment, AIComposerQueuedMessage } from './aiComposer.props.js';
import Harness from './aiComposerLawHarness.test.svelte';

function attachment(name: string): AIComposerAttachment {
	const file = new File(['x'], name, { type: 'image/png' });
	return { id: name, file, name, size: file.size, type: file.type, status: 'uploaded' };
}

function queued(
	id: string,
	markdown: string,
	extra: Partial<AIComposerQueuedMessage> = {}
): AIComposerQueuedMessage {
	return {
		id,
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
		skillIds: [],
		...extra
	};
}

const rows = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[data-slot="ai-composer-queue-item"]'));

describe('AIComposer queue rows', () => {
	test('a steered row carries a Steering badge; other rows do not', () => {
		const { container } = render(Harness, {
			busy: true,
			queue: [queued('a', 'Plain follow-up'), queued('b', 'Steer now', { steered: true })]
		});
		const [plain, steered] = rows(container);
		expect(plain.querySelector('[data-slot="ai-composer-queue-badge"]')).toBeNull();
		expect(steered.querySelector('[data-slot="ai-composer-queue-badge"]')).toHaveTextContent(
			'Steering'
		);
	});

	test('the queued file count and the badge read in the active locale', () => {
		const { container } = render(Harness, {
			busy: true,
			locale: 'fr',
			queue: [
				queued('a', 'Deux images', {
					steered: true,
					attachments: [attachment('a.png'), attachment('b.png')]
				}),
				queued('b', 'Une image', { attachments: [attachment('c.png')] })
			]
		});
		const [two, one] = rows(container);
		expect(two.querySelector('[data-slot="ai-composer-queue-files"]')).toHaveTextContent(
			'2 fichiers'
		);
		expect(two.querySelector('[data-slot="ai-composer-queue-badge"]')).toHaveTextContent(
			'Orientation'
		);
		expect(one.querySelector('[data-slot="ai-composer-queue-files"]')).toHaveTextContent(
			'1 fichier'
		);
	});
});
