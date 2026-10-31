// A progress band (a dossier's steps): done steps draw a filled check and a solid connector, the
// current step a ringed point and `aria-current="step"`, upcoming steps a quiet numbered ring and
// faint connectors. Accessible names stay the host's; the markers stay decorative.
import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Timeline from './Timeline.svelte';
import type { TimelineItem } from './timeline.props.js';
import TimelineProgressHarness from './TimelineProgressHarness.test.svelte';

const steps: TimelineItem[] = [
	{ id: 'a', title: 'Ouverture', progress: 'done' },
	{ id: 'b', title: 'Pièces', progress: 'done' },
	{ id: 'c', title: 'Expertise', progress: 'current' },
	{ id: 'd', title: 'Rapport', progress: 'upcoming' },
	{ id: 'e', title: 'Clôture', progress: 'upcoming' }
];

const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot="timeline-item"]')];
const part = (row: HTMLElement, slot: string) =>
	row.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
const classesOf = (element: Element | null) => element?.getAttribute('class')?.split(/\s+/) ?? [];
/** The text assistive technology reads: what is left once `aria-hidden` subtrees are gone. */
const spokenText = (element: Element) => {
	const copy = element.cloneNode(true) as Element;
	for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
	return copy.textContent?.trim();
};

describe('Timeline progress', () => {
	test('each step carries its progress, and only the current one is the current step', () => {
		renderInTheme(Timeline, { items: steps });

		expect(rows().map((row) => row.dataset.progress)).toEqual([
			'done',
			'done',
			'current',
			'upcoming',
			'upcoming'
		]);
		expect(rows().map((row) => row.getAttribute('aria-current'))).toEqual([
			null,
			null,
			'step',
			null,
			null
		]);
		expect(screen.getByText('Expertise').closest('li')).toHaveAttribute('aria-current', 'step');
	});

	test('a done step draws a filled check, the current one a ringed point, an upcoming one its number', () => {
		renderInTheme(Timeline, { items: steps, color: 'primary' });
		const [done, , current, upcoming, last] = rows();

		const doneMarker = part(done!, 'timeline-marker')!;
		expect(doneMarker.dataset.progress).toBe('done');
		expect(doneMarker.querySelector('svg')).not.toBeNull();
		expect(classesOf(doneMarker)).toEqual(
			expect.arrayContaining(['bg-color', 'text-color-contrast', 'ring-color'])
		);

		const currentMarker = part(current!, 'timeline-marker')!;
		expect(part(current!, 'timeline-dot')).not.toBeNull();
		expect(classesOf(currentMarker)).toEqual(expect.arrayContaining(['ring-2', 'ring-color']));

		const upcomingMarker = part(upcoming!, 'timeline-marker')!;
		expect(part(upcoming!, 'timeline-step-number')).toHaveTextContent('4');
		expect(part(last!, 'timeline-step-number')).toHaveTextContent('5');
		expect(classesOf(upcomingMarker)).toEqual(
			expect.arrayContaining(['ring-neutral-muted', 'text-neutral/70'])
		);
		expect(classesOf(upcomingMarker)).not.toContain('bg-color');
	});

	test('the markers stay decorative: the step reads by its own text only', () => {
		renderInTheme(Timeline, { items: steps });
		for (const row of rows()) {
			expect(part(row, 'timeline-axis')).toHaveAttribute('aria-hidden', 'true');
		}
		expect(screen.getAllByRole('listitem').map(spokenText)).toEqual([
			'Ouverture',
			'Pièces',
			'Expertise',
			'Rapport',
			'Clôture'
		]);
	});

	test('the connector is solid up to the current step and faint after it', () => {
		renderInTheme(Timeline, { items: steps, orientation: 'horizontal' });
		const connectors = rows().map((row) => part(row, 'timeline-connector'));

		expect(connectors.map((connector) => connector?.dataset.progress)).toEqual([
			'done',
			'done',
			'current',
			'upcoming',
			undefined
		]);
		expect(classesOf(connectors[1]!)).toEqual(expect.arrayContaining(['bg-color', 'h-0.5']));
		expect(classesOf(connectors[2]!)).toEqual(expect.arrayContaining(['bg-color/20', 'h-0.5']));
		expect(classesOf(connectors[3]!)).toContain('bg-color/20');
	});

	test('a progress connector follows its step color unless a connector color is set', () => {
		renderInTheme(Timeline, { items: steps, color: 'primary' });
		expect(rows().map((row) => part(row, 'timeline-connector')?.dataset.color)).toEqual([
			'primary',
			'primary',
			'primary',
			'primary',
			undefined
		]);
	});

	test('an explicit connector color still wins, on the root or on the item', () => {
		renderInTheme(Timeline, {
			items: [{ ...steps[0]!, connectorColor: 'success' }, ...steps.slice(1)],
			color: 'primary',
			connectorColor: 'neutral'
		});
		expect(rows().map((row) => part(row, 'timeline-connector')?.dataset.color)).toEqual([
			'success',
			'neutral',
			'neutral',
			'neutral',
			undefined
		]);
	});

	test('without progress nothing changes: a neutral dot and a hairline connector', () => {
		renderInTheme(Timeline, {
			items: [{ title: 'One' }, { title: 'Two' }],
			color: 'primary'
		});
		const [first] = rows();
		expect(first).not.toHaveAttribute('data-progress');
		expect(first).not.toHaveAttribute('aria-current');
		expect(part(first!, 'timeline-dot')).not.toBeNull();
		const connector = part(first!, 'timeline-connector')!;
		expect(connector.dataset.color).toBe('neutral');
		expect(classesOf(connector)).toEqual(expect.arrayContaining(['bg-color/35', 'w-px']));
	});

	test('an icon replaces the check or the number, and loading replaces the whole marker', () => {
		renderInTheme(Timeline, {
			items: [
				{ title: 'Signed', progress: 'done', icon: '✍' },
				{ title: 'Checking', progress: 'current', loading: true },
				{ title: 'Paid', progress: 'upcoming', icon: '€' }
			]
		});
		const [signed, checking, paid] = rows();
		expect(part(signed!, 'timeline-marker')).toHaveTextContent('✍');
		expect(part(signed!, 'timeline-marker')?.querySelector('svg')).toBeNull();
		expect(part(paid!, 'timeline-marker')).toHaveTextContent('€');
		expect(part(paid!, 'timeline-step-number')).toBeNull();
		const loadingMarker = part(checking!, 'timeline-marker')!;
		expect(part(checking!, 'timeline-loading')).not.toBeNull();
		expect(loadingMarker).not.toHaveAttribute('data-progress');
		expect(classesOf(loadingMarker)).not.toContain('ring-2');
		expect(checking).toHaveAttribute('aria-current', 'step');
	});

	test('a marker snippet still replaces the marker, and falls back to the progress markers', () => {
		renderInTheme(TimelineProgressHarness, { items: steps });
		const [done, , current, upcoming] = rows();
		expect(part(current!, 'timeline-marker')).toBeNull();
		expect(screen.getByTestId('custom-marker')).toBeInTheDocument();
		expect(part(done!, 'timeline-marker')?.querySelector('svg')).not.toBeNull();
		expect(part(upcoming!, 'timeline-step-number')).toHaveTextContent('4');
	});

	test('theme overrides reach the progress variants', () => {
		renderInTheme(Timeline, {
			items: steps,
			theme: {
				connector: { progress: { done: 'bg-success' } },
				marker: { progress: { upcoming: 'ring-dashed' } }
			}
		});
		const [done, , , upcoming] = rows();
		expect(classesOf(part(done!, 'timeline-connector'))).toContain('bg-success');
		expect(classesOf(part(upcoming!, 'timeline-marker'))).toContain('ring-dashed');
	});
});
