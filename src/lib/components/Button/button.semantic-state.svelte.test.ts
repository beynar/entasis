import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Button from './Button.svelte';
import Chip from '../Chip/Chip.svelte';
import AISuggestion from '../AISuggestion/AISuggestion.svelte';

// The library owns accessibility: a caller states the meaning (`pressed`, `selected`,
// `expanded`, `haspopup`) and the component writes the matching ARIA attribute.
describe('semantic state props produce the ARIA attributes', () => {
	test('Button maps pressed to aria-pressed in both states', () => {
		const { rerender } = render(Button, { props: { children: 'Bold', pressed: true } });

		const button = screen.getByRole('button', { name: 'Bold' });
		expect(button).toHaveAttribute('aria-pressed', 'true');

		rerender({ children: 'Bold', pressed: false });
		expect(button).toHaveAttribute('aria-pressed', 'false');
	});

	test('Button leaves aria-pressed off when pressed is not given', () => {
		render(Button, { props: { children: 'Save' } });

		expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-pressed');
	});

	test('Button maps selected to aria-selected', () => {
		render(Button, { props: { children: 'Overview', role: 'tab', selected: true } });

		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
	});

	test('Button maps expanded and haspopup onto its trigger ARIA', () => {
		render(Button, { props: { children: 'Filters', expanded: true, haspopup: 'menu' } });

		const trigger = screen.getByRole('button', { name: 'Filters' });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	});

	test('Chip maps selected to aria-pressed and derives aria-disabled from disabled', () => {
		render(Chip, {
			props: { children: 'Drafts', onclick: () => {}, selected: true, disabled: true }
		});

		const chip = screen.getByRole('button', { name: 'Drafts' });
		expect(chip).toHaveAttribute('aria-pressed', 'true');
		expect(chip).toHaveAttribute('data-selected', 'true');
		// A real <button> carries the native disabled attribute, never aria-disabled as well.
		expect(chip).toBeDisabled();
		expect(chip).not.toHaveAttribute('aria-disabled');
	});

	test('Chip maps selected to aria-current on a link chip, never aria-pressed', () => {
		render(Chip, { props: { children: 'Drafts', href: '#drafts', selected: true } });

		const chip = screen.getByRole('link', { name: 'Drafts' });
		expect(chip).toHaveAttribute('aria-current', 'true');
		expect(chip).not.toHaveAttribute('aria-pressed');
	});

	test('Chip leaves a static chip without an interactive state attribute', () => {
		render(Chip, { props: { children: 'Drafts', selected: true } });

		const chip = document.querySelector('[data-selected="true"]');
		expect(chip).not.toBeNull();
		expect(chip).not.toHaveAttribute('aria-pressed');
		expect(chip).not.toHaveAttribute('aria-current');
	});

	test('Chip marks a disabled link chip with aria-disabled', () => {
		render(Chip, { props: { children: 'Archived', href: '#archived', disabled: true } });

		expect(screen.getByRole('link', { name: 'Archived' })).toHaveAttribute('aria-disabled', 'true');
	});

	test('AISuggestion reports its selected state as aria-pressed', () => {
		render(AISuggestion, { props: { suggestion: 'Summarize this', selected: true } });

		expect(screen.getByRole('button', { name: 'Summarize this' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
});
