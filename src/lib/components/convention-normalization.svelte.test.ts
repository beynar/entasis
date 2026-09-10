import { describe, expect, test, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import Card from './Card/Card.svelte';
import Chip from './Chip/Chip.svelte';
import Harness from './ConventionNormalizationHarness.test.svelte';
import { fieldTheme } from './Form/Field/field.theme.js';
import MenuOption from './MenuOption/MenuOption.svelte';
import Rating from './Rating/Rating.svelte';
import Stat from './Stat/Stat.svelte';

describe('component convention normalization', () => {
	test('wraps a custom Code.header slot with the header theme class', () => {
		render(Harness, { props: { scenario: 'code-header' } });
		expect(screen.getByText('Code header').closest('.custom-code-header')).toBeInTheDocument();
	});

	test('wraps PageShell title and subtitle snippets with their theme classes', () => {
		render(Harness, { props: { scenario: 'page-shell-title' } });
		expect(screen.getByText('Page title').closest('.custom-page-title')).toBeInTheDocument();
		expect(screen.getByText('Page subtitle').closest('.custom-page-subtitle')).toBeInTheDocument();
	});

	test('wraps Menu header and footer snippets with their theme classes', () => {
		render(Harness, { props: { scenario: 'menu-slots' } });
		expect(screen.getByText('Menu header').closest('.custom-menu-header')).toBeInTheDocument();
		expect(screen.getByText('Menu footer').closest('.custom-menu-footer')).toBeInTheDocument();
	});

	test('Field size and density variants apply the expected classes', () => {
		expect(fieldTheme.header({ density: 'normal' })).toContain('gap-md');
		expect(fieldTheme.label({ size: 'normal' })).toContain('text-sm');
		expect(fieldTheme.inputContainer({ density: 'normal' })).toContain('gap-md');
	});

	test('positioned Chip uses the root theme and exposes its anchor', () => {
		render(Chip, {
			props: {
				children: '7',
				position: 'topRight',
				theme: {
					root: { base: 'canonical-root-class' }
				}
			}
		});

		const chip = screen.getByText('7').closest('[data-chip-position="topRight"]');
		expect(chip).toHaveClass('canonical-root-class', 'absolute');
	});

	test('Chip exposes native pointer enter and leave handlers with real events', async () => {
		const onpointerenter = vi.fn();
		const onpointerleave = vi.fn();
		render(Chip, { props: { children: 'Canonical chip', onpointerenter, onpointerleave } });

		const chip = screen.getByText('Canonical chip').closest('button');
		if (!(chip instanceof HTMLElement)) {
			throw new Error('Expected Chip with pointer handlers to render as a button.');
		}
		await fireEvent.pointerEnter(chip);
		await fireEvent.pointerLeave(chip);

		expect(onpointerenter).toHaveBeenCalledOnce();
		expect(onpointerenter.mock.calls[0]?.[0]).toBeInstanceOf(Event);
		expect(onpointerleave).toHaveBeenCalledOnce();
		expect(onpointerleave.mock.calls[0]?.[0]).toBeInstanceOf(Event);
	});

	test('Card onclick receives real click events from pointer and keyboard activation', async () => {
		const onclick = vi.fn();
		render(Card, { props: { children: 'Interactive card', onclick } });

		const card = screen.getByRole('button', { name: 'Interactive card' });
		await fireEvent.click(card);
		await fireEvent.keyDown(card, { key: 'Enter' });

		expect(onclick).toHaveBeenCalledTimes(2);
		expect(onclick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
		expect(onclick.mock.calls[1]?.[0]).toBeInstanceOf(MouseEvent);
	});

	test('MenuOption onclick receives the native event', async () => {
		const onclick = vi.fn();
		render(MenuOption, { props: { title: 'Open settings', onclick } });

		await fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
	});

	test('Stat and Rating expose native child interaction events', async () => {
		const onStatClick = vi.fn();
		let ratingCurrentTarget: EventTarget | null = null;
		const onRatingClick = vi.fn((event: MouseEvent) => {
			ratingCurrentTarget = event.currentTarget;
		});
		render(Stat, {
			props: { label: 'Revenue', indicator: 'Open actions', onclick: onStatClick }
		});
		render(Rating, { props: { value: 3, onclick: onRatingClick } });

		await fireEvent.click(screen.getByRole('button', { name: 'Open actions' }));
		const firstStar = document.querySelector<HTMLElement>('[data-star-index="1"]');
		if (!firstStar) throw new Error('Expected Rating to render indexed stars.');
		await fireEvent.click(firstStar);

		expect(onStatClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
		expect(onRatingClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
		expect(ratingCurrentTarget).toBe(firstStar);
	});
});
