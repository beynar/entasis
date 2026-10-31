// In a real browser, with the theme's CSS: a started address that misses parts shows one alert,
// the address's own; each missing part is described by its message without an alert of its own.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { Component } from 'svelte';
import ThemeProviderHarness from '../../Theme/ThemeProviderHarness.test.svelte';
import Form from '../Form/Form.svelte';
import type { FormState } from '../Form/form.state.svelte.js';

describe('AddressInput in a browser', () => {
	test('a started address missing parts shows one alert, and describes each missing part', async () => {
		render(ThemeProviderHarness, {
			props: {
				component: Form as unknown as Component<Record<string, unknown>>,
				inputs: { address: { type: 'address', label: 'Address', provider: null, required: true } },
				actions: [{ children: 'Submit', onAction: (form: FormState) => form.submit() }]
			}
		});
		await userEvent.fill(page.getByRole('textbox', { name: /Street address/ }), '12 Rue de Rivoli');
		await userEvent.click(page.getByRole('button', { name: 'Submit' }));

		await expect.poll(() => page.getByRole('alert').elements().length).toBe(1);
		const alert = page.getByRole('alert').element();
		expect(alert.textContent).toContain('Required: Postal code');
		expect(alert.textContent).toContain('Required: City');
		await expect
			.element(page.getByRole('textbox', { name: /City/ }))
			.toHaveAccessibleDescription('Required: City');
		await expect
			.element(page.getByRole('textbox', { name: /Street address/ }))
			.not.toHaveAttribute('aria-invalid');
		// The Form focuses the first part of the invalid address.
		await expect.element(page.getByRole('textbox', { name: /Street address/ })).toHaveFocus();
	});
});

describe('AddressInput rows', () => {
	test('a row lays its parts side by side by their widths, and a narrow field stacks them', async () => {
		const { default: AddressInput } = await import('./AddressInput.svelte');
		const mount = (width: number) =>
			render(ThemeProviderHarness, {
				props: {
					component: AddressInput as unknown as Component<Record<string, unknown>>,
					label: `Address ${width}`,
					provider: null,
					fields: [
						[
							{ field: 'postalCode', width: 1 },
							{ field: 'city', width: 3 }
						]
					],
					style: `width: ${width}px`
				}
			});
		mount(640);
		const box = (name: RegExp) =>
			page.getByRole('textbox', { name }).element().getBoundingClientRect();
		const postal = box(/Postal code/);
		const city = box(/City/);
		expect(Math.abs(postal.top - city.top)).toBeLessThan(1);
		expect(city.width / postal.width).toBeGreaterThan(2.5);
	});
});
