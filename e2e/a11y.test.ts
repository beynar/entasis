// axe-core sweep over every component docs page and every block preview.
// Known, justified violations live in ./a11y.allowlist.json as { route, ruleId, reason }.
import { readdir, readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { blockCategories } from '../src/routes/blocks/catalog.js';

// The preview origin comes from playwright.config.ts (E2E_PORT); BLOCKS_BASE_URL points the suite
// at another server, such as a deployed docs site.
if (process.env.BLOCKS_BASE_URL) test.use({ baseURL: process.env.BLOCKS_BASE_URL });

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
		});
	}
});

// A page at rest has every popup closed, so the sweep above never sees a listbox, a menu or a
// dialog. Each entry opens one through its docs demo the way a user would, waits for the popup,
// and audits the page with it open. The audited route is `<route> (<what is open>)`, which is
// what allowlist entries for an open state match.
const openPopups: { route: string; open: string; show: (page: Page) => Promise<unknown> }[] = [
	{
		route: '/components/select',
		open: 'listbox open',
		async show(page) {
			await page.getByRole('combobox').first().click();
			await page.getByRole('listbox').first().waitFor();
		}
	},
	{
		route: '/components/combobox',
		open: 'listbox open',
		async show(page) {
			const input = page.getByRole('combobox').first();
			await input.click();
			await input.pressSequentially('a');
			await page.getByRole('listbox').first().waitFor();
		}
	},
	{
		route: '/components/tags-input',
		open: 'listbox open',
		async show(page) {
			await page.getByRole('tab', { name: 'Examples' }).click();
			// The static-list example lists every option on focus.
			await page.getByPlaceholder('Search technologies...').first().click();
			await page.getByRole('listbox').first().waitFor();
		}
	},
	{
		route: '/components/phone',
		open: 'country picker open',
		async show(page) {
			await page
				.getByRole('button', { name: /Change country/ })
				.first()
				.click();
			await page.getByRole('listbox').first().waitFor();
		}
	},
	{
		route: '/components/popup-menu',
		open: 'submenu open',
		async show(page) {
			await page.getByRole('button', { name: 'File', exact: true }).first().click();
			await page.getByRole('menuitem', { name: 'Submenu' }).first().hover();
			await expect(page.getByRole('menu')).toHaveCount(2);
		}
	},
	{
		route: '/components/menu-bar',
		open: 'menu open',
		async show(page) {
			await page.getByRole('menubar').first().getByRole('menuitem', { name: 'File' }).click();
			await page.getByRole('menu').first().waitFor();
		}
	},
	{
		route: '/components/dialog',
		open: 'dialog open',
		async show(page) {
			await page.getByRole('button', { name: 'Open', exact: true }).first().click();
			await page.getByRole('dialog').first().waitFor();
		}
	}
];

test.describe('component pages with a popup open', () => {
	test.describe.configure({ mode: 'parallel' });
	for (const { route, open, show } of openPopups) {
		test(`${route} (${open}) has no axe violations`, async ({ page }) => {
			await page.goto(route, { waitUntil: 'networkidle' });
			await show(page);
			await audit(page, `${route} (${open})`);
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
