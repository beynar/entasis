import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import ComponentInventory from './components/+page.svelte';

describe('/components', () => {
	test('shows public entrypoints and links to component documentation', () => {
		render(ComponentInventory);
		expect(
			screen.getByRole('heading', { level: 1, name: 'Components and entrypoints' })
		).toBeInTheDocument();
		expect(screen.getByText('entasis/field', { exact: true })).toBeVisible();
		expect(screen.getByText('entasis/slot', { exact: true })).toBeVisible();
		expect(screen.getByText('entasis/tailwind-plugin', { exact: true })).toBeVisible();
		expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute(
			'href',
			'/components/button'
		);
	});
});
