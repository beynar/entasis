import { describe, expect, it, vi } from 'vitest';
import { observeThemeTokens } from './observeThemeTokens.js';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('observeThemeTokens', () => {
	it('fires once per frame for theme attribute flips and head style changes, then stops', async () => {
		const callback = vi.fn();
		const stop = observeThemeTokens(callback);

		document.documentElement.setAttribute('data-theme', 'dark');
		document.documentElement.style.setProperty('--x', '1');
		await nextFrame();
		expect(callback).toHaveBeenCalledTimes(1);

		const style = document.createElement('style');
		style.textContent = 'html{--color-primary:red}';
		document.head.append(style);
		await nextFrame();
		expect(callback).toHaveBeenCalledTimes(2);

		stop();
		style.remove();
		await nextFrame();
		expect(callback).toHaveBeenCalledTimes(2);
	});
});
