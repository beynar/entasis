// The mobile drawer closes when a link in its panel is followed; the activity bar's links and
// clicks that open elsewhere leave it open.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SidebarMobileDrawerHarness from './SidebarMobileDrawerHarness.test.svelte';

const setup = () => {
	const close = vi.fn();
	render(SidebarMobileDrawerHarness, { props: { close } });
	return close;
};
const link = (name: string) => screen.getByRole('link', { name });

describe('Sidebar mobile drawer links', () => {
	test('following a link in the panel closes the drawer', async () => {
		const close = setup();
		await fireEvent.click(link('Page'));
		expect(close).toHaveBeenCalledOnce();
	});

	test('a link a client-side router handles (default prevented) closes it too', async () => {
		const close = setup();
		await fireEvent.click(link('Routed'));
		expect(close).toHaveBeenCalledOnce();
	});

	test('an activity bar link keeps it open', async () => {
		const close = setup();
		await fireEvent.click(link('Section'));
		expect(close).not.toHaveBeenCalled();
	});

	test('a button, a new-tab link and a modified click keep it open', async () => {
		const close = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
		await fireEvent.click(link('New tab'));
		await fireEvent.click(link('Page'), { metaKey: true });
		expect(close).not.toHaveBeenCalled();
	});
});
