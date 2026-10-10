// Large-list baselines for SC-9 (Select, Combobox and Command with 1,000 options).
import { flushSync } from 'svelte';
import { expect, test, vi } from 'vitest';
import { countAll, createFixture, measure, typeInto } from './fixture.js';

const OPTIONS = 1000;

test('Select: open a 1,000-option listbox', async ({ bench }) => {
	const fixture = createFixture('select', OPTIONS);
	let trigger: HTMLElement;
	await measure(
		bench,
		{ name: 'select open (1,000 options)', file: 'select-open-1000' },
		{
			beforeEach() {
				trigger = fixture.mount().querySelector<HTMLElement>('[role="combobox"]')!;
			},
			afterEach() {
				const options = countAll('[role="option"]');
				fixture.unmount();
				expect(options).toBe(OPTIONS);
			}
		},
		() => {
			trigger.click();
			flushSync();
		}
	);
});

test('Combobox: a keystroke that narrows 1,000 options', async ({ bench }) => {
	const fixture = createFixture('combobox', OPTIONS);
	let input: HTMLInputElement;
	// The search is debounced by 100 ms; fake timers skip the wait without measuring it.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const settle = async () => {
		flushSync();
		vi.advanceTimersByTime(100);
		for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
		flushSync();
	};
	try {
		await measure(
			bench,
			{ name: 'combobox keystroke (1,000 options)', file: 'combobox-keystroke-1000' },
			{
				async beforeEach() {
					input = fixture.mount().querySelector<HTMLInputElement>('input[role="combobox"]')!;
					input.focus();
					await settle();
					expect(countAll('[role="option"]')).toBe(OPTIONS);
				},
				afterEach() {
					const options = countAll('[role="option"]');
					fixture.unmount();
					// "Option 1" matches 1, 10–19, 100–199 and 1000.
					expect(options).toBe(112);
				}
			},
			async () => {
				typeInto(input, 'Option 1');
				await settle();
			}
		);
	} finally {
		vi.useRealTimers();
	}
});

test('Command: a keystroke that narrows 1,000 items', async ({ bench }) => {
	const fixture = createFixture('command', OPTIONS);
	let input: HTMLInputElement;
	await measure(
		bench,
		{ name: 'command keystroke (1,000 items)', file: 'command-keystroke-1000' },
		{
			beforeEach() {
				input = fixture.mount().querySelector<HTMLInputElement>('input')!;
				expect(countAll('[role="option"]')).toBe(OPTIONS);
			},
			afterEach() {
				const options = countAll('[role="option"]');
				fixture.unmount();
				expect(options).toBe(112);
			}
		},
		() => {
			typeInto(input, 'Option 1');
			flushSync();
		}
	);
});
