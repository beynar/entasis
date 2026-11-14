// The APG pattern checker itself, on small hand-written widgets: a correct one passes, and each
// kind of fault it exists to catch is reported.
import { afterEach, describe, expect, test } from 'vitest';
import { checkPattern } from './apg.test-helper.js';

let host: HTMLElement | undefined;
afterEach(() => host?.remove());

/** Mounts markup in a fresh element. */
function mount(html: string, dir: 'ltr' | 'rtl' = 'ltr') {
	host = document.createElement('div');
	host.dir = dir;
	host.innerHTML = html;
	document.body.append(host);
	return host;
}

/**
 * A roving-tabindex toolbar: Left/Right (swapped right to left when `mirrored`), Home and End.
 * With `mirrored` false it ignores the reading direction, the fault RTL checks look for.
 */
function rovingToolbar(dir: 'ltr' | 'rtl', { mirrored = true } = {}) {
	const root = mount(
		`<div role="toolbar" aria-label="Format">
			<button tabindex="0">Bold</button>
			<button tabindex="-1">Italic</button>
			<button tabindex="-1">Underline</button>
		</div>`,
		dir
	);
	const toolbar = root.querySelector<HTMLElement>('[role=toolbar]')!;
	const buttons = [...toolbar.querySelectorAll<HTMLElement>('button')];
	const move = (to: number) => {
		buttons.forEach((button, index) => (button.tabIndex = index === to ? 0 : -1));
		buttons[to].focus();
	};
	toolbar.addEventListener('keydown', (event) => {
		const index = buttons.indexOf(document.activeElement as HTMLElement);
		const rtl = mirrored && dir === 'rtl';
		const next = rtl ? 'ArrowLeft' : 'ArrowRight';
		const previous = rtl ? 'ArrowRight' : 'ArrowLeft';
		if (event.key === next) move((index + 1) % buttons.length);
		else if (event.key === previous) move((index - 1 + buttons.length) % buttons.length);
		else if (event.key === 'Home') move(0);
		else if (event.key === 'End') move(buttons.length - 1);
		else return;
		event.preventDefault();
	});
	return toolbar;
}

describe('checkPattern', () => {
	test.each(['ltr', 'rtl'] as const)('passes a correct toolbar (%s)', async (dir) => {
		await checkPattern(rovingToolbar(dir), 'toolbar', { dir });
	});

	test('reports arrows that ignore right-to-left text', async () => {
		const toolbar = rovingToolbar('rtl', { mirrored: false });
		await expect(checkPattern(toolbar, 'toolbar', { dir: 'rtl' })).rejects.toThrow(
			/\[arrows\].*ArrowLeft should move focus to the next control/
		);
	});

	test('reports several tab stops and a nameless tab', async () => {
		const root = mount(
			`<div role="tablist">
				<button role="tab" aria-selected="true" aria-controls="panel">One</button>
				<button role="tab" aria-selected="false" aria-label=""></button>
			</div>
			<div role="tabpanel" id="panel">Panel</div>`
		);
		const error = await checkPattern(root, 'tabs').catch((caught: Error) => caught);
		expect(String(error)).toMatch(/\[tab-stop\].*has 2 tab stops/);
		expect(String(error)).toMatch(/\[names\].*has no accessible name/);
	});

	test('reports a dangling id reference', async () => {
		const root = mount(
			`<div role="radiogroup" aria-label="Size" aria-describedby="missing">
				<button role="radio" aria-checked="true" tabindex="0">Small</button>
			</div>`
		);
		await expect(checkPattern(root, 'radiogroup', { only: ['references'] })).rejects.toThrow(
			/aria-describedby points at "missing"/
		);
	});

	test('reports focus that falls to the body', async () => {
		const root = mount(
			`<div role="listbox" aria-label="Fruit" tabindex="0">
				<div role="option" id="a" aria-selected="true">Apple</div>
				<div role="option" id="b" aria-selected="false">Banana</div>
			</div>`
		);
		const listbox = root.querySelector<HTMLElement>('[role=listbox]')!;
		listbox.setAttribute('aria-activedescendant', 'a');
		listbox.addEventListener('keydown', () => listbox.blur());
		await expect(checkPattern(listbox, 'listbox')).rejects.toThrow(/focus fell to the body/);
	});

	test('reports focus moved into aria-hidden content', async () => {
		const toolbar = rovingToolbar('ltr');
		const italic = toolbar.querySelectorAll('button')[1];
		const hidden = document.createElement('span');
		hidden.setAttribute('aria-hidden', 'true');
		italic.replaceWith(hidden);
		hidden.append(italic);
		await expect(checkPattern(toolbar, 'toolbar')).rejects.toThrow(/inside aria-hidden or inert/);
	});
});
