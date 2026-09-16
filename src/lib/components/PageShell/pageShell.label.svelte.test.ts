import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import PageShell from './PageShell.svelte';
import { createRawSnippet } from 'svelte';

const content = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));

describe('PageShell names its main landmark', () => {
	test('applies label as the aria-label of the main region', () => {
		render(PageShell, { props: { children: content, label: 'Invoice detail' } });

		expect(screen.getByRole('main', { name: 'Invoice detail' })).toBeInTheDocument();
	});

	test('leaves the main region unnamed without a label', () => {
		render(PageShell, { props: { children: content } });

		expect(screen.getByRole('main')).not.toHaveAttribute('aria-label');
	});
});
