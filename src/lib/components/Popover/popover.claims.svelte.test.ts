// The anchor attribute claims that several popups share on one trigger (lane R1 · CX-6).
import { describe, expect, test } from 'vitest';
import { claimPopupOpen, popupOpenClaim } from './popover.claims.js';

describe('popupOpenClaim', () => {
	test('a closing tooltip on the same element keeps the open popup hook', () => {
		const node = document.createElement('input');
		const tooltip = {};
		claimPopupOpen(node, tooltip, true);
		const release = popupOpenClaim(true)(node);
		claimPopupOpen(node, tooltip, false);
		expect(node.getAttribute('data-popup-open')).toBe('');
		if (typeof release === 'function') release();
		expect(node.hasAttribute('data-popup-open')).toBe(false);
	});

	test('a closed popup claims nothing and leaves another claim alone', () => {
		const node = document.createElement('button');
		const tooltip = {};
		claimPopupOpen(node, tooltip, true);
		expect(popupOpenClaim(false)(node)).toBeUndefined();
		expect(node.getAttribute('data-popup-open')).toBe('');
		claimPopupOpen(node, tooltip, false);
		expect(node.hasAttribute('data-popup-open')).toBe(false);
	});
});
