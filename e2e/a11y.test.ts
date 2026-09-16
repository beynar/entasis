// axe-core sweep over every component docs page and every block preview.
// Known, justified violations live in ./a11y.allowlist.json as { route, ruleId, reason }.
import { readdir, readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { blockCategories } from '../src/routes/blocks/catalog.js';

test.use({ baseURL: process.env.BLOCKS_BASE_URL ?? 'http://127.0.0.1:4173' });

type Allow = { route: string; ruleId: string; reason: string };
const allowlist: Allow[] = JSON.parse(
	await readFile(new URL('./a11y.allowlist.json', import.meta.url), 'utf8')
);
const isAllowed = (route: string, ruleId: string) =>
	allowlist.some((entry) => entry.ruleId === ruleId && new RegExp(entry.route).test(route));

async function audit(page: Page, route: string) {
	// Let enter transitions (accordion slides, fades) finish so axe measures resting colours.
	await page.evaluate(() =>
		Promise.race([
			Promise.all(
				document
					.getAnimations()
					.filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
					.map((animation) => animation.finished.catch(() => undefined))
			),
			new Promise((resolve) => setTimeout(resolve, 1500))
		])
	);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	const violations = results.violations.filter((violation) => !isAllowed(route, violation.id));
	expect(
		violations.map(
			(violation) =>
				`${route} · ${violation.id} (${violation.impact}): ${violation.help}\n` +
				violation.nodes
					.slice(0, 3)
					.map((node) => `    ${node.target.join(' ')}`)
					.join('\n')
		),
		`axe violations on ${route}`
	).toEqual([]);
}

const componentsDir = new URL('../src/routes/components/', import.meta.url);
const componentRoutes = (
	await Promise.all(
		(await readdir(componentsDir, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.map(async (entry) => {
				// Only directories that are real routes (some hold shared demos without a page).
				const files = await readdir(new URL(`${entry.name}/`, componentsDir));
				return files.includes('+page.svelte') ? `/components/${entry.name}` : null;
			})
	)
)
	.filter((route): route is string => route !== null)
	.sort();

test.describe('component pages', () => {
	test.describe.configure({ mode: 'parallel' });
	for (const route of componentRoutes) {
		test(`${route} has no axe violations`, async ({ page }) => {
			await page.goto(route, { waitUntil: 'networkidle' });
			await audit(page, route);
			// Open the first demo overlay when the page exposes one, and audit the open state too.
			const trigger = page.locator('[data-doc-demo-trigger]').first();
			if (await trigger.count()) {
				await trigger.click();
				await page.waitForTimeout(300);
				await audit(page, `${route} (open)`);
			}
		});
	}
});

test.describe('block previews', () => {
	test.describe.configure({ mode: 'parallel' });
	for (const category of blockCategories) {
		test(`${category.title} blocks have no axe violations`, async ({ page }) => {
			for (const block of category.blocks) {
				const route = `/previews/blocks/${category.slug}/${block.id}`;
				await page.goto(route, { waitUntil: 'domcontentloaded' });
				await expect(page.locator('[data-preview-ready="true"]')).toBeVisible({ timeout: 30000 });
				await audit(page, route);
			}
		});
	}
});
