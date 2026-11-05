// The JsonEditor in a real engine: the controls a schema picks, the guards it sets, and every edit,
// checked against the value the parent receives.
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import JsonEditorFormHarness from './JsonEditorFormHarness.test.svelte';
import JsonEditorHarness from './JsonEditorHarness.test.svelte';
import type { JsonSchema, JsonValue } from './jsonEditor.schema.js';
import type { JsonEditorApi } from './jsonEditor.props.js';

const mount = async (props: {
	schema?: JsonSchema;
	value?: JsonValue | null;
	readOnly?: boolean;
	disabled?: boolean;
	[key: string]: unknown;
}) => {
	const onChange = vi.fn<(value: JsonValue | null) => void>();
	const screen = await render(JsonEditorHarness, { props: { ...props, onChange } });
	const last = () => onChange.mock.lastCall?.[0];
	return { onChange, last, screen };
};

const row = (path: (string | number)[]) =>
	document.querySelector<HTMLElement>(`[data-json-path='${JSON.stringify(path)}']`);
const control = (path: (string | number)[]) =>
	row(path)?.querySelector<HTMLInputElement>('[data-json-value] input:not([type="hidden"])') ??
	null;

const button = (name: string | RegExp) => page.getByRole('button', { name });

const replaceText = async (input: HTMLElement | null, text: string) => {
	if (!input) throw new Error('no input');
	await userEvent.clear(input);
	if (text) await userEvent.type(input, text);
};

describe('controls from the schema', () => {
	const schema: JsonSchema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', title: 'Name', maxLength: 5 },
			count: { type: 'integer', title: 'Count', minimum: 1, maximum: 3 },
			ratio: { type: 'number', title: 'Ratio' },
			on: { type: 'boolean', title: 'On' },
			mail: { type: 'string', format: 'email', title: 'Mail' },
			site: { type: 'string', format: 'uri', title: 'Site' },
			day: { type: 'string', format: 'date', title: 'Day' },
			secret: { type: 'string', format: 'password', title: 'Secret' },
			color: { type: 'string', format: 'color', title: 'Color' },
			long: { type: 'string', format: 'textarea', title: 'Long' },
			pick: { enum: ['a', 'b'], title: 'Pick' },
			fixed: { const: 'v1', title: 'Fixed' }
		}
	};

	test('each type and format gets its control, named by its row', async () => {
		await mount({ schema, value: {} });
		await expect.element(page.getByRole('textbox', { name: /Name/ })).toBeVisible();
		expect(control(['name'])?.maxLength).toBe(5);
		expect(control(['mail'])?.type).toBe('email');
		expect(control(['site'])?.type).toBe('url');
		expect(control(['secret'])?.type).toBe('password');
		expect(row(['long'])?.querySelector('textarea')).not.toBeNull();
		expect(row(['on'])?.querySelector('[role="switch"]')).not.toBeNull();
		expect(row(['pick'])?.querySelector('[role="combobox"]')).not.toBeNull();
		expect(row(['fixed'])?.textContent).toContain('v1');
		expect(row(['fixed'])?.querySelector('input')).toBeNull();
	});

	test('a required key says so', async () => {
		await mount({ schema, value: {} });
		expect(
			row(['name'])?.querySelector('[aria-hidden="true"]')?.parentElement?.textContent
		).toContain('*');
		expect(control(['name'])?.required).toBe(true);
		expect(control(['ratio'])?.required).toBe(false);
	});

	test('typing writes the value; emptying an optional key removes it', async () => {
		const { last } = await mount({ schema, value: { mail: 'a@b.co' } });
		await replaceText(control(['name']), 'Ada');
		expect(last()).toEqual({ mail: 'a@b.co', name: 'Ada' });
		await userEvent.clear(control(['mail'])!);
		expect(last()).toEqual({ name: 'Ada' });
	});

	test('numbers are numbers', async () => {
		const { last } = await mount({ schema, value: {} });
		await replaceText(control(['ratio']), '2.5');
		await userEvent.tab();
		expect(last()).toEqual({ ratio: 2.5 });
	});

	test('an integer refuses a decimal', async () => {
		const { last } = await mount({ schema, value: {} });
		await replaceText(control(['count']), '2.7');
		await userEvent.tab();
		expect(Number.isInteger((last() as { count: number }).count)).toBe(true);
	});

	test('a switch writes a boolean, and its clear button takes it back out', async () => {
		const { last } = await mount({ schema, value: {} });
		await userEvent.click(row(['on'])!.querySelector('[role="switch"]')!);
		expect(last()).toEqual({ on: true });
		await userEvent.click(row(['on'])!.querySelector('[role="switch"]')!);
		expect(last()).toEqual({ on: false });
		await button('Clear On').click();
		expect(last()).toEqual({});
	});

	test('a select writes the option as JSON, not as its position', async () => {
		const { last } = await mount({
			schema: { type: 'object', properties: { n: { enum: [10, 20, null], title: 'N' } } },
			value: {}
		});
		await userEvent.click(row(['n'])!.querySelector('[role="combobox"]')!);
		await page.getByRole('option', { name: '20' }).click();
		expect(last()).toEqual({ n: 20 });
		await expect.element(page.getByRole('combobox', { name: 'N' })).toHaveTextContent('20');
	});

	test('a date stays a date string', async () => {
		const { last } = await mount({ schema, value: { day: '2024-05-01' } });
		expect(control(['day'])?.value).toBe('2024-05-01');
		await replaceText(control(['day']), '2024-06-15');
		await userEvent.tab();
		expect(last()).toEqual({ day: '2024-06-15' });
	});

	test('a date-time keeps its offset when the date changes', async () => {
		const { last } = await mount({
			schema: { type: 'object', properties: { at: { type: 'string', format: 'date-time' } } },
			value: { at: '2024-05-01T23:30:00+02:00' }
		});
		const [date, time] = row(['at'])!.querySelectorAll<HTMLInputElement>('input');
		expect(date.value).toBe('2024-05-01');
		expect(time.value).toBe('23:30:00');
		await replaceText(date, '2024-06-15');
		await userEvent.tab();
		expect(last()).toEqual({ at: '2024-06-15T23:30:00+02:00' });
	});
});

describe('objects', () => {
	test('an optional object is set on request', async () => {
		const { last } = await mount({
			schema: {
				type: 'object',
				properties: {
					sub: {
						type: 'object',
						required: ['n'],
						properties: { n: { type: 'number', default: 1 } }
					}
				}
			},
			value: {}
		});
		await button('Add object').click();
		expect(last()).toEqual({ sub: { n: 1 } });
		expect(row(['sub', 'n'])).not.toBeNull();
	});

	test('a row closes and opens', async () => {
		await mount({
			schema: {
				type: 'object',
				properties: { sub: { type: 'object', properties: { n: { type: 'number' } } } }
			},
			value: { sub: { n: 1 } }
		});
		expect(row(['sub', 'n'])).not.toBeNull();
		await button('Collapse sub').click();
		await expect.poll(() => row(['sub', 'n'])).toBeNull();
		await expect.element(page.getByText('{"n":1}')).toBeVisible();
		await button('Expand sub').click();
		await expect.poll(() => row(['sub', 'n'])).not.toBeNull();
	});

	test('expand depth decides what starts open', async () => {
		await mount({
			schema: {
				type: 'object',
				properties: { sub: { type: 'object', properties: { n: { type: 'number' } } } }
			},
			value: { sub: { n: 1 } },
			expandDepth: 0
		});
		expect(row(['sub', 'n'])).toBeNull();
		await button('Expand all').click();
		await expect.poll(() => row(['sub', 'n'])).not.toBeNull();
		await button('Collapse all').click();
		await expect.poll(() => row(['sub', 'n'])).toBeNull();
	});

	test('additionalProperties: a key is named first, and then holds its schema', async () => {
		const { last } = await mount({
			schema: { type: 'object', additionalProperties: { type: 'number' } },
			value: { a: 1 }
		});
		await button('Add property').click();
		const key = page.getByRole('textbox', { name: 'Property name' }).last();
		await expect.element(key).toHaveFocus();
		await userEvent.keyboard('b{Enter}');
		expect(last()).toEqual({ a: 1, b: 0 });
		await expect.poll(() => document.activeElement).toBe(control(['b']));
	});

	test('a taken name is refused where it was typed', async () => {
		const { last, onChange } = await mount({
			schema: { type: 'object', additionalProperties: { type: 'string' } },
			value: { a: 'x', b: 'y' }
		});
		const key = row(['b'])!.querySelector<HTMLInputElement>('[data-json-key]')!;
		await replaceText(key, 'a');
		await userEvent.tab();
		expect(key.getAttribute('aria-invalid')).toBe('true');
		expect(onChange).not.toHaveBeenCalled();
		await replaceText(key, 'c');
		await userEvent.tab();
		expect(last()).toEqual({ a: 'x', c: 'y' });
		expect(Object.keys(last() as object)).toEqual(['a', 'c']);
	});

	test('a rename keeps the row, its focus and the order of the keys', async () => {
		const { last } = await mount({ value: { a: 1, b: 2, c: 3 } });
		const before = row(['b']);
		const key = before!.querySelector<HTMLInputElement>('[data-json-key]')!;
		await replaceText(key, 'z');
		await userEvent.keyboard('{Enter}');
		expect(Object.keys(last() as object)).toEqual(['a', 'z', 'c']);
		await expect.poll(() => row(['z'])).toBe(before);
	});

	test('propertyNames guards a new key', async () => {
		const { onChange } = await mount({
			schema: { type: 'object', propertyNames: { pattern: '^x' }, additionalProperties: true },
			value: {}
		});
		await button('Add property').click();
		await userEvent.keyboard('nope{Enter}');
		expect(onChange).not.toHaveBeenCalled();
		const key = page.getByRole('textbox', { name: 'Property name' });
		await expect.element(key).toHaveAttribute('aria-invalid', 'true');
	});

	test('closed objects and full ones offer no new key', async () => {
		const screen = await render(JsonEditorHarness, {
			props: {
				schema: { type: 'object', additionalProperties: false, properties: { a: {} } },
				value: {}
			}
		});
		expect(document.body.textContent).not.toContain('Add property');
		await screen.unmount();
		await render(JsonEditorHarness, {
			props: {
				schema: { type: 'object', additionalProperties: true, maxProperties: 1 },
				value: { a: 1 }
			}
		});
		expect(document.body.textContent).not.toContain('Add property');
	});

	test('a key the schema does not know can be taken out', async () => {
		const { last } = await mount({
			schema: {
				type: 'object',
				additionalProperties: false,
				properties: { a: { type: 'string' } }
			},
			value: { a: 'x', stray: 1 }
		});
		await button('Remove stray').click();
		expect(last()).toEqual({ a: 'x' });
	});

	test('a key required by a condition appears as the condition is met', async () => {
		await mount({
			schema: {
				type: 'object',
				properties: { kind: { enum: ['a', 'b'], title: 'Kind' } },
				if: { properties: { kind: { const: 'a' } }, required: ['kind'] },
				then: { required: ['extra'], properties: { extra: { type: 'string', title: 'Extra' } } }
			},
			value: {}
		});
		expect(row(['extra'])).toBeNull();
		await userEvent.click(row(['kind'])!.querySelector('[role="combobox"]')!);
		await page.getByRole('option', { name: 'a' }).click();
		await expect.poll(() => row(['extra'])).not.toBeNull();
		expect(control(['extra'])?.required).toBe(true);
	});
});

describe('nested objects', () => {
	test('a nested object adds keys from its own row, opening it first', async () => {
		const { last } = await mount({ value: { sub: { a: 1 } }, expandDepth: 0 });
		expect(row(['sub', 'a'])).toBeNull();
		const add = row(['sub'])!.querySelector<HTMLElement>('[aria-label="Add property"]')!;
		await userEvent.click(add);
		await expect.element(page.getByRole('textbox', { name: 'Property name' }).last()).toHaveFocus();
		await userEvent.keyboard('b{Enter}');
		expect(last()).toEqual({ sub: { a: 1, b: '' } });
	});
});

describe('arrays', () => {
	const list: JsonSchema = { type: 'array', items: { type: 'string' } };

	test('rows are added, focused, and filled', async () => {
		const { last } = await mount({ schema: list, value: ['a'] });
		await button('Add item').click();
		expect(last()).toEqual(['a', '']);
		await expect.poll(() => document.activeElement).toBe(control([1]));
		await userEvent.keyboard('b');
		expect(last()).toEqual(['a', 'b']);
	});

	test('Enter adds the next row and Backspace takes an empty one away', async () => {
		const { last } = await mount({ schema: list, value: ['a'] });
		control([0])!.focus();
		await userEvent.keyboard('{Enter}');
		expect(last()).toEqual(['a', '']);
		await expect.poll(() => document.activeElement).toBe(control([1]));
		await userEvent.keyboard('{Backspace}');
		expect(last()).toEqual(['a']);
		await expect.poll(() => document.activeElement).toBe(control([0]));
	});

	test('a new object row hands focus to its first field', async () => {
		const { last } = await mount({
			schema: {
				type: 'array',
				items: { type: 'object', properties: { name: { type: 'string' }, on: { type: 'boolean' } } }
			},
			value: []
		});
		await button('Add item').click();
		await expect.poll(() => document.activeElement).toBe(control([0, 'name']));
		await userEvent.keyboard('Ada');
		expect(last()).toEqual([{ name: 'Ada' }]);
	});

	test('a new row of switches focuses the switch', async () => {
		await mount({ schema: { type: 'array', items: { type: 'boolean' } }, value: [] });
		await button('Add item').click();
		await expect
			.poll(() => document.activeElement)
			.toBe(row([0])?.querySelector('[role="switch"]'));
	});

	test('rows are removed and keep their identity', async () => {
		const { last } = await mount({ schema: list, value: ['a', 'b', 'c'] });
		const third = row([2]);
		await button('Remove 0').click();
		expect(last()).toEqual(['b', 'c']);
		await expect.poll(() => row([1])).toBe(third);
	});

	test('the row menu duplicates and moves', async () => {
		const { last } = await mount({ schema: list, value: ['a', 'b'] });
		await page.getByRole('button', { name: 'Actions for item 0' }).click();
		await page.getByRole('menuitem', { name: 'Duplicate' }).click();
		expect(last()).toEqual(['a', 'a', 'b']);
		await page.getByRole('button', { name: 'Actions for item 2' }).click();
		await page.getByRole('menuitem', { name: 'Move up' }).click();
		expect(last()).toEqual(['a', 'b', 'a']);
	});

	test('a row previews its new place while dragged, with no indicator, and moves on drop', async () => {
		const { last } = await mount({ schema: list, value: ['a', 'b', 'c'] });
		const rows = () => [
			...document.querySelectorAll<HTMLElement>('[data-slot="json-editor-rows"] li')
		];
		const grip = rows()[0]!.querySelector<HTMLElement>('[data-dnd-handle]')!;
		await userEvent.dragAndDrop(grip, rows()[2]!, { targetPosition: { x: 40, y: 28 } });
		await expect.poll(() => last()).toEqual(['b', 'c', 'a']);
		expect(document.querySelector('[data-dnd-indicator]')).toBeNull();
	});

	test('a list is a sortable list, with no card around its rows', async () => {
		await mount({ schema: list, value: ['a', 'b'] });
		const row = document.querySelector<HTMLElement>('[data-slot="json-editor-rows"] li')!;
		const style = getComputedStyle(row);
		expect(style.borderTopWidth).toBe('0px');
		expect(style.paddingTop).toBe('0px');
		expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(getComputedStyle(row.parentElement!).rowGap).toBe('0px');
	});

	test('a list that cannot move is not dimmed', async () => {
		await mount({ schema: list, value: ['a'] });
		const row = document.querySelector<HTMLElement>('[data-slot="json-editor-rows"] li')!;
		expect(getComputedStyle(row).opacity).toBe('1');
	});

	test('the chevron ends the line of an object, and a row has no hover background', async () => {
		await mount({
			schema: {
				type: 'object',
				properties: { o: { type: 'object', properties: { a: { type: 'string' } } } }
			},
			value: { o: { a: 'x' } }
		});
		const toggle = document.querySelector<HTMLElement>('[data-json-toggle]')!;
		const row = toggle.closest<HTMLElement>('[data-slot="json-editor-row"]')!;
		expect(toggle.closest('[data-json-value]')).not.toBeNull();
		const value = row.querySelector<HTMLElement>('[data-json-value]')!.getBoundingClientRect();
		expect(Math.abs(toggle.getBoundingClientRect().right - value.right)).toBeLessThanOrEqual(1);
		expect(row.classList.contains('state-layer')).toBe(false);
	});

	test('arrow keys on the grip move the row', async () => {
		const { last } = await mount({ schema: list, value: ['a', 'b'] });
		const grip = document.querySelector<HTMLElement>('[data-dnd-handle]')!;
		grip.focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(last()).toEqual(['b', 'a']);
		await expect.poll(() => document.activeElement).toBe(grip);
	});

	test('Alt+arrow in a control moves its row', async () => {
		const { last } = await mount({ schema: list, value: ['a', 'b'] });
		const input = control([1])!;
		input.focus();
		await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
		expect(last()).toEqual(['b', 'a']);
		await expect.poll(() => document.activeElement).toBe(input);
	});

	test('a moved row keeps its state', async () => {
		const { last } = await mount({
			schema: {
				type: 'array',
				items: { type: 'object', properties: { n: { type: 'number' } } }
			},
			value: [{ n: 1 }, { n: 2 }]
		});
		await button('Collapse 0').click();
		await page.getByRole('button', { name: 'Actions for item 0' }).click();
		await page.getByRole('menuitem', { name: 'Move down' }).click();
		expect(last()).toEqual([{ n: 2 }, { n: 1 }]);
		await expect.element(button('Expand 1')).toBeVisible();
	});

	test('new rows take the shape of the schema', async () => {
		const { last } = await mount({
			schema: {
				type: 'array',
				items: {
					type: 'object',
					required: ['kind', 'tags'],
					properties: {
						kind: { const: 'x' },
						tags: { type: 'array', items: { type: 'string' } },
						name: { type: 'string' }
					}
				}
			},
			value: []
		});
		await button('Add item').click();
		expect(last()).toEqual([{ kind: 'x', tags: [] }]);
		expect(row([0, 'name'])).not.toBeNull();
	});

	test('maxItems stops adding, minItems stops removing', async () => {
		await mount({ schema: { ...(list as object), minItems: 1, maxItems: 2 }, value: ['a'] });
		expect(row([0])?.querySelector('[aria-label="Remove 0"]')).toBeNull();
		await button('Add item').click();
		expect(document.body.textContent).not.toContain('Add item');
		expect(row([0])?.querySelector('[aria-label="Remove 0"]')).not.toBeNull();
	});

	test('a tuple keeps its positions and offers no more rows when closed', async () => {
		await mount({
			schema: {
				type: 'array',
				prefixItems: [{ type: 'string', title: 'First' }, { type: 'number' }],
				items: false
			},
			value: ['a', 1]
		});
		expect(control([1])?.getAttribute('role')).toBe('spinbutton');
		expect(document.body.textContent).not.toContain('Add item');
		expect(document.querySelector('[aria-label="Remove 0"]')).toBeNull();
	});

	test('unique options are one multiple choice, not rows', async () => {
		const { last } = await mount({
			schema: {
				type: 'object',
				properties: {
					caps: { type: 'array', uniqueItems: true, items: { enum: ['a', 'b', 'c'] } }
				}
			},
			value: { caps: ['a'] }
		});
		expect(row(['caps', 0])).toBeNull();
		await userEvent.click(row(['caps'])!.querySelector('[role="combobox"]')!);
		await page.getByRole('option', { name: 'b' }).click();
		expect(last()).toEqual({ caps: ['a', 'b'] });
	});

	test('a duplicate is called out on the row that repeats', async () => {
		await mount({
			schema: { type: 'array', uniqueItems: true, items: { type: 'number' } },
			value: [1, 1],
			validationMode: 'change'
		});
		await expect.element(page.getByText('This item is a duplicate')).toBeVisible();
		expect(row([1])?.dataset.invalid).toBe('');
		expect(row([0])?.dataset.invalid).toBeUndefined();
	});
});

describe('unions', () => {
	const schema: JsonSchema = {
		type: 'object',
		properties: {
			pay: {
				title: 'Pay',
				oneOf: [
					{
						title: 'Card',
						type: 'object',
						required: ['kind', 'number'],
						properties: { kind: { const: 'card' }, number: { type: 'string' } }
					},
					{
						title: 'Transfer',
						type: 'object',
						required: ['kind', 'iban'],
						properties: { kind: { const: 'iban' }, iban: { type: 'string' } }
					}
				]
			}
		}
	};

	test('the value picks the branch, and the picker switches it', async () => {
		const { last } = await mount({ schema, value: { pay: { kind: 'iban', iban: 'FR76' } } });
		const picker = page.getByRole('combobox', { name: 'Variant' });
		await expect.element(picker).toHaveTextContent('Transfer');
		expect(row(['pay', 'iban'])).not.toBeNull();
		await picker.click();
		await page.getByRole('option', { name: 'Card' }).click();
		expect(last()).toEqual({ pay: { kind: 'card' } });
		await expect.poll(() => row(['pay', 'number'])).not.toBeNull();
		await expect.poll(() => row(['pay', 'iban'])).toBeNull();
	});

	test('a nullable type can be switched to null and back', async () => {
		const { last } = await mount({
			schema: { type: 'object', properties: { n: { type: ['string', 'null'], title: 'N' } } },
			value: { n: 'a' }
		});
		await page.getByRole('button', { name: /Change the type of N/ }).click();
		await page.getByRole('menuitem', { name: 'Null' }).click();
		expect(last()).toEqual({ n: null });
		await expect.poll(() => control(['n'])).toBeNull();
		await page.getByRole('button', { name: /Change the type of N/ }).click();
		await page.getByRole('menuitem', { name: 'Text' }).click();
		expect(last()).toEqual({ n: '' });
	});
});

describe('references', () => {
	test('a recursive schema opens as far as the value goes', async () => {
		const { last } = await mount({
			schema: {
				$defs: {
					tree: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							children: { type: 'array', items: { $ref: '#/$defs/tree' } }
						}
					}
				},
				$ref: '#/$defs/tree'
			},
			value: { name: 'root', children: [{ name: 'leaf' }] }
		});
		expect(control(['children', 0, 'name'])?.value).toBe('leaf');
		await replaceText(control(['children', 0, 'name']), 'x');
		expect(last()).toEqual({ name: 'root', children: [{ name: 'x' }] });
	});
});

describe('problems', () => {
	const schema: JsonSchema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', title: 'Name', pattern: '^[a-z]+$' },
			sub: { type: 'object', required: ['n'], properties: { n: { type: 'number', title: 'N' } } }
		}
	};

	test('nothing shows until a value has been left', async () => {
		await mount({ schema, value: { name: 'BAD' } });
		expect(document.body.textContent).not.toContain('expected format');
		control(['name'])!.focus();
		await userEvent.tab();
		await expect.element(page.getByText('This does not match the expected format')).toBeVisible();
		expect(control(['name'])?.getAttribute('aria-invalid')).toBe('true');
		await replaceText(control(['name']), 'good');
		await expect.poll(() => control(['name'])?.getAttribute('aria-invalid')).toBeNull();
	});

	test('validationMode change shows them at once', async () => {
		await mount({ schema, value: { name: 'BAD' }, validationMode: 'change' });
		await expect.element(page.getByText('This does not match the expected format')).toBeVisible();
	});

	test('validate reveals everything and opens the rows that hold a problem', async () => {
		let api: JsonEditorApi | undefined;
		const screen = await render(JsonEditorHarness, {
			props: {
				schema,
				value: { name: 'ok', sub: {} },
				expandDepth: 0,
				get api() {
					return api;
				},
				set api(next) {
					api = next;
				}
			}
		});
		void screen;
		await tick();
		expect(row(['sub', 'n'])).toBeNull();
		expect(api?.validate()).toBe(false);
		await expect.poll(() => row(['sub', 'n'])).not.toBeNull();
		await expect.element(page.getByText('This field is required').first()).toBeVisible();
	});

	test('the issue count in the toolbar goes to the first problem', async () => {
		await mount({ schema, value: { name: 'BAD' }, validationMode: 'change' });
		await button('1 problem').click();
		expect(document.activeElement).toBe(control(['name']));
	});

	test('a collapsed row says it holds a problem', async () => {
		await mount({
			schema,
			value: { name: 'ok', sub: {} },
			validationMode: 'change'
		});
		await button('Collapse sub').click();
		await expect.element(page.getByText('1 problem', { exact: true }).last()).toBeVisible();
	});

	test('the messages follow the locale catalog', async () => {
		await mount({
			schema,
			value: {},
			validationMode: 'change',
			messages: { required: 'Say something' }
		});
		await expect.element(page.getByText('Say something').first()).toBeVisible();
	});

	test('onIssuesChange reports the list as it changes', async () => {
		const onIssuesChange = vi.fn();
		await mount({ schema, value: { name: 'ok', sub: { n: 1 } }, onIssuesChange });
		expect(onIssuesChange).not.toHaveBeenCalled();
		await replaceText(control(['name']), 'BAD');
		expect(onIssuesChange.mock.lastCall?.[0]).toMatchObject([
			{ path: ['name'], code: 'pattern', text: 'This does not match the expected format' }
		]);
	});
});

describe('without a schema', () => {
	const value = {
		title: 'Report',
		mail: 'ada@acme.dev',
		day: '2024-05-01',
		count: 3,
		on: true,
		none: null,
		list: ['a', 'b'],
		sub: { x: 1 },
		rows: [{ name: 'one', n: 1 }]
	};

	test('each value gets the control its look calls for', async () => {
		await mount({ value });
		expect(control(['title'])?.type).toBe('text');
		expect(control(['mail'])?.type).toBe('email');
		expect(control(['day'])?.value).toBe('2024-05-01');
		expect(control(['count'])?.getAttribute('role')).toBe('spinbutton');
		expect(row(['on'])?.querySelector('[role="switch"]')).not.toBeNull();
		expect(row(['none'])?.textContent).toContain('null');
		expect(row(['list', 1])).not.toBeNull();
		expect(row(['sub', 'x'])).not.toBeNull();
	});

	test('nothing is reported: the value is what it means', async () => {
		await mount({ value, validationMode: 'change' });
		expect(document.querySelector('[data-invalid]')).toBeNull();
	});

	test('a key is renamed, and removed', async () => {
		const { last } = await mount({ value: { a: 1 } });
		await replaceText(row(['a'])!.querySelector('[data-json-key]'), 'b');
		await userEvent.tab();
		expect(last()).toEqual({ b: 1 });
		await button('Remove b').click();
		expect(last()).toEqual({});
	});

	test('a type is changed, with the value carried over as far as it can be', async () => {
		const { last } = await mount({ value: { a: '12' } });
		await page.getByRole('button', { name: /Change the type of a/ }).click();
		await page.getByRole('menuitem', { name: 'Number', exact: true }).click();
		expect(last()).toEqual({ a: 12 });
		await expect.poll(() => control(['a'])?.getAttribute('role')).toBe('spinbutton');
		await page.getByRole('button', { name: /Change the type of a/ }).click();
		await page.getByRole('menuitem', { name: 'List' }).click();
		expect(last()).toEqual({ a: [12] });
		await expect.poll(() => row(['a', 0])).not.toBeNull();
	});

	test('a new row looks like its siblings', async () => {
		const { last } = await mount({ value: { rows: [{ name: 'one', n: 1, on: true }] } });
		await button('Add item').click();
		expect(last()).toEqual({
			rows: [
				{ name: 'one', n: 1, on: true },
				{ name: '', n: 0, on: false }
			]
		});
	});

	test('emptying a text keeps the key: the editor cannot know it is optional', async () => {
		const { last } = await mount({ value: { a: 'x' } });
		await userEvent.clear(control(['a'])!);
		expect(last()).toEqual({ a: '' });
	});

	test('a control does not change under the user as the text stops looking like an email', async () => {
		const { last } = await mount({ value: { a: 'x@y.co' } });
		const input = control(['a']);
		await replaceText(input, 'plain');
		expect(last()).toEqual({ a: 'plain' });
		expect(control(['a'])).toBe(input);
		expect(document.activeElement).toBe(input);
		expect(input?.type).toBe('email');
	});

	test('no value at all starts as an empty object', async () => {
		const { last } = await mount({});
		await button('Add property').click();
		await userEvent.keyboard('a{Enter}');
		expect(last()).toEqual({ a: '' });
	});

	test('a root list has rows and a root scalar has its control', async () => {
		const screen = await render(JsonEditorHarness, { props: { value: [1, 2] } });
		expect(row([1])).not.toBeNull();
		await screen.unmount();
		await render(JsonEditorHarness, { props: { value: 'hello' } });
		expect(control([])?.value).toBe('hello');
	});

	test('a value handed in from outside is read again', async () => {
		const screen = await render(JsonEditorHarness, { props: { value: { a: 'plain' } } });
		expect(control(['a'])?.type).toBe('text');
		await screen.rerender({ value: { a: 'x@y.co' } });
		await expect.poll(() => control(['a'])?.type).toBe('email');
	});
});

describe('the JSON view', () => {
	const toJson = () => page.getByRole('radio', { name: 'JSON' }).click();
	const area = () =>
		document.querySelector<HTMLTextAreaElement>('[data-slot="json-editor-raw"] textarea');

	test('shows the value, and edits it', async () => {
		const { last } = await mount({ value: { a: 1 } });
		await toJson();
		await expect.poll(() => area()?.value).toBe('{\n  "a": 1\n}');
		area()!.focus();
		await userEvent.clear(area()!);
		await userEvent.fill(area()!, '{"b":2}');
		expect(last()).toEqual({ b: 2 });
	});

	test('text that does not parse stays a draft and changes nothing', async () => {
		const { onChange } = await mount({ value: { a: 1 } });
		await toJson();
		await userEvent.fill(area()!, '{"a":');
		await expect.element(page.getByText('This is not valid JSON')).toBeVisible();
		expect(onChange).not.toHaveBeenCalled();
	});

	test('lists the problems of what parses', async () => {
		await mount({
			schema: { type: 'object', properties: { n: { type: 'number' } } },
			value: { n: 1 }
		});
		await toJson();
		await userEvent.fill(area()!, '{"n":"x"}');
		await expect.element(page.getByText(/Expected: Number/)).toBeVisible();
	});

	test('the tree picks up what was typed', async () => {
		await mount({ value: { a: 1 } });
		await toJson();
		await userEvent.fill(area()!, '{"z":"x@y.co"}');
		await page.getByRole('radio', { name: 'Tree' }).click();
		await expect.poll(() => control(['z'])?.value).toBe('x@y.co');
	});
});

describe('locked', () => {
	const schema: JsonSchema = {
		type: 'object',
		properties: {
			a: { type: 'string' },
			list: { type: 'array', items: { type: 'string' } },
			keys: { type: 'object', additionalProperties: { type: 'string' } },
			lockedOne: { type: 'string', readOnly: true }
		}
	};
	const value = { a: 'x', list: ['y'], keys: { k: 'v' }, lockedOne: 'z' };

	test('read-only keeps everything readable and offers no edit', async () => {
		await mount({ schema, value, readOnly: true });
		expect(control(['a'])?.readOnly).toBe(true);
		expect(control(['a'])?.disabled).toBe(false);
		expect(document.querySelector('[data-dnd-handle]')).toBeNull();
		expect(document.body.textContent).not.toContain('Add item');
		expect(document.body.textContent).not.toContain('Add property');
		expect(document.querySelector('[aria-label^="Clear"]')).toBeNull();
		expect(document.querySelector('[aria-label^="Remove"]')).toBeNull();
		expect(row(['keys', 'k'])?.querySelector<HTMLInputElement>('[data-json-key]')?.readOnly).toBe(
			true
		);
	});

	test('disabled disables the controls', async () => {
		await mount({ schema, value, disabled: true });
		await expect.poll(() => control(['a'])?.matches(':disabled')).toBe(true);
		expect(document.querySelector('[data-dnd-handle]')).toBeNull();
	});

	test('the readOnly keyword locks one value', async () => {
		await mount({ schema, value });
		expect(control(['lockedOne'])?.readOnly).toBe(true);
		expect(control(['a'])?.readOnly).toBe(false);
	});
});

describe('props', () => {
	const schema: JsonSchema = {
		type: 'object',
		properties: { a: { type: 'string', description: 'About a' }, b: { type: 'boolean' } }
	};

	test('typeIcons takes the icons away', async () => {
		await mount({ schema, value: {}, typeIcons: false });
		expect(row(['a'])?.querySelector('svg')).toBeNull();
	});

	test('controls keeps the toolbar it is told to', async () => {
		const screen = await render(JsonEditorHarness, {
			props: { schema, value: {}, controls: false }
		});
		expect(document.querySelector('[data-slot="json-editor-toolbar"]')).toBeNull();
		await screen.unmount();
		await render(JsonEditorHarness, { props: { schema, value: {}, controls: ['copy'] } });
		expect(document.querySelector('[aria-label="Copy JSON"]')).not.toBeNull();
		expect(document.querySelector('[aria-label="Expand all"]')).toBeNull();
		expect(document.querySelector('[role="radiogroup"]')).toBeNull();
	});

	test('descriptions go inline, behind an icon, or nowhere', async () => {
		const screen = await render(JsonEditorHarness, { props: { schema, value: {} } });
		await expect.element(page.getByText('About a')).toBeVisible();
		await screen.unmount();
		const tip = await render(JsonEditorHarness, {
			props: { schema, value: {}, descriptions: 'tooltip' }
		});
		expect(document.querySelector('[aria-label="About a"]')).not.toBeNull();
		await tip.unmount();
		await render(JsonEditorHarness, { props: { schema, value: {}, descriptions: 'none' } });
		expect(document.body.textContent).not.toContain('About a');
	});

	test('defaultValue starts it, and the schema starts it without one', async () => {
		const first = await render(JsonEditorHarness, { props: { schema, defaultValue: { a: 'x' } } });
		expect(control(['a'])?.value).toBe('x');
		await first.unmount();
		await render(JsonEditorHarness, {
			props: { schema: { type: 'object', properties: { n: { type: 'number', default: 7 } } } }
		});
		expect(control(['n'])?.value).toBe('7');
	});

	test('an outside value updates the rows without an edit being reported', async () => {
		const onChange = vi.fn();
		const screen = await render(JsonEditorHarness, {
			props: { schema, value: { a: 'x' }, onChange }
		});
		await screen.rerender({ value: { a: 'y' } });
		await expect.poll(() => control(['a'])?.value).toBe('y');
		expect(onChange).not.toHaveBeenCalled();
	});

	test('keyWidth moves the columns of every row', async () => {
		await mount({ schema, value: {}, keyWidth: '120px' });
		expect(row(['a'])?.style.gridTemplateColumns).toContain('120px');
	});

	test('a label names the group', async () => {
		await mount({ schema, value: {}, label: 'Settings' });
		await expect.element(page.getByRole('group', { name: 'Settings' })).toBeVisible();
	});
});

describe('undo and redo', () => {
	const undo = () => userEvent.keyboard('{Control>}z{/Control}');
	const redo = () => userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
	const text = {
		type: 'object',
		properties: { a: { type: 'string' }, b: { type: 'string' } }
	} as const;
	const items = { type: 'array', items: { type: 'string' } } as const;
	const pause = () => new Promise((resolve) => setTimeout(resolve, 900));

	test('takes back what was typed as one edit, and puts it back', async () => {
		const { last } = await mount({ schema: text, value: { a: 'x', b: 'y' } });
		control(['a'])!.focus();
		await userEvent.keyboard('{End}123');
		expect(last()).toEqual({ a: 'x123', b: 'y' });
		await undo();
		expect(last()).toEqual({ a: 'x', b: 'y' });
		await expect.poll(() => control(['a'])!.value).toBe('x');
		await expect.poll(() => document.activeElement).toBe(control(['a']));
		await redo();
		expect(last()).toEqual({ a: 'x123', b: 'y' });
		await expect.poll(() => control(['a'])!.value).toBe('x123');
	});

	test('a pause starts a new edit', async () => {
		const { last } = await mount({ schema: text, value: { a: '', b: '' } });
		control(['a'])!.focus();
		await userEvent.keyboard('one');
		await pause();
		await userEvent.keyboard('two');
		await undo();
		expect(last()).toEqual({ a: 'one', b: '' });
		await undo();
		expect(last()).toEqual({ a: '', b: '' });
	});

	test('steps back through several fields and goes to what came back', async () => {
		const { last } = await mount({ schema: text, value: { a: '', b: '' } });
		control(['a'])!.focus();
		await userEvent.keyboard('A');
		control(['b'])!.focus();
		await userEvent.keyboard('B');
		await undo();
		expect(last()).toEqual({ a: 'A', b: '' });
		await undo();
		expect(last()).toEqual({ a: '', b: '' });
		await expect.poll(() => document.activeElement).toBe(control(['a']));
	});

	test('takes back an added row and leaves focus in the editor', async () => {
		const { last } = await mount({ schema: items, value: ['a'] });
		await button('Add item').click();
		expect(last()).toEqual(['a', '']);
		await undo();
		expect(last()).toEqual(['a']);
		await expect.poll(() => row([1])).toBeNull();
		await expect
			.poll(() =>
				document.querySelector('[data-slot="json-editor"]')!.contains(document.activeElement)
			)
			.toBe(true);
		await redo();
		expect(last()).toEqual(['a', '']);
	});

	test('takes back a removed row and a move', async () => {
		const { last } = await mount({ schema: items, value: ['a', 'b', 'c'] });
		control([0])!.focus();
		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
		expect(last()).toEqual(['b', 'a', 'c']);
		await undo();
		expect(last()).toEqual(['a', 'b', 'c']);
		await button('Remove 1').click();
		expect(last()).toEqual(['a', 'c']);
		await undo();
		expect(last()).toEqual(['a', 'b', 'c']);
		await expect.poll(() => control([1])!.value).toBe('b');
	});

	test('opens a closed row to show what came back', async () => {
		const nested = {
			type: 'object',
			properties: { o: { type: 'object', properties: { a: { type: 'string' } } } }
		} as const;
		const { last } = await mount({ schema: nested, value: { o: { a: '' } } });
		control(['o', 'a'])!.focus();
		await userEvent.keyboard('x');
		await button('Collapse o').click();
		await expect.poll(() => control(['o', 'a'])).toBeNull();
		await undo();
		expect(last()).toEqual({ o: { a: '' } });
		await expect.poll(() => control(['o', 'a'])).not.toBeNull();
	});

	test('a field that keeps its text while focused shows what came back', async () => {
		const color = {
			type: 'object',
			properties: { c: { type: 'string', format: 'color' } }
		} as const;
		const { last } = await mount({ schema: color, value: { c: '#112233' } });
		const input = () =>
			row(['c'])!.querySelector<HTMLInputElement>('input[aria-label="Color value"]')!;
		await userEvent.click(input());
		await userEvent.fill(input(), '#445566');
		expect(last()).toEqual({ c: '#445566' });
		await undo();
		expect(last()).toEqual({ c: '#112233' });
		await expect.poll(() => input().value).toBe('#112233');
	});

	test('a new edit clears what could be put back', async () => {
		const { last } = await mount({ schema: text, value: { a: '', b: '' } });
		control(['a'])!.focus();
		await userEvent.keyboard('x');
		await undo();
		await pause();
		control(['b'])!.focus();
		await userEvent.keyboard('y');
		await redo();
		expect(last()).toEqual({ a: '', b: 'y' });
	});

	test('a change from outside clears the history', async () => {
		const { last, screen } = await mount({ schema: text, value: { a: '', b: '' } });
		control(['a'])!.focus();
		await userEvent.keyboard('x');
		await screen.rerender({ value: { a: 'outside', b: '' } });
		await expect.poll(() => control(['a'])!.value).toBe('outside');
		const before = last();
		control(['a'])!.focus();
		await undo();
		expect(last()).toEqual(before);
		expect(control(['a'])!.value).toBe('outside');
	});

	test('does nothing when read-only', async () => {
		const { onChange } = await mount({ schema: text, value: { a: 'x', b: '' }, readOnly: true });
		control(['a'])!.focus();
		await undo();
		expect(onChange).not.toHaveBeenCalled();
	});

	test('a key still being named keeps its own undo', async () => {
		const { last } = await mount({ value: { one: 'x' } });
		const key = () => document.querySelector<HTMLInputElement>('[data-json-key]')!;
		control(['one'])!.focus();
		await userEvent.keyboard('y');
		key().focus();
		await userEvent.keyboard('z');
		await undo();
		expect(last()).toEqual({ one: 'xy' });
	});

	test('the JSON view keeps its own undo', async () => {
		const { last } = await mount({ value: { a: 1 }, mode: 'json' });
		const area = document.querySelector<HTMLTextAreaElement>('textarea')!;
		area.focus();
		const pressed = new KeyboardEvent('keydown', {
			key: 'z',
			ctrlKey: true,
			bubbles: true,
			cancelable: true
		});
		area.dispatchEvent(pressed);
		expect(pressed.defaultPrevented).toBe(false);
		expect(last()).toBeUndefined();
	});
});

describe('in forms', () => {
	const schema: JsonSchema = {
		type: 'object',
		required: ['name'],
		properties: { name: { type: 'string', title: 'Name' }, n: { type: 'number', title: 'N' } }
	};

	test('a Form holds it as one field: rows register nothing and a problem stops the submit', async () => {
		const onSubmit = vi.fn();
		await render(JsonEditorFormHarness, { props: { schema, value: { n: 1 }, onSubmit } });
		await button('Submit the Form').click();
		expect(onSubmit).not.toHaveBeenCalled();
		await expect.element(page.getByText('This field is required').first()).toBeVisible();
		const name = document.querySelector<HTMLInputElement>(`[data-json-path='["name"]'] input`);
		await userEvent.type(name!, 'Ada');
		await button('Submit the Form').click();
		await expect.poll(() => onSubmit.mock.lastCall?.[0]).toEqual({ config: { n: 1, name: 'Ada' } });
	});

	test('a native form gets the JSON under the name, and nothing from the rows', async () => {
		const onNativeSubmit = vi.fn<(data: FormData) => void>();
		await render(JsonEditorFormHarness, {
			props: { schema, value: { name: 'Ada', n: 1 }, onNativeSubmit }
		});
		await button('Submit natively').click();
		await expect.poll(() => onNativeSubmit.mock.calls.length).toBe(1);
		const data = onNativeSubmit.mock.calls[0][0];
		expect([...data.keys()]).toEqual(['payload']);
		expect(JSON.parse(String(data.get('payload')))).toEqual({ name: 'Ada', n: 1 });
	});
});
