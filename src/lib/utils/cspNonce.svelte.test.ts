// The CSP nonce reaches code outside components: the registry, the helpers, and the PhoneInput,
// Map and Mermaid (Pele) CDN loaders that append a `<script>` (CX-8).
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ThemePlatformHarness from '$lib/components/Theme/ThemePlatformHarness.test.svelte';
import Mermaid from '$lib/components/Mermaid/Mermaid.svelte';
import { loadIntlTelInputFromCdn } from '$lib/components/Form/PhoneInput/phoneInput-cdn.js';
import { loadMapLibreFromCdn } from '$lib/components/Map/maplibre-cdn.js';
import { applyCspNonce, getCspNonce, nonceAttribute, registerCspNonce } from './cspNonce.js';

afterEach(() => {
	document.head.querySelectorAll('script, link, style').forEach((node) => node.remove());
});

describe('cspNonce', () => {
	test('applyCspNonce stamps an element and leaves it alone without a nonce', () => {
		const stamped = applyCspNonce(document.createElement('script'), 'n');
		expect(stamped).toHaveAttribute('nonce', 'n');
		expect(applyCspNonce(document.createElement('script'), undefined)).not.toHaveAttribute('nonce');
	});

	test('nonceAttribute escapes for a double-quoted attribute', () => {
		expect(nonceAttribute(undefined)).toBe('');
		expect(nonceAttribute('a"b&c<d>')).toBe(' nonce="a&quot;b&amp;c&lt;d&gt;"');
	});

	test('the most recently registered source with a nonce wins, and unregistering restores', () => {
		const offFirst = registerCspNonce(() => 'first');
		const offSecond = registerCspNonce(() => 'second');
		const offEmpty = registerCspNonce(() => undefined);
		expect(getCspNonce()).toBe('second');
		offSecond();
		expect(getCspNonce()).toBe('first');
		offEmpty();
		offFirst();
		expect(getCspNonce()).toBeUndefined();
	});
});

// Each loader caches its promise per module, so each is loaded once in this file.
describe('CDN loaders carry the Theme nonce', () => {
	test('MapLibre script and stylesheet', () => {
		render(ThemePlatformHarness, { props: { nonce: 'map-nonce' } });
		void loadMapLibreFromCdn().catch(() => {});
		const script = document.head.querySelector('script[src*="maplibre-gl"]');
		const link = document.head.querySelector('link[rel="stylesheet"]');
		expect(script).toHaveAttribute('nonce', 'map-nonce');
		expect(link).toHaveAttribute('nonce', 'map-nonce');
	});

	test('intl-tel-input script', () => {
		render(ThemePlatformHarness, { props: { nonce: 'phone-nonce' } });
		void loadIntlTelInputFromCdn().catch(() => {});
		expect(document.head.querySelector('script[src*="intl-tel-input"]')).toHaveAttribute(
			'nonce',
			'phone-nonce'
		);
	});

	test('mermaid script', () => {
		render(ThemePlatformHarness, {
			props: {
				nonce: 'mermaid-nonce',
				child: Mermaid as never,
				childProps: { chart: 'graph TD; A-->B' }
			}
		});
		expect(document.head.querySelector('script[data-pele-cdn]')).toHaveAttribute(
			'nonce',
			'mermaid-nonce'
		);
	});
});
