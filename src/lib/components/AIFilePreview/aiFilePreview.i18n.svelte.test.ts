// The size and the status of a file preview are written in the app's locale.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from './AIFilePreviewI18nHarness.test.svelte';

const meta = (container: HTMLElement) =>
	container
		.querySelector('[data-slot="ai-file-preview"]')
		?.textContent?.replace(/\s+/g, ' ')
		.trim();

describe('AIFilePreview in French', () => {
	test.each([
		['uploading', 'Téléversement'],
		['failed', 'Échec'],
		['pending', 'En attente'],
		['uploaded', 'Téléversé']
	] as const)('%s reads as %s, with the size in Mo', (status, label) => {
		const { container } = render(Harness, { props: { status } });
		expect(meta(container)).toBe(`plan.pdf ${label} · 1,5 Mo`);
	});
});
