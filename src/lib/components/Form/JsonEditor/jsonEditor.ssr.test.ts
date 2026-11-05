// The server renders the same rows the browser will, from the schema or from the value alone.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import JsonEditorHarness from './JsonEditorHarness.test.svelte';

const schema = {
	type: 'object',
	required: ['name'],
	properties: {
		name: { type: 'string', title: 'Name' },
		count: { type: 'integer', default: 3 },
		day: { type: 'string', format: 'date' },
		at: { type: 'string', format: 'date-time' },
		color: { type: 'string', format: 'color' },
		pick: { enum: ['a', 'b'] },
		on: { type: 'boolean' },
		list: { type: 'array', items: { type: 'string' } },
		sub: { type: 'object', properties: { deep: { type: 'string' } } }
	}
} as const;

describe('JsonEditor on the server', () => {
	test('renders rows from a schema, with what the value holds', async () => {
		const { body } = await render(JsonEditorHarness, {
			props: {
				schema: schema as never,
				value: { name: 'Ada', list: ['x'], sub: { deep: 'y' }, day: '2024-05-01' }
			}
		});
		expect(body).toContain('data-json-path');
		expect(body).toContain('value="Ada"');
		expect(body).toContain('value="x"');
		expect(body).toContain('value="y"');
		expect(body).toContain('2024-05-01');
	});

	test('renders rows from the value alone', async () => {
		const { body } = await render(JsonEditorHarness, {
			props: { value: { mail: 'a@b.co', n: 1, on: true, none: null, list: [1] } }
		});
		expect(body).toContain('type="email"');
		expect(body).toContain('null');
	});

	test('starts from the schema without a value', async () => {
		const { body } = await render(JsonEditorHarness, { props: { schema: schema as never } });
		expect(body).toContain('value="3"');
	});

	test('publishes no api on the server', async () => {
		let published: unknown;
		await render(JsonEditorHarness, {
			props: {
				value: {},
				get api() {
					return published as never;
				},
				set api(next) {
					published = next;
				}
			}
		});
		expect(published).toBeUndefined();
	});
});
