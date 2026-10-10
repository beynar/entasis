// axe-core sweep over every component docs page and every block preview.
// Known, justified violations live in ./a11y.allowlist.json as { route, ruleId, match?, reason }.
// `match` narrows an entry to the violating nodes whose axe failure summary contains it, so one
// known child (say `[role=scrollbar]`) does not hide the whole rule for that route.
import { readdir, readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { blockCategories } from '../src/routes/blocks/catalog.js';

// The preview origin comes from playwright.config.ts (E2E_PORT); BLOCKS_BASE_URL points the suite
// at another server, such as a deployed docs site.
if (process.env.BLOCKS_BASE_URL) test.use({ baseURL: process.env.BLOCKS_BASE_URL });

type Allow = { route: string; ruleId: string; match?: string; reason: string };
const allowlist: Allow[] = JSON.parse(
	await readFile(new URL('./a11y.allowlist.json', import.meta.url), 'utf8')
);
const appliesTo = (entry: Allow, route: string) => new RegExp(entry.route).test(route);

/**
 * Audit the page as it is now. With `strict`, every allowlist entry for `route` must still cover
 * a violation: an entry that suppresses nothing means its fix landed, and the test asks for its
 * removal. Open-popup states use it; their popups are opened and settled deterministically.
 */
async function audit(page: Page, route: string, { strict = false }: { strict?: boolean } = {}) {
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
	const used = new Set<Allow>();
	const violations = results.violations
		.map((violation) => ({
			...violation,
			nodes: violation.nodes.filter((node) => {
				const covering = allowlist.filter(
					(entry) =>
						entry.ruleId === violation.id &&
						appliesTo(entry, route) &&
						(!entry.match || node.failureSummary?.includes(entry.match))
				);
				for (const entry of covering) used.add(entry);
				return covering.length === 0;
			})
		}))
		.filter((violation) => violation.nodes.length > 0);
	expect(
		violations.map(
			(violation) =>
				`${route} · ${violation.id} (${violation.impact}): ${violation.help}\n` +
				violation.nodes
					.slice(0, 3)
					.map(
						(node) =>
							`    ${node.target.join(' ')}: ${node.failureSummary?.replace(/\s+/g, ' ') ?? ''}`
					)
					.join('\n')
		),
		`axe violations on ${route}`
	).toEqual([]);
	if (strict) {
		expect(
			allowlist
				.filter((entry) => appliesTo(entry, route) && !used.has(entry))
				.map((entry) => `${entry.ruleId} ${entry.route}${entry.match ? ` (${entry.match})` : ''}`),
			`allowlist entries that no longer suppress anything on ${route}: remove them`
		).toEqual([]);
	}
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
// dialog. Each entry opens one through its docs demo the way a user would, waits for the popup to
// settle, and audits the page with it open. The audited route is `<route> (<what is open>)`, which
// is what allowlist entries for an open state match. States cover each popup's distinct content:
// short and overflowing lists, grouped lists with separators, and the empty state of a search.
/** Wait until the open popup's list overflows and its ScrollArea has laid out the scrollbar. */
const scrollbarShown = (page: Page) =>
	page
		.locator('dialog[open]', { has: page.getByRole('listbox') })
		.locator('[data-slot="scroll-area-scrollbar"]')
		.first()
		.waitFor();

const openPopups: { route: string; open: string; show: (page: Page) => Promise<unknown> }[] = [
	{
		route: '/components/select',
		open: 'listbox open',
		async show(page) {
			// The Usage card's Select: a short, flat list.
			await page.getByRole('combobox').first().click();
			await page.getByRole('listbox').first().waitFor();
		}
	},
	{
		route: '/components/select',
		open: 'grouped listbox open',
		async show(page) {
			await page.getByRole('tab', { name: 'Examples' }).click();
			// Labelled groups with separators between them.
			await page.getByRole('combobox', { name: 'Timezone' }).click();
			await page.getByRole('option').first().waitFor();
		}
	},
	{
		route: '/components/select',
		open: 'long listbox open',
		async show(page) {
			await page.getByRole('tab', { name: 'Examples' }).click();
			// Taller than its cap, so the list scrolls inside the popup.
			await page.getByRole('combobox', { name: 'Country' }).click();
			await scrollbarShown(page);
		}
	},
	{
		route: '/components/combobox',
		open: 'listbox open',
		async show(page) {
			const input = page.getByRole('combobox').first();
			await input.click();
			await input.pressSequentially('a');
			await scrollbarShown(page);
		}
	},
	{
		route: '/components/combobox',
		open: 'no options found',
		async show(page) {
			const input = page.getByRole('combobox').first();
			await input.click();
			await input.pressSequentially('zzzzqq');
			await page.getByText('No options found').first().waitFor();
		}
	},
	{
		route: '/components/tags-input',
		open: 'listbox open',
		async show(page) {
			await page.getByRole('tab', { name: 'Examples' }).click();
			// The static-list example lists every option on focus.
			await page.getByPlaceholder('Search technologies...').first().click();
			await scrollbarShown(page);
		}
	},
	{
		route: '/components/tags-input',
		open: 'no options found',
		async show(page) {
			await page.getByRole('tab', { name: 'Examples' }).click();
			const input = page.getByPlaceholder('Search technologies...').first();
			await input.click();
			await input.pressSequentially('zzzzqq');
			await page.getByText('No options found').first().waitFor();
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
		route: '/components/phone',
		open: 'no countries found',
		async show(page) {
			await page
				.getByRole('button', { name: /Change country/ })
				.first()
				.click();
			await page.getByRole('dialog').getByRole('combobox').fill('zzzzqq');
			await page.getByText('No countries found').first().waitFor();
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
			await audit(page, `${route} (${open})`, { strict: true });
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
