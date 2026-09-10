import { expect, test } from '@playwright/test';

test.use({ baseURL: process.env.BLOCKS_BASE_URL ?? 'http://127.0.0.1:4173' });

for (const width of [390, 768, 1440]) {
	test(`studio rate keeps visible space between content groups at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await page.goto('/previews/blocks/rate-card/rate-card-monthly-studio-rate');
		await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
		const badge = await page.getByText('An extension of your team', { exact: true }).boundingBox();
		const heading = await page
			.getByRole('heading', { name: 'A thoughtful design partner, month by month.' })
			.boundingBox();
		const price = await page.getByText('$4,800', { exact: true }).boundingBox();
		if (!badge || !heading || !price) throw new Error('Studio rate content is not visible');
		expect(heading.y - badge.y - badge.height, 'space after the badge').toBeGreaterThanOrEqual(8);
		expect(price.y - heading.y - heading.height, 'space before the price').toBeGreaterThanOrEqual(
			8
		);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			width
		);
	});
}

test('record selectors contain both lines of their labels on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.goto('/blocks/crud-editor');
	const row = page.getByRole('button', { name: 'Customer onboarding Operations', exact: true });
	await expect(row).toBeVisible({ timeout: 30000 });
	const bounds = await row.boundingBox();
	const title = await row.getByText('Customer onboarding', { exact: true }).boundingBox();
	const description = await row.getByText('Operations', { exact: true }).boundingBox();
	if (!bounds || !title || !description) throw new Error('Record selection row is not visible');
	expect(title.y, 'title is inside its row').toBeGreaterThanOrEqual(bounds.y);
	expect(description.y + description.height, 'description is inside its row').toBeLessThanOrEqual(
		bounds.y + bounds.height
	);
});

test('product overlays use the same semantic inset as layout spacing', async ({ page }) => {
	await page.goto('/previews/blocks/product-card/sale-product');
	await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	const position = await page.getByText('Save 20%', { exact: true }).evaluate((label) => {
		const overlay = label.closest('.absolute');
		const contentRow = label.closest('[data-slot="card"]')?.querySelector('.gap-lg');
		if (!overlay || !contentRow) throw new Error('Sale badge or product summary is missing');
		return {
			top: Number.parseFloat(getComputedStyle(overlay).top),
			left: Number.parseFloat(getComputedStyle(overlay).left),
			gap: Number.parseFloat(getComputedStyle(contentRow).columnGap)
		};
	});
	expect(position.gap).toBeGreaterThan(0);
	expect(position.top).toBe(position.gap);
	expect(position.left).toBe(position.gap);
});

test('all mobile navigation destinations fit without horizontal scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.goto('/blocks/mobile-navigation');
	const navigation = page.getByRole('tablist', { name: 'Mobile navigation' });
	await navigation.scrollIntoViewIfNeeded();
	await expect(navigation.getByRole('tab')).toHaveCount(4);
	const widths = await navigation.evaluate((element) => ({
		viewport: element.clientWidth,
		content: element.scrollWidth
	}));
	expect(widths.content).toBeLessThanOrEqual(widths.viewport);
	await navigation.getByRole('tab', { name: 'Profile', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Maya Chen', exact: true })).toBeVisible();
});

test('checkout delivery controls contain their multiline labels', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.goto('/previews/blocks/checkout/split-checkout');
	await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	for (const name of ['Standard delivery', 'Express delivery']) {
		const control = page.getByRole('button', { name: new RegExp(name) });
		const bounds = await control.boundingBox();
		const label = await control.locator(':scope > span').first().boundingBox();
		if (!bounds || !label) throw new Error('Delivery control or label is missing');
		expect(label.y).toBeGreaterThanOrEqual(bounds.y);
		expect(label.y + label.height).toBeLessThanOrEqual(bounds.y + bounds.height);
	}
});
