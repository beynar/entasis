import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Button from './Button.svelte';
import Chip from '../Chip/Chip.svelte';

describe('data-* attributes land on the root element', () => {
	test('Button forwards arbitrary data-* attributes to the <button>', () => {
		render(Button, {
			props: { children: 'Save', 'data-testid': 'save-button', 'data-analytics-id': 'cta-save' }
		});

		const button = screen.getByTestId('save-button');
		expect(button.tagName).toBe('BUTTON');
		expect(button).toHaveAttribute('data-analytics-id', 'cta-save');
	});

	test('Button forwards data-* attributes when rendered as an anchor', () => {
		render(Button, {
			props: { children: 'Continue', href: '#next', 'data-testid': 'continue-link' }
		});

		const anchor = screen.getByTestId('continue-link');
		expect(anchor.tagName).toBe('A');
	});

	test('Chip forwards arbitrary data-* attributes to its root', () => {
		render(Chip, { props: { children: 'Tag', 'data-testid': 'chip-root' } });

		expect(screen.getByTestId('chip-root')).toBeInTheDocument();
	});
});
