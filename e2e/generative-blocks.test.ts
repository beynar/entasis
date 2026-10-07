import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.use({ baseURL: process.env.BLOCKS_BASE_URL ?? 'http://127.0.0.1:4173' });

const sections = (page: Page) => page.locator('[data-artboard] [data-section-type]');
const order = (page: Page) =>
	sections(page).evaluateAll((elements) =>
		elements.map((element) => (element as HTMLElement).dataset.sectionType)
	);

async function audit(page: Page) {
	// Let transitions (segmented indicators, colour fades) settle so axe measures resting colours.
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
	await page.waitForTimeout(400);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	expect(
		results.violations.map(
			(violation) =>
				`${violation.id}: ${violation.help}\n${violation.nodes
					.slice(0, 3)
					.map((node) => `    ${node.target.join(' ')}`)
					.join('\n')}`
		)
	).toEqual([]);
}

test('the generative listing shows two types per category and fits a phone', async ({ page }) => {
	await page.goto('/blocks/generative', { waitUntil: 'networkidle' });
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Generative blocks');
	for (const title of ['Navbar', 'Hero', 'Pricing', 'Footer']) {
		const category = page.getByRole('region', { name: title, exact: true });
		await expect(category.getByRole('heading', { level: 3 })).toHaveCount(2);
	}
	await audit(page);
	await page.setViewportSize({ width: 390, height: 844 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('levers snap to legal variants and hand-edited links are validated', async ({ page }) => {
	await page.goto('/blocks/generative/hero-split?textCols=5&headline=h1', {
		waitUntil: 'networkidle'
	});
	await expect(page.getByRole('alert')).toContainText('The link’s levers were rejected');

	await page.goto(
		'/blocks/generative/hero-split?layout=split&textCols=7&mediaSide=end&media=photo&headline=h2&eyebrow=true&buttons=1&proof=none&tone=plain&density=normal',
		{ waitUntil: 'networkidle' }
	);
	await expect(page.getByRole('alert')).toHaveCount(0);
	const levers = page.getByRole('group', { name: 'Levers' });
	// A product mock needs six media columns: choosing it snaps the text columns from 7 to 6.
	await levers.getByRole('radio', { name: 'Product', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'snapped' })).toContainText(
		'Text columns → 6'
	);
	await expect.poll(() => new URL(page.url()).searchParams.get('textCols')).toBe('6');
	await expect.poll(() => new URL(page.url()).searchParams.get('media')).toBe('product');
	await audit(page);
});

test('the composer drags sections in, reorders, undoes, and previews', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.goto('/blocks/generative/compose', { waitUntil: 'networkidle' });
	await page.evaluate(() => localStorage.clear());
	await page.reload({ waitUntil: 'networkidle' });
	await expect(sections(page)).toHaveCount(10);
	const before = await order(page);

	const row = page.getByRole('listitem').filter({ hasText: 'Logo wall' }).first();
	const target = sections(page).nth(1);
	await row.scrollIntoViewIfNeeded();
	const from = await row.boundingBox();
	const to = await target.boundingBox();
	if (!from || !to) throw new Error('Drag endpoints are not visible');
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(from.x + from.width / 2 + 6, from.y + from.height / 2 + 6, { steps: 4 });
	for (let step = 0; step < 10; step += 1) {
		await page.mouse.move(to.x + to.width / 2, to.y + 8 + (step % 2), { steps: 2 });
		await page.waitForTimeout(40);
	}
	await page.mouse.up();
	await expect(sections(page)).toHaveCount(11);
	expect((await order(page))[1]).toBe('logos-grid');

	await page.keyboard.press('Escape');
	await page.keyboard.press('ControlOrMeta+z');
	await expect(sections(page)).toHaveCount(10);
	expect(await order(page)).toEqual(before);

	const seed = page.getByRole('textbox', { name: 'Seed' });
	const previous = await seed.inputValue();
	await page.getByRole('button', { name: 'Randomize' }).click();
	await expect(seed).not.toHaveValue(previous);
	await audit(page);

	const preview = await page.getByRole('link', { name: 'Preview' }).getAttribute('href');
	expect(preview).toBeTruthy();
	await page.goto(preview as string, { waitUntil: 'networkidle' });
	await expect(page.locator('[data-generated-page] [data-tone]')).toHaveCount(10);
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('randomize remixes section types and the component kit, and locks hold', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 1000 });
	await page.goto('/blocks/generative/compose', { waitUntil: 'networkidle' });
	await page.evaluate(() => localStorage.clear());
	await page.reload({ waitUntil: 'networkidle' });
	const stored = () =>
		page.evaluate(
			() =>
				JSON.parse(localStorage.getItem('entasis-generative-composer') ?? 'null') as {
					kit?: { params: Record<string, string> };
				} | null
		);
	const outlines = new Set<string>();
	const kits = new Set<string>();
	for (let roll = 0; roll < 4; roll += 1) {
		await page.getByRole('button', { name: 'Randomize' }).click();
		outlines.add((await order(page)).join(','));
		kits.add(JSON.stringify((await stored())?.kit?.params));
	}
	expect(outlines.size).toBeGreaterThan(1);
	expect(kits.size).toBeGreaterThan(1);

	await page.getByRole('button', { name: 'Lock the kit' }).click();
	const lockedKit = JSON.stringify((await stored())?.kit?.params);
	await page.getByRole('switch', { name: /mixes the section types/ }).click();
	const lockedOutline = await order(page);
	await page.getByRole('button', { name: 'Randomize' }).click();
	expect(JSON.stringify((await stored())?.kit?.params)).toBe(lockedKit);
	expect(await order(page)).toEqual(lockedOutline);
});
