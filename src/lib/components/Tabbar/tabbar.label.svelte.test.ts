import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Tabbar from './Tabbar.svelte';

describe('Tabbar owns the tab list ARIA', () => {
	test('names the tab list from label and takes aria-orientation from orientation', () => {
		render(Tabbar, {
			props: { items: ['Overview', 'Settings'], label: 'Project sections', orientation: 'vertical' }
		});

		const tablist = screen.getByRole('tablist', { name: 'Project sections' });
		expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
	});

	test('defaults to a horizontal, unnamed tab list', () => {
		render(Tabbar, { props: { items: ['Overview', 'Settings'] } });

		const tablist = screen.getByRole('tablist');
		expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
		expect(tablist).not.toHaveAttribute('aria-label');
	});
});
