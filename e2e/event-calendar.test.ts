// Pins EventCalendar browser behavior that jsdom cannot express: native HTML5
// drag and drop through pragmatic-drag-and-drop, pointer-capture slot drags,
// real document.elementsFromPoint hit-testing, and layout-dependent month
// overflow. Harness route: /__event-calendar-e2e (UTC, week of 2026-07-13).
import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4173' });

const ROUTE = '/__event-calendar-e2e';
const ROOT = '[data-event-calendar-part="root"]';

const calendarRoot = (page: Page) => page.locator(ROOT);
const itemElement = (page: Page, occurrenceKey: string) =>
	page.locator(`${ROOT} [data-event-calendar-part="item"][data-occurrence-key="${occurrenceKey}"]`);
const dayColumn = (page: Page, day: string) =>
	page.locator(`${ROOT} [data-event-calendar-part="day-column"][data-day="${day}"]`);
const timedSlot = (page: Page, day: string, slotStartIso: string) =>
	dayColumn(page, day).locator(
		`[data-event-calendar-part="time-slot"][data-slot-start="${slotStartIso}"]`
	);
const lastChange = (page: Page) => page.getByTestId('last-change');
const lastSelect = (page: Page) => page.getByTestId('last-select');

async function gotoHarness(page: Page) {
	await page.goto(ROUTE);
	// `data-e2e-ready` is set from the page's onMount, so hydration and the
	// interaction attachments (draggables, drop targets, pointer drags) are live.
	await page.locator('[data-e2e-ready="true"]').waitFor();
	await expect(itemElement(page, 'move-me')).toBeVisible();
}

async function dispatchVisibilityChange(page: Page, state: 'hidden' | 'visible') {
	await page.evaluate((nextState) => {
		Object.defineProperty(document, 'visibilityState', {
			configurable: true,
			value: nextState
		});
		document.dispatchEvent(new Event('visibilitychange'));
	}, state);
}

type Point = { x: number; y: number };

// A point on the element's horizontal center, `insetY` px below its top edge —
// near the top keeps grab offsets and snapped instants deterministic.
async function topCenter(locator: Locator, insetY = 2): Promise<Point> {
	const box = await locator.boundingBox();
	if (!box) throw new Error(`No bounding box for ${locator}`);
	return { x: box.x + box.width / 2, y: box.y + Math.min(insetY, box.height / 2) };
}

const DRAG_EVENT_INIT = { bubbles: true, cancelable: true, composed: true } as const;

/**
 * Runs a native-style HTML5 drag: dragstart on the source, then
 * dragenter/dragover/drop on the target. pragmatic-drag-and-drop tracks the
 * drag through the bubbling events; EventCalendar resolves the drop target via
 * document.elementsFromPoint at the event coordinates, so `to` must land on the
 * real target element.
 */
async function html5Drag(page: Page, source: Locator, target: Locator) {
	const from = await topCenter(source);
	const to = await topCenter(target);
	const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
	await source.dispatchEvent('dragstart', {
		...DRAG_EVENT_INIT,
		dataTransfer,
		clientX: from.x,
		clientY: from.y
	});
	await target.dispatchEvent('dragenter', {
		...DRAG_EVENT_INIT,
		dataTransfer,
		clientX: to.x,
		clientY: to.y
	});
	await target.dispatchEvent('dragover', {
		...DRAG_EVENT_INIT,
		dataTransfer,
		clientX: to.x,
		clientY: to.y
	});
	// The interaction controller coalesces drag updates through rAF; give it a
	// frame so the drop target registration settles before the drop.
	await page.waitForTimeout(60);
	await target.dispatchEvent('drop', {
		...DRAG_EVENT_INIT,
		dataTransfer,
		clientX: to.x,
		clientY: to.y
	});
	await source.dispatchEvent('dragend', { ...DRAG_EVENT_INIT, dataTransfer });
}

test.describe('EventCalendar browser interactions', () => {
	test('pointer movement does not re-expand the admitted recurrence collection', async ({
		page
	}) => {
		await gotoHarness(page);
		await page.waitForTimeout(50);
		const readExpansionCount = () =>
			page.evaluate(
				() =>
					(window as Window & { __eventCalendarExpansionCount?: number })
						.__eventCalendarExpansionCount ?? 0
			);
		const before = await readExpansionCount();
		const start = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T13:00:00.000Z'), 1);
		const end = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T15:00:00.000Z'), 1);

		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(end.x, end.y, { steps: 30 });
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-kind', 'slot-create');
		expect(await readExpansionCount()).toBe(before);
		await page.mouse.up();
	});

	test('HTML5 drag of a timed item commits a move change', async ({ page }) => {
		await gotoHarness(page);
		// Drag "Move me" from Monday 09:00 to the Wednesday 13:00 slot.
		await html5Drag(
			page,
			itemElement(page, 'move-me'),
			timedSlot(page, '2026-07-15', '2026-07-15T13:00:00.000Z')
		);
		await expect(lastChange(page)).toContainText('"kind":"move"');
		await expect(lastChange(page)).toContainText('"source":"drag"');
		await expect(lastChange(page)).toContainText('"itemId":"move-me"');
		// Snapped to the 15-minute grid near the top of the 13:00 slot.
		await expect(lastChange(page)).toContainText('"start":"2026-07-15T13:00:00.000Z"');
		// The rendered item moved into the Wednesday column.
		await expect(
			dayColumn(page, '2026-07-15').locator('[data-occurrence-key="move-me"]')
		).toBeVisible();
	});

	test('pointer drag across timed slots fires onSelect with drag-create', async ({ page }) => {
		await gotoHarness(page);
		// Real pointer events: slot-create uses pointer capture + a 5px activation
		// distance, so page.mouse is required (synthetic dispatch cannot capture). Keep
		// the path away from the scroll edges so auto-scroll timing cannot change its time.
		const start = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T11:00:00.000Z'), 1);
		const end = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T12:00:00.000Z'), 1);
		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(end.x, end.y, { steps: 12 });
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-kind', 'slot-create');
		await page.mouse.up();
		await expect(lastSelect(page)).toContainText('"source":"drag-create"');
		await expect(lastSelect(page)).toContainText('"allDay":false');
		// Pointer sampling + snapping resolve deterministically to mid-slot instants.
		await expect(lastSelect(page)).toContainText('"start":"2026-07-16T11:15:00.000Z"');
		await expect(lastSelect(page)).toContainText('"end":"2026-07-16T12:15:00.000Z"');
		// The gesture ended; lastSelect above is the commit witness. The 11:15
		// anchor is off-grid, so no slot button is marked pressed.
		await expect(calendarRoot(page)).not.toHaveAttribute('data-interaction-kind', 'slot-create');
	});

	test('visibility refresh does not cancel an active pointer slot drag', async ({ page }) => {
		await gotoHarness(page);
		const start = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T13:00:00.000Z'), 1);
		const end = await topCenter(timedSlot(page, '2026-07-16', '2026-07-16T14:00:00.000Z'), 1);

		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(start.x + 12, start.y + 12, { steps: 4 });
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-kind', 'slot-create');

		await dispatchVisibilityChange(page, 'hidden');
		await dispatchVisibilityChange(page, 'visible');
		await page.waitForTimeout(50);
		await page.mouse.move(end.x, end.y, { steps: 12 });
		await page.mouse.up();

		await expect(lastSelect(page)).toContainText('"source":"drag-create"');
		await expect(calendarRoot(page)).not.toHaveAttribute('data-interaction-kind', 'slot-create');
	});

	test('externalEvent drag into a column commits an add with external-drop', async ({ page }) => {
		await gotoHarness(page);
		// Drag the harness' externalEvent source onto the Friday 14:00 slot.
		await html5Drag(
			page,
			page.getByTestId('external-source'),
			timedSlot(page, '2026-07-17', '2026-07-17T14:00:00.000Z')
		);
		await expect(lastChange(page)).toContainText('"kind":"add"');
		await expect(lastChange(page)).toContainText('"source":"external-drop"');
		await expect(lastChange(page)).toContainText('"itemId":"external-1"');
		// The drop resolves and snaps to 14:30 for this pointer geometry
		// (verified identical on the pre-redesign baseline).
		await expect(lastChange(page)).toContainText('"start":"2026-07-17T14:30:00.000Z"');
	});

	test('HTML5 drag of a resize handle commits a resize change', async ({ page }) => {
		await gotoHarness(page);
		// Drag "Resize me" (Tue 09:00-10:00) bottom edge down to the 12:00 slot.
		const handle = itemElement(page, 'resize-me').locator(
			'[data-event-calendar-part="resize-handle"][data-edge="end"]'
		);
		await html5Drag(page, handle, timedSlot(page, '2026-07-14', '2026-07-14T12:00:00.000Z'));
		await expect(lastChange(page)).toContainText('"kind":"resize"');
		await expect(lastChange(page)).toContainText('"source":"resize-end"');
		await expect(lastChange(page)).toContainText('"itemId":"resize-me"');
		await expect(lastChange(page)).toContainText('"end":"2026-07-14T12:00:00.000Z"');
	});

	test('Escape during a native drag cancels without committing', async ({ page }) => {
		await gotoHarness(page);
		const source = itemElement(page, 'move-me');
		const target = timedSlot(page, '2026-07-15', '2026-07-15T13:00:00.000Z');
		const from = await topCenter(source);
		const to = await topCenter(target);
		const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
		await source.dispatchEvent('dragstart', {
			...DRAG_EVENT_INIT,
			dataTransfer,
			clientX: from.x,
			clientY: from.y
		});
		await target.dispatchEvent('dragover', {
			...DRAG_EVENT_INIT,
			dataTransfer,
			clientX: to.x,
			clientY: to.y
		});
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-kind', 'move');
		await page.keyboard.press('Escape');
		await expect(calendarRoot(page)).not.toHaveAttribute('data-interaction-kind', 'move');
		// The late drop lands on a cancelled gesture and must not commit.
		await target.dispatchEvent('drop', {
			...DRAG_EVENT_INIT,
			dataTransfer,
			clientX: to.x,
			clientY: to.y
		});
		await source.dispatchEvent('dragend', { ...DRAG_EVENT_INIT, dataTransfer });
		await expect(lastChange(page)).toHaveText('none');
		// The item never left the Monday column.
		await expect(
			dayColumn(page, '2026-07-13').locator('[data-occurrence-key="move-me"]')
		).toBeVisible();
	});

	test('month view +N overflow trigger opens and closes a popover', async ({ page }) => {
		await gotoHarness(page);
		await page.getByRole('radio', { name: 'Month' }).click();
		await expect(page.locator(`${ROOT} [data-event-calendar-part="month"]`)).toBeVisible();
		// month.maxItemsPerCell=1: any day with two or more items overflows.
		const trigger = page.locator(`${ROOT} [data-event-calendar-part="overflow"]`).first();
		await expect(trigger).toBeVisible();
		await trigger.click();
		const content = page.locator('[data-event-calendar-overflow-content]');
		await expect(content).toBeVisible();
		// MonthOverflow wires openOnClick=false: the trigger click toggles the
		// popover, and Escape needs focus inside the layer stack — toggling is the
		// close path this component owns.
		await trigger.click();
		await expect(content).not.toBeVisible();
	});

	test('keyboard m + Enter commits an assisted move', async ({ page }) => {
		await gotoHarness(page);
		const control = itemElement(page, 'focus-me').locator('button');
		await control.focus();
		await page.keyboard.press('m');
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-kind', 'move');
		await expect(calendarRoot(page)).toHaveAttribute('data-interaction-input', 'assisted');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');
		await expect(lastChange(page)).toContainText('"kind":"move"');
		await expect(lastChange(page)).toContainText('"source":"keyboard"');
		await expect(lastChange(page)).toContainText('"itemId":"focus-me"');
		// Wednesday 11:00 + one day lands on Thursday 11:00.
		await expect(lastChange(page)).toContainText('"start":"2026-07-16T11:00:00.000Z"');
	});
});
