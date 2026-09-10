import { expect, test } from '@playwright/test';

test('component inventory links to the public documentation', async ({ page }) => {
	await page.goto('/components');
	await expect(
		page.getByRole('heading', { level: 1, name: 'Components and entrypoints' })
	).toBeVisible();
	await page.getByRole('link', { name: 'Button', exact: true }).last().click();
	await expect(page).toHaveURL(/\/components\/button$/);
});
