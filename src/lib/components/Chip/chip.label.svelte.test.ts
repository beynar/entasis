// A chip that acts can say what it does when its text does not: `label` names the action and
// `title` gives the hover hint.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, test, vi } from 'vitest';
import Chip from './Chip.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

test('a chip that acts is named by its label, with its title on hover', () => {
	render(Chip, {
		props: {
			children: text('Léa écoute ce fil'),
			onclick: vi.fn(),
			label: 'Ne plus écouter ce fil',
			title: 'Ne plus écouter ce fil'
		}
	});
	const chip = screen.getByRole('button', { name: 'Ne plus écouter ce fil' });
	expect(chip).toHaveAttribute('title', 'Ne plus écouter ce fil');
	expect(chip).toHaveTextContent('Léa écoute ce fil');
});

test('a link chip takes the label too', () => {
	render(Chip, {
		props: { children: text('Docs'), href: '/docs', label: 'Open the documentation' }
	});
	expect(screen.getByRole('link', { name: 'Open the documentation' })).toBeInTheDocument();
});

test('a static chip keeps its title but has no role to name', () => {
	const { container } = render(Chip, {
		props: { children: text('Draft'), label: 'ignored', title: 'Not sent yet' }
	});
	const chip = container.querySelector('[data-variant]')!;
	expect(chip).not.toHaveAttribute('aria-label');
	expect(chip).toHaveAttribute('title', 'Not sent yet');
});
