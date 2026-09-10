import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { blockCategories } from '../src/routes/blocks/catalog.js';
import { workflowBlocks } from '../src/routes/blocks/blocks.js';

test.use({ baseURL: process.env.BLOCKS_BASE_URL ?? 'http://127.0.0.1:4173' });

test('browse, filter, and recover from an empty search', async ({ page }) => {
	await page.goto('/blocks', { waitUntil: 'domcontentloaded' });
	await page.locator('iframe').first().waitFor({ state: 'attached' });
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Complete interfaces');
	const collection = page.getByRole('region', { name: 'Browse block categories' });
	await expect(collection.getByRole('status')).toHaveText('108 categories to explore');
	await page.getByRole('textbox', { name: 'Search blocks' }).fill('no-such-block-9284');
	await expect(page.getByText('No blocks found', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Clear filters' }).click();
	await page.getByRole('button', { name: 'Commerce', exact: true }).click();
	await expect(collection.getByRole('status')).toHaveText('27 categories to explore');
	await page.getByRole('textbox', { name: 'Search blocks' }).fill('wishlist');
	await expect(collection.getByRole('heading', { name: 'Wishlist', exact: true })).toBeVisible();
	await collection
		.getByRole('link')
		.filter({ has: page.getByRole('heading', { name: 'Wishlist', exact: true }) })
		.click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wishlist');
});

test('source matches the standalone block and mobile uses a real viewport', async ({
	page,
	context
}) => {
	const category = blockCategories.find((category) => category.slug === 'login');
	expect(category).toBeDefined();
	if (!category) throw new Error('Login category missing');
	const block = category.blocks[0];
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto(`/blocks/${category.slug}/${block.id}`, { waitUntil: 'domcontentloaded' });
	const preview = page.frameLocator('iframe');
	await expect(preview.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	await page.getByRole('radio', { name: 'Mobile preview' }).click();
	await expect
		.poll(async () => page.locator('iframe').evaluate((frame) => frame.clientWidth))
		.toBe(390);
	await page.getByRole('radio', { name: 'Source', exact: true }).click();
	await expect(page.getByText('Loading source…')).toHaveCount(0);
	await page.getByRole('button', { name: 'Copy code', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
	const source = await readFile(
		new URL(`../src/routes/blocks/catalog/${block.file}`, import.meta.url),
		'utf8'
	);
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
});

test('gallery fits a mobile screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/blocks', { waitUntil: 'domcontentloaded' });
	await expect(page.getByRole('textbox', { name: 'Search blocks' })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Heading props style a composed hero without custom typography classes', async ({ page }) => {
	await page.goto('/previews/blocks/hero/hero-split-benefits-hero', {
		waitUntil: 'domcontentloaded'
	});
	await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	const heading = page.getByRole('heading', {
		name: 'Give your team a clear next step.',
		level: 2
	});
	const typography = await heading.evaluate((element) => ({
		size: Number.parseFloat(getComputedStyle(element).fontSize),
		weight: getComputedStyle(element).fontWeight,
		bodySize: Number.parseFloat(getComputedStyle(document.body).fontSize)
	}));
	expect(typography.size).toBeGreaterThan(typography.bodySize * 1.5);
	expect(typography.weight).toBe('700');
});

test('unknown blocks return 404 and existing workflows remain available', async ({ request }) => {
	expect((await request.get('/blocks/no-such-category')).status()).toBe(404);
	expect((await request.get('/blocks/login/no-such-block')).status()).toBe(404);
	expect((await request.get('/previews/blocks/login/no-such-block')).status()).toBe(404);
	for (const block of workflowBlocks) {
		expect((await request.get(`/blocks/${block.slug}`)).status(), block.slug).toBe(200);
	}
});

test('composed forms validate and update local state', async ({ page }) => {
	await page.goto('/previews/blocks/login/login-centered-login', {
		waitUntil: 'domcontentloaded'
	});
	await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
	await page.getByLabel('Work email', { exact: true }).fill('demo@example.test');
	await page.getByLabel('Password', { exact: true }).fill('sample-password');
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(
		page.getByText(/Credentials for demo@example.test passed local validation/)
	).toBeVisible();
	await page.goto('/previews/blocks/todo-list/todo-list-task-capture', {
		waitUntil: 'domcontentloaded'
	});
	await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
	await page.getByLabel('New task', { exact: true }).fill('Review the block gallery');
	await page.getByRole('button', { name: 'Add task', exact: true }).click();
	const task = page.getByRole('checkbox', { name: 'Review the block gallery', exact: true });
	await expect(task).toBeVisible();
	await task.check();
	await page.getByRole('button', { name: 'Clear completed tasks' }).click();
	await expect(task).toHaveCount(0);
});

test.describe('catalog preview coverage', () => {
	test.describe.configure({ mode: 'parallel' });
	for (const category of blockCategories) {
		test(`${category.title}: every selected block renders and hydrates`, async ({ page }) => {
			const errors: string[] = [];
			page.on('pageerror', (error) => errors.push(error.message));
			for (const block of category.blocks) {
				await page.setViewportSize({ width: 1440, height: 1000 });
				const response = await page.goto(`/previews/blocks/${category.slug}/${block.id}`, {
					waitUntil: 'domcontentloaded'
				});
				expect(response?.status(), block.file).toBe(200);
				await expect(
					page.locator(`[data-block-preview="${block.id}"][data-preview-ready="true"]`)
				).toBeVisible({ timeout: 30000 });
				await page.evaluate(
					() =>
						new Promise<void>((resolve) =>
							requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
						)
				);
				expect(errors, block.file).toEqual([]);
				await page.setViewportSize({ width: 390, height: 844 });
				await expect
					.poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
						message: `${block.file} fits a mobile screen`
					})
					.toBeLessThanOrEqual(390);
			}
		});
	}
});
