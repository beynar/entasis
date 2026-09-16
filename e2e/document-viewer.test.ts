import { expect, test } from '@playwright/test';

test('loads the PDF runtime without fetching another format engine', async ({ page }) => {
	const runtimeRequests: string[] = [];
	page.on('request', (request) => {
		const url = request.url();
		if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|cdn\.sheetjs\.com/.test(url)) {
			runtimeRequests.push(url);
		}
	});

	await page.goto('/components/document-viewer');
	const viewport = page.locator('[aria-busy]').first();
	await expect(viewport).toHaveAttribute('aria-busy', 'false', { timeout: 30_000 });
	const viewer = viewport.locator('..');

	await expect(viewer.getByLabel('Rotate clockwise')).toBeVisible();
	await expect(viewer.getByLabel('Go to page 1')).toBeVisible();
	await expect(viewer.getByRole('tablist', { name: 'Workbook sheets' })).toHaveCount(0);
	await expect(viewer.locator('input[type="file"]')).toHaveCount(0);

	await viewer.getByLabel('Search').click();
	const search = page.getByLabel('Search document');
	await search.fill('document');
	// The search field and its match counter live in a portaled popover, outside the viewer node.
	await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();
	await search.press('Enter');
	await expect(page.getByText('2 / 8', { exact: true })).toBeVisible();
	await search.press('Escape');

	const pageInfo = viewer.locator('[aria-live="polite"]').first();
	const currentPage = Number((await pageInfo.textContent())?.split('/')[0].trim());
	const targetPage = currentPage < 3 ? currentPage + 1 : currentPage - 1;
	await viewer.getByLabel(currentPage < 3 ? 'Next page' : 'Previous page').click();
	await expect(pageInfo).toHaveText(`${targetPage} / 3`);
	await expect(viewer.getByLabel(`Go to page ${targetPage}`)).toHaveAttribute(
		'aria-current',
		'page'
	);

	expect(runtimeRequests.some((url) => url.includes('/pdf.js/5.4.149/'))).toBe(true);
	expect(
		runtimeRequests.some((url) => /@silurus|office-oxide|papaparse|xlsx-0\.20\.3/.test(url))
	).toBe(false);
});

test('the demo renders every supported document format', async ({ page }) => {
	await page.goto('/components/document-viewer');
	const format = page.getByRole('combobox', { name: 'Preview format' });

	const selectFormat = async (label: string) => {
		await format.click();
		await page.getByRole('option', { name: label, exact: true }).click();
		await expect(format).toHaveText(label);
		const viewport = page.locator('[aria-busy]').first();
		await expect(viewport).toHaveAttribute('aria-busy', 'false', { timeout: 30_000 });
		return viewport.locator('..');
	};

	let viewer = await selectFormat('Word — DOCX');
	await expect(viewer.getByLabel('Go to page 3')).toBeVisible();
	await expect(viewer.getByRole('alert')).toHaveCount(0);

	viewer = await selectFormat('Word — DOC');
	await expect(viewer.getByText('Best-effort legacy DOC preview', { exact: false })).toBeVisible();
	await expect(viewer.getByRole('alert')).toHaveCount(0);

	viewer = await selectFormat('Excel — XLSX');
	await expect(viewer.getByRole('tab', { name: 'Revenue' })).toBeVisible();
	await expect(viewer.getByText('Élodie', { exact: true })).toBeVisible();

	viewer = await selectFormat('Excel — XLS');
	await expect(viewer.getByRole('tab', { name: 'Notes' })).toBeVisible();
	await expect(viewer.getByText('李明', { exact: true })).toBeVisible();

	viewer = await selectFormat('CSV');
	await expect(viewer.getByRole('tablist', { name: 'Workbook sheets' })).toHaveCount(0);
	await expect(viewer.getByText('Asia Pacific', { exact: true })).toBeVisible();

	viewer = await selectFormat('PowerPoint — PPTX');
	await expect(viewer.getByLabel('Go to slide 5')).toBeVisible();
	await expect(viewer.getByRole('alert')).toHaveCount(0);

	viewer = await selectFormat('PowerPoint — PPT');
	await expect(viewer.getByText('Best-effort legacy PPT preview', { exact: false })).toBeVisible();
	await expect(viewer.getByLabel('Go to slide 5')).toBeVisible();
	await expect(viewer.getByRole('alert')).toHaveCount(0);
});
