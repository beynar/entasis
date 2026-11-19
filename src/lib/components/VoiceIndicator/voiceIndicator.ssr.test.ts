import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import VoiceIndicator from './VoiceIndicator.svelte';

describe('VoiceIndicator server rendering', () => {
	test('renders an image named by its state, with a canvas to draw on', () => {
		const { body } = render(VoiceIndicator, {
			props: { state: 'listening', variant: 'orb', appearance: 'solid', color: 'primary' }
		});

		expect(body).toMatch(/<div[^>]*role="img"/);
		expect(body).toContain('aria-label="Voice assistant listening"');
		expect(body).toContain('data-variant="orb"');
		expect(body).toContain('data-appearance="solid"');
		expect(body).toContain('data-state="listening"');
		expect(body).toContain('data-color="primary"');
		expect(body).toMatch(/<canvas[^>]*aria-hidden="true"/);
	});

	test('an error shows the danger role, and a diameter sizes the root', () => {
		const { body } = render(VoiceIndicator, {
			props: { state: 'error', color: 'success', diameter: 72 }
		});

		expect(body).toContain('data-color="danger"');
		expect(body).toContain('--voice-indicator-size: 72px');
	});

	test('with a start handler it is a button named by what a press does', () => {
		const { body } = render(VoiceIndicator, { props: { onStart: () => {} } });

		expect(body).toMatch(/<button[^>]*type="button"/);
		expect(body).toContain('aria-label="Start voice session"');
		expect(body).toContain('Voice assistant idle');
		expect(body).not.toContain('role="img"');
	});
});
