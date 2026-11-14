// The server markup names and describes a field's control: Field computes the label, description,
// required, read-only and invalid attributes while it renders, instead of writing them on the
// element from an effect once the page has loaded.
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import { renderInThemeServer } from '../../Theme/renderInThemeServer.test-helper.js';
import TextInput from '../TextInput/TextInput.svelte';
import Select from '../Select/Select.svelte';

const serverRender = async (component: unknown, props: Record<string, unknown>) =>
	(await renderInThemeServer(component as Component<Record<string, unknown>>, props)).body;

// The attributes of the first element matching the tag and attribute test, parsed from the markup.
const elementAttributes = (html: string, tag: string, has: string) => {
	const pattern = new RegExp(`<${tag}\\b[^>]*${has}[^>]*>`, 'g');
	const source = html.match(pattern)?.[0];
	if (!source) throw new Error(`No <${tag}> with ${has} in:\n${html}`);
	const attributes: Record<string, string> = {};
	for (const [, name, value] of source.matchAll(/\s([\w:-]+)(?:="([^"]*)")?/g)) {
		attributes[name] = value ?? '';
	}
	return attributes;
};

const items = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' }
];

describe('Field attributes in server markup', () => {
	test('a TextInput is labelled, described, required and invalid on the server', async () => {
		const html = await serverRender(TextInput, {
			id: 'email',
			label: 'Email',
			description: 'Work address',
			helper: 'We never share it',
			required: true,
			errors: ['Enter an email'],
			inputAttrs: { 'aria-describedby': 'app-hint' }
		});
		const input = elementAttributes(html, 'input', 'id="email"');
		expect(input['aria-describedby']).toBe('app-hint email-description email-helper email-errors');
		expect(input['aria-invalid']).toBe('true');
		expect(input).toHaveProperty('required');
		// A native input carries `required` itself.
		expect(input).not.toHaveProperty('aria-required');
		expect(elementAttributes(html, 'label', 'for=')).toMatchObject({
			for: 'email',
			id: 'email-label'
		});
		expect(html).toContain('id="email-description"');
		expect(html).toContain('id="email-helper"');
		expect(html).toContain('id="email-errors"');
	});

	test('a read-only TextInput carries the native readonly attribute on the server', async () => {
		const html = await serverRender(TextInput, { id: 'name', label: 'Name', readOnly: true });
		const input = elementAttributes(html, 'input', 'id="name"');
		expect(input).toHaveProperty('readonly');
		expect(input).not.toHaveProperty('aria-invalid');
		expect(input).not.toHaveProperty('aria-describedby');
	});

	test('a Select trigger is labelled, required, read-only and invalid on the server', async () => {
		const html = await serverRender(Select, {
			id: 'fruit',
			label: 'Fruit',
			description: 'Pick one',
			items,
			required: true,
			readOnly: true,
			errors: ['Choose a fruit']
		});
		const trigger = elementAttributes(html, 'button', 'id="fruit"');
		expect(trigger.role).toBe('combobox');
		expect(trigger['aria-labelledby']?.split(' ')).toContain('fruit-label');
		expect(trigger['aria-describedby']).toBe('fruit-description fruit-errors');
		expect(trigger['aria-required']).toBe('true');
		expect(trigger['aria-readonly']).toBe('true');
		expect(trigger['aria-invalid']).toBe('true');
		expect(html).toContain('id="fruit-label"');
	});
});
